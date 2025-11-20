import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const QUICKBOOKS_CLIENT_ID = Deno.env.get('QUICKBOOKS_CLIENT_ID')!;
const QUICKBOOKS_CLIENT_SECRET = Deno.env.get('QUICKBOOKS_CLIENT_SECRET')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  companyId: z.string().uuid('Invalid company ID format'),
});

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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Validate and parse request body
    const body = await req.json();
    const { companyId } = requestSchema.parse(body);

    // Verify user has access to this company by checking company_users table directly
    const { data: accessCheck, error: accessError } = await supabase
      .from('company_users')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .single();

    if (accessError || !accessCheck) {
      throw new Error('Access denied to this company');
    }

    // Construct the redirect URI dynamically
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 
                   `https://12f71efd-1f70-462c-bb07-db795e0bb262.lovableproject.com`;
    const redirectUri = `${origin}/auth/quickbooks/callback`;

    // Get company credentials from database
    const { data: company, error: companyError } = await supabase
      .from('quickbooks_companies')
      .select('client_id, client_secret, company_name')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      throw new Error('Company not found');
    }

    if (!company.client_id || !company.client_secret) {
      throw new Error('QuickBooks credentials not configured for this company');
    }

    // Always use production OAuth endpoint
    const oauthBaseUrl = 'https://appcenter.intuit.com/connect/oauth2';

    // Generate auth URL with company-specific credentials
    const authUrl = `${oauthBaseUrl}` +
      `?client_id=${company.client_id}` +
      `&scope=com.intuit.quickbooks.accounting` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&state=${companyId}`;

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
