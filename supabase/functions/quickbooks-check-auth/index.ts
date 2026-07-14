import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { userHasCompanyAccess } from '../_shared/access.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

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

    
    const { data: company, error: companyError } = await adminSupabase
      .from('quickbooks_companies')
      .select('is_connected')
      .eq('id', companyId)
      .single();

    if (companyError) {
      throw companyError;
    }

    const { data: tokens, error: tokenError } = await adminSupabase
      .from('quickbooks_tokens')
      .select('id, token_expiry')
      .eq('company_id', companyId)
      .single();

    // Check if token exists and is not expired
    const now = new Date();
    const tokenExpiry = tokens?.token_expiry ? new Date(tokens.token_expiry) : null;
    const isTokenValid = !tokenError && !!tokens && tokenExpiry && tokenExpiry > now;
    
    // Check if token expires within 10 minutes (proactive refresh)
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
    const tokenExpiringSoon = tokenExpiry && tokenExpiry <= tenMinutesFromNow;
    
    let authenticated = isTokenValid && company?.is_connected;

    // If token is expired OR expiring soon, try to refresh the token proactively.
    // NOTE: we NEVER auto-disconnect the company (is_connected stays as-is).
    // A failed refresh only reports authenticated=false; the user must reconnect manually.
    if ((!isTokenValid || tokenExpiringSoon) && tokens) {
      try {
        console.log(`Token ${!isTokenValid ? 'expired' : 'expiring soon'}, attempting refresh...`);
        const refreshResponse = await fetch(`${SUPABASE_URL}/functions/v1/quickbooks-refresh-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify({ companyId }),
        });

        const refreshData = await refreshResponse.json();

        if (refreshResponse.ok && refreshData.success) {
          console.log('Token refresh successful');
          authenticated = true;
        } else {
          console.error('Token refresh failed (not auto-disconnecting company):', refreshData);
          // Tolerate rotation race: a concurrent call may already have renewed the token.
          const { data: fresh } = await adminSupabase
            .from('quickbooks_tokens')
            .select('token_expiry')
            .eq('company_id', companyId)
            .maybeSingle();
          authenticated = !!(fresh?.token_expiry && new Date(fresh.token_expiry) > new Date());
        }
      } catch (refreshError) {
        console.error('Error refreshing token (not auto-disconnecting company):', refreshError);
        const { data: fresh } = await adminSupabase
          .from('quickbooks_tokens')
          .select('token_expiry')
          .eq('company_id', companyId)
          .maybeSingle();
        authenticated = !!(fresh?.token_expiry && new Date(fresh.token_expiry) > new Date());
      }
    } else if (!isTokenValid && company?.is_connected) {
      // No valid tokens but company still marked as connected — do NOT auto-disconnect.
      // Report authenticated=false; the UI will show "desconectado temporalmente".
      console.warn(`No valid tokens for company ${companyId}, but keeping is_connected as-is`);
      authenticated = false;
    }

    return new Response(
      JSON.stringify({ authenticated }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ authenticated: false }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  }
});
