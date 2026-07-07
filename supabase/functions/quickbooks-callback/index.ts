import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const QUICKBOOKS_CLIENT_ID = Deno.env.get('QUICKBOOKS_CLIENT_ID')!;
const QUICKBOOKS_CLIENT_SECRET = Deno.env.get('QUICKBOOKS_CLIENT_SECRET')!;
// Must match EXACTLY the redirect URI used by quickbooks-auth and registered in QuickBooks.
const QUICKBOOKS_REDIRECT_URI = Deno.env.get('QUICKBOOKS_REDIRECT_URI') ||
  'https://aclcostarica.com/auth/quickbooks/callback';

// Helper to safely encode to base64 using Deno's native encoder
function encodeBase64(str: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  return base64Encode(data);
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
    // Create service role client for database operations (needed to bypass RLS on quickbooks_tokens)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Validate and parse request body
    const body = await req.json();
    const requestSchema = z.object({
      code: z.string().min(1, 'Authorization code is required'),
      realmId: z.string().min(1, 'Realm ID is required'),
      companyId: z.string().uuid('Invalid company ID format'),
    });
    const { code, realmId, companyId } = requestSchema.parse(body);

    // Use the same fixed redirect URI as the authorization request (required by OAuth)
    const redirectUri = QUICKBOOKS_REDIRECT_URI;

    // Get company name (for the response only). Credentials are NOT read per-company.
    const { data: company, error: companyError } = await supabase
      .from('quickbooks_companies')
      .select('company_name')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      throw new Error('Company not found');
    }

    // ARCHITECTURE: all companies use ONE ACL QuickBooks app. Always use the global
    // QUICKBOOKS_CLIENT_ID/SECRET to exchange the code. Isolation is by realm_id + company_id.
    const clientId = (QUICKBOOKS_CLIENT_ID || '').trim();
    const clientSecret = (QUICKBOOKS_CLIENT_SECRET || '').trim();

    if (!clientId || !clientSecret) {
      throw new Error('QuickBooks global credentials not configured');
    }

    // Exchange code for tokens using the global ACL credentials
    const authString = `${clientId}:${clientSecret}`;
    const basicAuthHeader = `Basic ${encodeBase64(authString)}`;
    
    console.log('Attempting token exchange with redirect_uri:', redirectUri);
    
    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': basicAuthHeader,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      const diag = {
        intuit_error: tokens.error || 'unknown',
        intuit_desc: tokens.error_description || '',
        http_status: tokenResponse.status,
        client_id_prefix: (clientId || '').slice(0, 8),
        client_id_len: (clientId || '').length,
        secret_len: (clientSecret || '').length,
        redirect_uri_used: redirectUri,
      };
      await supabase.from('sync_logs').insert({
        realm_id: realmId,
        sync_type: 'oauth_callback_debug',
        status: 'error',
        error_message: JSON.stringify(diag),
        records_synced: 0,
      });

      console.error('Token exchange failed with status:', tokenResponse.status);
      console.error('QuickBooks error response:', JSON.stringify(tokens, null, 2));
      console.error('Used redirect_uri:', redirectUri);
      throw new Error(`Token exchange failed: ${tokens.error || 'Unknown error'} - ${tokens.error_description || ''}`);
    }
    
    console.log('Token exchange successful');

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

    await supabase.from('sync_logs').insert({
      realm_id: realmId,
      sync_type: 'oauth_callback_debug',
      status: 'success',
      error_message: null,
      records_synced: 1,
    });



    return new Response(
      JSON.stringify({ 
        success: true,
        companyName: company.company_name 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Callback error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200  // Return 200 with success: false instead of 500 for better error handling
      }
    );
  }
});
