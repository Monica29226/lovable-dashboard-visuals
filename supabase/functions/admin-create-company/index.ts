import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  company_name: z.string().trim().min(1, 'Company name is required').max(200),
  data_source: z.enum(['quickbooks', 'excel']).default('quickbooks'),
  client_id: z.string().trim().max(500).optional(),
  client_secret: z.string().trim().max(500).optional(),
  razon_social: z.string().trim().max(200).optional().nullable(),
  nombre_comercial: z.string().trim().max(200).optional().nullable(),
  cedula_juridica: z.string().trim().max(50).optional().nullable(),
  actividad_economica: z.string().trim().max(300).optional().nullable(),
  regimen_tributario: z.string().trim().max(100).optional().nullable(),
  correo_principal: z.string().trim().max(255).optional().nullable(),
  telefono: z.string().trim().max(50).optional().nullable(),
  direccion: z.string().trim().max(500).optional().nullable(),
  representante_legal: z.string().trim().max(200).optional().nullable(),
  moneda_funcional: z.string().trim().max(10).optional().nullable(),
  responsable_user_id: z.string().uuid().optional().nullable(),
}).refine(
  (d) => d.data_source === 'excel' || (!!d.client_id && !!d.client_secret),
  { message: 'Client ID and Client Secret are required for QuickBooks companies' }
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !adminRole) {
      return new Response(JSON.stringify({ error: 'Unauthorized - Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: parsed.error.errors }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const {
      company_name, data_source, client_id, client_secret,
      razon_social, nombre_comercial, cedula_juridica, actividad_economica,
      regimen_tributario, correo_principal, telefono, direccion,
      representante_legal, moneda_funcional, responsable_user_id,
    } = parsed.data;

    const { data: company, error: insertError } = await supabaseAdmin
      .from('quickbooks_companies')
      .insert({
        company_name,
        data_source,
        client_id: client_id ?? null,
        client_secret: client_secret ?? null,
        is_connected: false,
        razon_social: razon_social ?? null,
        nombre_comercial: nombre_comercial ?? null,
        cedula_juridica: cedula_juridica ?? null,
        actividad_economica: actividad_economica ?? null,
        regimen_tributario: regimen_tributario ?? null,
        correo_principal: correo_principal ?? null,
        telefono: telefono ?? null,
        direccion: direccion ?? null,
        representante_legal: representante_legal ?? null,
        moneda_funcional: moneda_funcional ?? 'CRC',
        responsable_user_id: responsable_user_id ?? null,
      })
      .select('id, company_name, is_connected, realm_id, data_source')
      .single();

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // NOTE: New companies are NOT auto-shared with all users (strict isolation).
    // An admin grants access explicitly when creating/editing each user.

    return new Response(JSON.stringify({ success: true, company }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
