import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

    // Verify user has access to this company
    const { data: access, error: accessError } = await supabase
      .rpc('user_has_company_access', { target_company_id: companyId });

    if (accessError || !access) {
      throw new Error('Access denied to this company');
    }
    
    const { data: company, error: companyError } = await supabase
      .from('quickbooks_companies')
      .select('is_connected')
      .eq('id', companyId)
      .single();

    if (companyError) {
      throw companyError;
    }

    const { data: tokens, error: tokenError } = await supabase
      .from('quickbooks_tokens')
      .select('id, token_expiry')
      .eq('company_id', companyId)
      .single();

    // Check if token exists and is not expired
    const isTokenValid = !tokenError && !!tokens && tokens.token_expiry && new Date(tokens.token_expiry) > new Date();
    let authenticated = isTokenValid && company?.is_connected;

    // If token is expired but company is connected, try to refresh the token
    if (!isTokenValid && company?.is_connected && tokens) {
      try {
        const refreshResponse = await fetch(`${SUPABASE_URL}/functions/v1/quickbooks-refresh-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ companyId }),
        });

        const refreshData = await refreshResponse.json();
        
        if (refreshResponse.ok && refreshData.success) {
          authenticated = true;
        } else {
          console.error('Token refresh failed:', refreshData);
          // Update company connection status to disconnected
          await supabase
            .from('quickbooks_companies')
            .update({ is_connected: false })
            .eq('id', companyId);
          authenticated = false;
        }
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        // Update company connection status to disconnected
        await supabase
          .from('quickbooks_companies')
          .update({ is_connected: false })
          .eq('id', companyId);
        authenticated = false;
      }
    } else if (!isTokenValid && company?.is_connected) {
      // No tokens found but company is marked as connected
      await supabase
        .from('quickbooks_companies')
        .update({ is_connected: false })
        .eq('id', companyId);
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
