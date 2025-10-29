import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const REDIRECT_URI = 'https://demo-lab-finance-view.lovable.app/auth/quickbooks/callback';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const QUICKBOOKS_CLIENT_ID = Deno.env.get('QUICKBOOKS_CLIENT_ID')!;
const QUICKBOOKS_CLIENT_SECRET = Deno.env.get('QUICKBOOKS_CLIENT_SECRET')!;

// Helper to safely encode to base64
function encodeBase64(str: string): string {
  // Use btoa directly with the string
  return btoa(str);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, realmId, companyId } = await req.json();
    console.log('Callback received - code:', code ? 'present' : 'missing', 'realmId:', realmId, 'companyId:', companyId);

    if (!code || !realmId || !companyId) {
      const missing = [];
      if (!code) missing.push('code');
      if (!realmId) missing.push('realmId');
      if (!companyId) missing.push('companyId');
      throw new Error(`Missing required parameters: ${missing.join(', ')}`);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get company credentials from database
    const { data: company, error: companyError } = await supabase
      .from('quickbooks_companies')
      .select('client_id, client_secret, company_name')
      .eq('id', companyId)
      .single();

    console.log('Company lookup result:', company ? `Found: ${company.company_name}` : 'Not found');

    if (companyError || !company) {
      console.error('Company error:', companyError);
      throw new Error('Company not found');
    }

    if (!company.client_id || !company.client_secret) {
      throw new Error('QuickBooks credentials not configured for this company');
    }

    // Exchange code for tokens using company-specific credentials
    const authString = `${company.client_id}:${company.client_secret}`;
    
    console.log('Client ID length:', company.client_id?.length);
    console.log('Client Secret length:', company.client_secret?.length);
    console.log('Auth string length before encoding:', authString.length);
    
    const authHeader = `Basic ${encodeBase64(authString)}`;
    
    console.log('Exchanging code for tokens with company:', company.company_name);
    console.log('Auth header length:', authHeader.length);
    
    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeader,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokens = await tokenResponse.json();

    console.log('Token response status:', tokenResponse.status);
    console.log('Token response ok:', tokenResponse.ok);
    
    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', JSON.stringify(tokens));
      throw new Error(`Token exchange failed: ${JSON.stringify(tokens)}`);
    }

    console.log('Tokens received successfully');

    // Store tokens with company_id
    const { error: tokenError } = await supabase
      .from('quickbooks_tokens')
      .upsert({
        company_id: companyId,
        realm_id: realmId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      }, {
        onConflict: 'company_id',
      });

    if (tokenError) throw tokenError;

    // Update company status
    const { error: updateError } = await supabase
      .from('quickbooks_companies')
      .update({
        realm_id: realmId,
        is_connected: true,
      })
      .eq('id', companyId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Callback error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
