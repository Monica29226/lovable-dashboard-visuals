import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const QUICKBOOKS_CLIENT_ID = Deno.env.get('QUICKBOOKS_CLIENT_ID');
const QUICKBOOKS_CLIENT_SECRET = Deno.env.get('QUICKBOOKS_CLIENT_SECRET');
const REDIRECT_URI = `${Deno.env.get('SUPABASE_URL')}/functions/v1/quickbooks-callback`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authUrl = `https://appcenter.intuit.com/connect/oauth2` +
      `?client_id=${QUICKBOOKS_CLIENT_ID}` +
      `&scope=com.intuit.quickbooks.accounting` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=code` +
      `&state=security_token`;

    return new Response(
      JSON.stringify({ authUrl }),
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
