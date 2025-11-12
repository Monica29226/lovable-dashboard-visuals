import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const QUICKBOOKS_CLIENT_ID = Deno.env.get('QUICKBOOKS_CLIENT_ID')!;
const QUICKBOOKS_CLIENT_SECRET = Deno.env.get('QUICKBOOKS_CLIENT_SECRET')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId } = await req.json();
    console.log('Received companyId:', companyId);

    if (!companyId) {
      throw new Error('Company ID is required');
    }

    // Build the redirect URI using the current project URL
    const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/$/, '') || SUPABASE_URL.replace('flwcasyydljhrjlrtzlz.supabase.co', '12f71efd-1f70-462c-bb07-db795e0bb262.lovableproject.com');
    const redirectUri = `${origin}/auth/quickbooks/callback`;
    console.log('Using redirect URI:', redirectUri);
    console.log('Origin header:', req.headers.get('origin'));
    console.log('Referer header:', req.headers.get('referer'));

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get company credentials from database
    const { data: company, error: companyError } = await supabase
      .from('quickbooks_companies')
      .select('client_id, client_secret, company_name')
      .eq('id', companyId)
      .single();

    console.log('Company data:', company ? company.company_name : 'not found');

    if (companyError || !company) {
      console.error('Company error:', companyError);
      throw new Error('Company not found');
    }

    if (!company.client_id || !company.client_secret) {
      throw new Error('QuickBooks credentials not configured for this company');
    }

    // Detect environment based on Client ID format
    // Sandbox Client IDs typically start with 'QB' or are shorter
    // Production Client IDs are typically longer alphanumeric strings
    const isSandbox = company.client_id.startsWith('QB') || 
                      company.client_id.startsWith('sandbox') ||
                      company.client_id.length < 40;
    
    // Use the appropriate OAuth endpoint
    const oauthBaseUrl = isSandbox 
      ? 'https://appcenter.intuit.com/connect/oauth2'  // Sandbox uses same URL but with sandbox credentials
      : 'https://appcenter.intuit.com/connect/oauth2';
    
    console.log('Environment detected:', isSandbox ? 'Sandbox' : 'Production');
    console.log('Client ID length:', company.client_id.length);
    console.log('Client ID starts with:', company.client_id.substring(0, 5));

    // Generate auth URL with company-specific credentials
    const authUrl = `${oauthBaseUrl}` +
      `?client_id=${company.client_id}` +
      `&scope=com.intuit.quickbooks.accounting` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&state=${companyId}`;

    console.log('Auth URL generated for company:', company.company_name);
    console.log('Redirect URI:', redirectUri);
    console.log('Full auth URL:', authUrl);

    return new Response(
      JSON.stringify({ authUrl }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Auth error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
