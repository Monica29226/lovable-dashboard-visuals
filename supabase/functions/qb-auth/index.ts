import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting QB OAuth authentication flow');

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
      console.error('Authentication error:', authError);
      throw new Error('Unauthorized');
    }

    console.log('User authenticated:', user.id);

    // Get companyId from request body (POST) or query params (GET)
    let companyId: string | null = null;
    
    if (req.method === 'POST') {
      const body = await req.json();
      companyId = body.companyId;
    } else {
      const url = new URL(req.url);
      companyId = url.searchParams.get('companyId');
    }

    if (!companyId) {
      throw new Error('companyId is required');
    }

    // Get company credentials from database
    const { data: company, error: companyError } = await supabase
      .from('quickbooks_companies')
      .select('client_id, realm_id')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      throw new Error('Company not found');
    }

    if (!company.client_id) {
      throw new Error('QuickBooks credentials not configured for this company');
    }

    // Construct the redirect URI dynamically based on request origin
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 
                   `https://12f71efd-1f70-462c-bb07-db795e0bb262.lovableproject.com`;
    const redirectUri = `${origin}/auth/quickbooks/callback`;

    // Build the QuickBooks OAuth URL
    const scope = 'com.intuit.quickbooks.accounting';
    const state = companyId; // Use company ID as state for callback
    
    const authUrl = `https://appcenter.intuit.com/connect/oauth2` +
      `?client_id=${company.client_id}` +
      `&scope=${scope}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&state=${state}`;

    console.log('OAuth URL generated successfully for company:', companyId);
    console.log('Using redirect URI:', redirectUri);

    return new Response(
      JSON.stringify({ 
        authUrl
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('QB Auth error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
