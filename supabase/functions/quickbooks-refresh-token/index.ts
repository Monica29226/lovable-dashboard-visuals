import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { userHasCompanyAccess } from '../_shared/access.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const QUICKBOOKS_CLIENT_ID = Deno.env.get('QUICKBOOKS_CLIENT_ID')!;
const QUICKBOOKS_CLIENT_SECRET = Deno.env.get('QUICKBOOKS_CLIENT_SECRET')!;

// Helper to safely encode to base64
function encodeBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
  return btoa(binString);
}

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

    // User client for authentication verification
    const userSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    // Admin client for privileged database operations (bypasses RLS)
    const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Validate and parse request body
    const body = await req.json();
    const { companyId } = requestSchema.parse(body);

    // Verify access: admin OR explicit company_users access
    const allowed = await userHasCompanyAccess(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, user.id, companyId);
    if (!allowed) {
      throw new Error('Access denied to this company');
    }

    // Get token data using admin client (bypasses RLS on quickbooks_tokens)
    const { data: tokenData, error: tokenError } = await adminSupabase
      .from('quickbooks_tokens')
      .select('refresh_token, access_token, token_expiry')
      .eq('company_id', companyId)
      .single();

    if (tokenError || !tokenData) {
      console.error('Token fetch error:', tokenError);
      throw new Error('Tokens not found');
    }

    // If the current access token is still valid (>60s left), skip refreshing.
    // Avoids racing concurrent refreshes that rotate the refresh_token.
    if (tokenData.token_expiry && new Date(tokenData.token_expiry).getTime() > Date.now() + 60 * 1000) {
      console.log('Access token still valid, skipping refresh');
      return new Response(
        JSON.stringify({ success: true, access_token: tokenData.access_token }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }


    // ARCHITECTURE: all companies use ONE ACL QuickBooks app. Always refresh with global creds.
    const clientId = (QUICKBOOKS_CLIENT_ID || '').trim();
    const clientSecret = (QUICKBOOKS_CLIENT_SECRET || '').trim();

    const authString = `${clientId}:${clientSecret}`;
    const basicAuthHeader = `Basic ${encodeBase64(authString)}`;

    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': basicAuthHeader,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokenData.refresh_token,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      // Token-rotation race: another concurrent call may have already refreshed.
      const { data: fresh } = await adminSupabase
        .from('quickbooks_tokens')
        .select('access_token, token_expiry')
        .eq('company_id', companyId)
        .maybeSingle();
      if (fresh?.token_expiry && new Date(fresh.token_expiry).getTime() > Date.now()) {
        console.log('Refresh failed but token already renewed by concurrent call');
        return new Response(
          JSON.stringify({ success: true, access_token: fresh.access_token }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      throw new Error(`Token refresh failed: ${JSON.stringify(tokens)}`);
    }

    // Update tokens using admin client
    const { error: updateError } = await adminSupabase
      .from('quickbooks_tokens')
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      })
      .eq('company_id', companyId);

    if (updateError) throw updateError;

    // Update company connection status to connected
    await adminSupabase
      .from('quickbooks_companies')
      .update({ is_connected: true })
      .eq('id', companyId);

    console.log('Token refreshed successfully, connection reactivated');

    return new Response(
      JSON.stringify({ success: true, access_token: tokens.access_token }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Refresh token error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
