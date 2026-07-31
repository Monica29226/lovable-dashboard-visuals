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
  newEmail: z.string().email('El correo indicado no tiene un formato válido.').max(255),
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

    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: callerError } = await supabaseAdmin.auth.getUser(token);

    if (callerError || !caller) {
      return json({ error: 'No autorizado. Debe iniciar sesión.' }, 401);
    }

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
      return json({ error: parsed.error.errors[0]?.message || 'Datos inválidos.' }, 400);
    }

    const { userId } = parsed.data;
    const newEmail = parsed.data.newEmail.trim().toLowerCase();

    // --- Ensure the email is not already taken by another user ---
    let taken = false;
    let page = 1;
    while (page < 20) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) {
        return json({ error: `No se pudo verificar el correo: ${error.message}` }, 500);
      }
      const match = data.users.find(
        (u: { id: string; email?: string | null }) =>
          u.email?.toLowerCase() === newEmail && u.id !== userId,
      );
      if (match) {
        taken = true;
        break;
      }
      if (data.users.length < 200) break;
      page++;
    }

    if (taken) {
      return json({ error: `El correo ${newEmail} ya está en uso por otro usuario.` }, 400);
    }

    // --- Update the auth user. email_confirm avoids leaving the person locked out. ---
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email: newEmail,
      email_confirm: true,
    });

    if (updateError) {
      return json({ error: updateError.message }, 400);
    }

    // --- Keep the profile in sync ---
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ email: newEmail })
      .eq('user_id', userId);

    if (profileError) {
      console.error('Error updating profile email:', profileError.message);
      return json({
        success: true,
        warning: `El correo de acceso se actualizó, pero el perfil no se pudo sincronizar: ${profileError.message}`,
        email: newEmail,
      });
    }

    return json({ success: true, email: newEmail });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
