import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to encode base64
function encodeBase64(str: string): string {
  return btoa(str);
}

// Helper function to refresh token if needed
async function refreshTokenIfNeeded(
  supabase: any,
  tokenData: any,
  realmId: string
): Promise<string> {
  const expiresAt = new Date(tokenData.expires_at);
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000);

  if (expiresAt > fiveMinutesFromNow) {
    return tokenData.access_token;
  }

  console.log('Token expiring soon, refreshing...');

  const { data: company } = await supabase
    .from('quickbooks_companies')
    .select('client_id, client_secret')
    .eq('realm_id', realmId)
    .single();

  if (!company) {
    throw new Error('Company not found for token refresh');
  }

  const credentials = encodeBase64(`${company.client_id}:${company.client_secret}`);

  const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokenData.refresh_token,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to refresh token');
  }

  const newTokens = await tokenResponse.json();
  const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000);

  await supabase
    .from('oauth_tokens')
    .update({
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token,
      expires_at: newExpiresAt.toISOString(),
    })
    .eq('realm_id', realmId);

  console.log('Token refreshed successfully');
  return newTokens.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting QB sync process');

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { realm_id: realmId, sync_type } = await req.json();
    
    if (!realmId) {
      throw new Error('realm_id is required');
    }

    console.log(`Syncing data for realm: ${realmId}, type: ${sync_type || 'all'}`);

    // Get token data
    const { data: tokenData, error: tokenError } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('realm_id', realmId)
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenData) {
      throw new Error('No OAuth tokens found for this realm');
    }

    // Refresh token if needed
    const accessToken = await refreshTokenIfNeeded(supabase, tokenData, realmId);

    // Create sync log
    const { data: syncLog } = await supabase
      .from('sync_logs')
      .insert({
        realm_id: realmId,
        sync_type: sync_type || 'all',
        status: 'in_progress',
      })
      .select()
      .single();

    let totalRecords = 0;
    const errors: string[] = [];

    try {
      // Sync Balance Sheet
      if (!sync_type || sync_type === 'balance_sheet' || sync_type === 'all') {
        console.log('Fetching Balance Sheet...');
        const balanceResponse = await fetch(
          `https://quickbooks.api.intuit.com/v3/company/${realmId}/reports/BalanceSheet?minorversion=65`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json',
            },
          }
        );

        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          await supabase.from('financial_data').insert({
            realm_id: realmId,
            report_type: 'balance_sheet',
            period: new Date().toISOString().slice(0, 7), // YYYY-MM
            data: balanceData,
          });
          totalRecords++;
          console.log('Balance Sheet synced successfully');
        } else {
          errors.push(`Balance Sheet: ${balanceResponse.statusText}`);
        }
      }

      // Sync Profit & Loss
      if (!sync_type || sync_type === 'profit_loss' || sync_type === 'all') {
        console.log('Fetching Profit & Loss...');
        const plResponse = await fetch(
          `https://quickbooks.api.intuit.com/v3/company/${realmId}/reports/ProfitAndLoss?minorversion=65`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json',
            },
          }
        );

        if (plResponse.ok) {
          const plData = await plResponse.json();
          await supabase.from('financial_data').insert({
            realm_id: realmId,
            report_type: 'profit_loss',
            period: new Date().toISOString().slice(0, 7), // YYYY-MM
            data: plData,
          });
          totalRecords++;
          console.log('Profit & Loss synced successfully');
        } else {
          errors.push(`Profit & Loss: ${plResponse.statusText}`);
        }
      }

      // Update sync log
      await supabase
        .from('sync_logs')
        .update({
          status: errors.length > 0 ? 'error' : 'success',
          error_message: errors.length > 0 ? errors.join('; ') : null,
          records_synced: totalRecords,
        })
        .eq('id', syncLog.id);

      return new Response(
        JSON.stringify({
          success: true,
          records_synced: totalRecords,
          errors: errors.length > 0 ? errors : undefined,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (syncError: any) {
      // Update sync log with error
      await supabase
        .from('sync_logs')
        .update({
          status: 'error',
          error_message: syncError.message,
        })
        .eq('id', syncLog.id);

      throw syncError;
    }
  } catch (error: any) {
    console.error('QB Sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
