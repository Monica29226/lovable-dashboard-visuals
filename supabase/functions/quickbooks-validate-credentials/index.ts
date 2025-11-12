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
    const { companyId } = await req.json();
    console.log('Validating credentials for companyId:', companyId);

    if (!companyId) {
      throw new Error('Company ID is required');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get company credentials from database
    const { data: company, error: companyError } = await supabase
      .from('quickbooks_companies')
      .select('client_id, client_secret, company_name')
      .eq('id', companyId)
      .single();

    console.log('Company found:', company?.company_name);

    if (companyError || !company) {
      console.error('Company error:', companyError);
      throw new Error('Company not found');
    }

    if (!company.client_id || !company.client_secret) {
      throw new Error('QuickBooks credentials not configured for this company');
    }

    // Validate credentials format
    const validation = {
      company_name: company.company_name,
      client_id: company.client_id,
      client_id_valid: company.client_id.length > 0,
      client_secret_length: company.client_secret.length,
      client_secret_valid: company.client_secret.length >= 20,
      // Check if credentials contain the expected format
      client_id_format: /^[A-Za-z0-9]+$/.test(company.client_id),
      recommendations: []
    };

    // Add recommendations
    if (!validation.client_id_format) {
      validation.recommendations.push('El Client ID contiene caracteres no válidos. Debe contener solo letras y números.');
    }

    if (validation.client_secret_length < 20) {
      validation.recommendations.push('El Client Secret parece ser demasiado corto. Verifica que sea el secreto completo de QuickBooks.');
    }

    if (company.client_id.startsWith('QB') || company.client_id.startsWith('sandbox')) {
      validation.recommendations.push('El Client ID parece ser de una app en modo Sandbox. Para producción, necesitas usar las credenciales de Production.');
    }

    console.log('Validation result:', validation);

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
        error: error.message,
        details: 'Error validating QuickBooks credentials'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
