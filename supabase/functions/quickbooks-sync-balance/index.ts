import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function encodeBase64(str: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  return base64Encode(data);
}

async function refreshTokenIfNeeded(supabase: any, companyId: string, tokenData: any, company: any) {
  const tokenExpiry = new Date(tokenData.token_expiry);
  const now = new Date();

  if (tokenExpiry.getTime() - now.getTime() < 5 * 60 * 1000) {
    const authString = `${company.client_id}:${company.client_secret}`;
    const authHeader = `Basic ${encodeBase64(authString)}`;

    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeader,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokenData.refresh_token,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(`Token refresh failed: ${JSON.stringify(tokens)}`);
    }

    await supabase
      .from('quickbooks_tokens')
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      })
      .eq('company_id', companyId);

    return tokens.access_token;
  }

  return tokenData.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create client with user auth for verification
    const userSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    // Create service role client for database operations (needed to bypass RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Get body
    const body = await req.json();
    const companyId = body.companyId;

    if (!companyId) {
      throw new Error('Company ID is required');
    }

    // Verify user has access to this company
    const { data: accessCheck, error: accessError } = await userSupabase
      .from('company_users')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .maybeSingle();

    if (accessError || !accessCheck) {
      throw new Error('Access denied to this company');
    }

    console.log('Syncing balance sheet for company:', companyId);

    const { data: company, error: companyError } = await supabase
      .from('quickbooks_companies')
      .select('realm_id, client_id, client_secret')
      .eq('id', companyId)
      .single();

    if (companyError || !company || !company.realm_id) {
      throw new Error('Company not found or not connected');
    }

    const { data: tokenData, error: tokenError } = await supabase
      .from('quickbooks_tokens')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (tokenError || !tokenData) {
      throw new Error('Authentication tokens not found');
    }

    const accessToken = await refreshTokenIfNeeded(supabase, companyId, tokenData, company);

    // Fetch Balance Sheet from QuickBooks
    const response = await fetch(
      `https://quickbooks.api.intuit.com/v3/company/${company.realm_id}/reports/BalanceSheet?minorversion=65`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('QuickBooks API error:', response.status, errorText);
      throw new Error(`Failed to fetch balance sheet: ${response.status}`);
    }

    const balanceSheet = await response.json();
    console.log('Balance sheet fetched successfully');

    // Extract totals
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    if (balanceSheet.Rows?.Row) {
      for (const mainSection of balanceSheet.Rows.Row) {
        const group = mainSection.group || '';
        
        if (group === 'NetAssets') {
          if (mainSection.Summary) {
            totalAssets = parseFloat(mainSection.Summary.ColData?.[1]?.value || '0');
          }
        } else if (group === 'NetLiabilitiesAndShareHolderEquity') {
          if (mainSection.Rows?.Row) {
            for (const subSection of mainSection.Rows.Row) {
              const subHeaderName = subSection.Header?.ColData?.[0]?.value || '';
              const subHeaderLower = subHeaderName.toLowerCase();
              
              if (subHeaderLower.includes('pasivo') || subHeaderLower.includes('liabilit')) {
                if (subSection.Summary) {
                  totalLiabilities += parseFloat(subSection.Summary.ColData?.[1]?.value || '0');
                }
              } else if (subHeaderLower.includes('patrimonio') || subHeaderLower.includes('equity')) {
                if (subSection.Summary) {
                  totalEquity += parseFloat(subSection.Summary.ColData?.[1]?.value || '0');
                }
              }
            }
          }
        }
      }
    }

    const reportDate = new Date().toISOString().split('T')[0];

    // Delete old records for this company and date
    await supabase
      .from('quickbooks_balance_sheet')
      .delete()
      .eq('company_id', companyId)
      .eq('report_date', reportDate);

    // Insert new balance sheet record
    const { error: insertError } = await supabase
      .from('quickbooks_balance_sheet')
      .insert({
        company_id: companyId,
        report_date: reportDate,
        total_assets: totalAssets,
        total_liabilities: totalLiabilities,
        total_equity: totalEquity,
        raw_data: balanceSheet,
        synced_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error(`Failed to save balance sheet: ${insertError.message}`);
    }

    console.log('Balance sheet synced successfully');

    return new Response(
      JSON.stringify({
        success: true,
        reportDate,
        totalAssets,
        totalLiabilities,
        totalEquity,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
