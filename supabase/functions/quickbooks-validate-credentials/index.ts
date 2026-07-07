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

    // Validate the GLOBAL environment credentials (single ACL QuickBooks app).
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

    const validation = {
      client_id_configured: clientId.length > 0,
      client_id_length: clientId.length,
      client_id_prefix: clientId.slice(0, 4),
      client_secret_configured: clientSecret.length > 0,
      client_secret_length: clientSecret.length,
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
