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
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Solicitud inválida' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    const { companyId } = parsed.data;

    // Verify access: admin role OR explicit company membership.
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    let hasAccess = !!adminRole;
    if (!hasAccess) {
      const { data: accessCheck } = await supabase
        .from('company_users')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .maybeSingle();
      hasAccess = !!accessCheck;
    }

    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: 'No tienes acceso a esta empresa' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Get company credentials from database
    const { data: company, error: companyError } = await supabase
      .from('quickbooks_companies')
      .select('client_id, client_secret, company_name')
      .eq('id', companyId)
      .maybeSingle();

    if (companyError || !company) {
      return new Response(
        JSON.stringify({ error: 'Empresa no encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (!company.client_id || !company.client_secret) {
      return new Response(
        JSON.stringify({
          company_name: company.company_name,
          client_id_configured: false,
          client_secret_valid: false,
          recommendations: ['No hay credenciales de QuickBooks configuradas para esta empresa. Guarda un Client ID y Client Secret.'],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const normalizedClientId = company.client_id.trim();
    const normalizedClientSecret = company.client_secret.trim();
    const clientIdFormatValid = /^[A-Za-z0-9]+$/.test(normalizedClientId);

    // Validate credentials format
    const validation = {
      company_name: company.company_name,
      client_id_configured: normalizedClientId.length > 0,
      client_id_length: normalizedClientId.length,
      client_id_valid: normalizedClientId.length > 0 && clientIdFormatValid,
      client_secret_length: normalizedClientSecret.length,
      client_secret_valid: normalizedClientSecret.length >= 20,
      // Check if credentials contain the expected format
      client_id_format: clientIdFormatValid,
      recommendations: []
    };

    // Add recommendations
    if (!validation.client_id_format) {
      validation.recommendations.push('El Client ID contiene caracteres no válidos. Debe contener solo letras y números.');
    }

    if (validation.client_secret_length < 20) {
      validation.recommendations.push('El Client Secret parece ser demasiado corto. Verifica que sea el secreto completo de QuickBooks.');
    }

    if (normalizedClientId.startsWith('QB') || normalizedClientId.startsWith('sandbox')) {
      validation.recommendations.push('El Client ID parece ser de una app en modo Sandbox. Para producción, necesitas usar las credenciales de Production.');
    }

    return new Response(
      JSON.stringify(validation),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Validation error:', error);
    return new Response(
      JSON.stringify({
        error: 'No se pudo validar el estado actual de las credenciales',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  }
});
