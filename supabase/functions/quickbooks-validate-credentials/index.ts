import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function encodeBase64(str: string): string {
  return base64Encode(new TextEncoder().encode(str));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const clientId = (Deno.env.get('QUICKBOOKS_CLIENT_ID') || '').trim();
    const clientSecret = (Deno.env.get('QUICKBOOKS_CLIENT_SECRET') || '').trim();

    const recommendations: string[] = [];
    if (!clientId) {
      recommendations.push('El QUICKBOOKS_CLIENT_ID global no está configurado en el backend.');
    }
    if (!clientSecret) {
      recommendations.push('El QUICKBOOKS_CLIENT_SECRET global no está configurado en el backend.');
    } else if (clientSecret.length < 20) {
      recommendations.push('El QUICKBOOKS_CLIENT_SECRET parece demasiado corto. Verifica que sea el secreto completo.');
    }

    // Live-validate the credentials against Intuit's token endpoint.
    let client_secret_valid: boolean | null = null;
    if (clientId && clientSecret) {
      try {
        const basicAuth = `Basic ${encodeBase64(`${clientId}:${clientSecret}`)}`;
        const resp = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': basicAuth,
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: '__invalid__',
          }),
        });
        let json: any = {};
        try { json = await resp.json(); } catch { /* ignore */ }

        if (resp.status === 401 || json?.error === 'invalid_client') {
          client_secret_valid = false;
          recommendations.push(
            'El Client Secret configurado en el backend es rechazado por Intuit (invalid_client); actualiza QUICKBOOKS_CLIENT_SECRET en Project Settings → Secrets con el secret de Producción vigente'
          );
        } else {
          // e.g. HTTP 400 invalid_grant → creds accepted, refresh_token bogus (expected)
          client_secret_valid = true;
        }
      } catch (e) {
        console.error('Intuit validation fetch failed:', e);
        client_secret_valid = null;
        recommendations.push('No se pudo contactar a Intuit para validar');
      }
    }

    const validation = {
      client_id_configured: clientId.length > 0,
      client_id_length: clientId.length,
      client_id_prefix: clientId.slice(0, 4),
      client_secret_configured: clientSecret.length > 0,
      client_secret_length: clientSecret.length,
      client_secret_valid,
      recommendations,
    };

    return new Response(
      JSON.stringify(validation),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Validation error:', error);
    return new Response(
      JSON.stringify({
        error: 'No se pudo validar el estado actual de las credenciales',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
