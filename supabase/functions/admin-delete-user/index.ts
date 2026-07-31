import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const requestSchema = z.object({
  userId: z.string().uuid('Identificador de usuario inválido.'),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // --- Authenticate caller ---
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: callerError } = await supabaseAdmin.auth.getUser(token);

    if (callerError || !caller) {
      return json({ error: 'No autorizado. Debe iniciar sesión.' }, 401);
    }

    // --- Guard 1: caller must be admin ---
    const { data: callerAdminRole } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', caller.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!callerAdminRole) {
      return json({ error: 'No autorizado: se requiere rol de administrador.' }, 403);
    }

    const parsed = requestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: 'Identificador de usuario inválido.' }, 400);
    }
    const { userId } = parsed.data;

    // --- Guard 2: cannot delete self ---
    if (userId === caller.id) {
      return json({ error: 'No puede eliminar su propia cuenta.' }, 400);
    }

    // --- Guard 3: cannot delete the last administrator ---
    const { data: adminRows, error: adminRowsError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (adminRowsError) {
      return json({ error: `No se pudo verificar los administradores: ${adminRowsError.message}` }, 500);
    }

    const adminIds = new Set((adminRows || []).map((r: { user_id: string }) => r.user_id));
    if (adminIds.has(userId) && adminIds.size <= 1) {
      return json({
        error: 'No puede eliminar al último administrador: la plataforma quedaría sin acceso.',
      }, 400);
    }

    // --- Deletion order: user_roles -> profiles -> auth user ---
    const { error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (rolesError) {
      return json({ error: `No se pudieron eliminar los roles del usuario: ${rolesError.message}` }, 400);
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', userId);

    if (profileError) {
      return json({ error: `No se pudo eliminar el perfil del usuario: ${profileError.message}` }, 400);
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      // Surface the real Supabase error, not a generic message.
      return json({ error: deleteError.message }, 400);
    }

    return json({ success: true, userId });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
