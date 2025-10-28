import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshTokenIfNeeded(supabase: any, companyId: string, tokenData: any, company: any) {
  const tokenExpiry = new Date(tokenData.token_expiry);
  const now = new Date();

  if (tokenExpiry.getTime() - now.getTime() < 5 * 60 * 1000) {
    console.log('Token expiring soon, refreshing...');

    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${company.client_id}:${company.client_secret}`)}`,
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
    const { companyId } = await req.json();

    if (!companyId) {
      throw new Error('Company ID is required');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
      throw new Error('Failed to fetch balance sheet');
    }

    const balanceSheet = await response.json();
    
    // Transform data to CRC format
    const transformedData = {
      assets: balanceSheet.Rows?.Row?.find((r: any) => r.group === 'Assets')?.Rows?.Row?.map((item: any) => ({
        name: item.Header?.ColData?.[0]?.value || '',
        value: parseFloat(item.Summary?.ColData?.[1]?.value || '0'),
      })) || [],
      liabilities: balanceSheet.Rows?.Row?.find((r: any) => r.group === 'Liabilities')?.Rows?.Row?.map((item: any) => ({
        name: item.Header?.ColData?.[0]?.value || '',
        value: parseFloat(item.Summary?.ColData?.[1]?.value || '0'),
      })) || [],
      totalAssets: parseFloat(balanceSheet.Rows?.Row?.find((r: any) => r.group === 'Assets')?.Summary?.ColData?.[1]?.value || '0'),
      totalLiabilities: parseFloat(balanceSheet.Rows?.Row?.find((r: any) => r.group === 'Liabilities')?.Summary?.ColData?.[1]?.value || '0'),
      totalEquity: parseFloat(balanceSheet.Rows?.Row?.find((r: any) => r.group === 'Equity')?.Summary?.ColData?.[1]?.value || '0'),
    };

    return new Response(
      JSON.stringify(transformedData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
