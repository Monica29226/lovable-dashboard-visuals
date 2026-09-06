import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { sendTemplateEmail } from "../_shared/transactional-email-templates/send-email.ts";


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const requestSchema = z.union([
  z.object({ userId: z.string().uuid() }),
  z.object({ listStatus: z.literal(true) }),
]);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Caller must be an authenticated admin.
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) return json({ error: 'Unauthorized' }, 401);

    const { data: adminRole } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!adminRole) return json({ error: 'Unauthorized - Admin access required' }, 403);

    const parsed = requestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: 'Validation failed', details: parsed.error.errors }, 400);
    }

    // Status mode: report who has never signed in (auth data is not readable from the client).
    if ('listStatus' in parsed.data) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) return json({ error: error.message }, 500);
      return json({
        users: data.users.map((u) => ({
          id: u.id,
          email: u.email,
          last_sign_in_at: u.last_sign_in_at ?? null,
        })),
      });
    }

    const { userId } = parsed.data;

    // 1) Target user must exist.
    const { data: target, error: getError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (getError || !target?.user?.email) {
      return json({ error: 'No se encontró el usuario indicado. Actualice la lista e intente de nuevo.' }, 404);
    }

    const email = target.user.email;
    const fullName = (target.user.user_metadata?.full_name as string | undefined) || email;

    // 2) Fresh password-setup link.
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: 'https://dashboard.aclcostarica.com/reset-password' },
    });

    if (linkError) {
      return json({ error: `No se pudo generar el enlace de acceso: ${linkError.message}` }, 400);
    }

    const actionUrl = linkData.properties?.action_link;

    // 3) Send with a UNIQUE idempotency key, otherwise the resend is silently deduplicated.
    let result: { sent: boolean; reason?: string };
    try {
      result = await sendTemplateEmail('user-invitation', email, {
        idempotencyKey: `user-invitation-resend-${userId}-${Date.now()}`,
        templateData: {
          fullName,
          email,
          actionUrl,
          portalUrl: 'https://dashboard.aclcostarica.com',
        },
      });
    } catch (e) {
      const message = (e as Error).message ?? 'Error desconocido';
      const { error: logError } = await supabaseAdmin.from('email_send_log').insert({
        template_name: 'user-invitation',
        recipient_email: email,
        status: 'failed',
        error_message: message.slice(0, 1000),
      });
      if (logError) console.error('Failed to write email_send_log:', logError.message);
      return json({ success: false, emailSent: false, email, error: message }, 502);
    }

    const { error: logError } = await supabaseAdmin.from('email_send_log').insert({
      template_name: 'user-invitation',
      recipient_email: email,
      status: result.sent ? 'sent' : 'suppressed',
    });
    if (logError) console.error('Failed to write email_send_log:', logError.message);

    // A suppressed address (rebote, queja o baja previa) — a clear error beats a silent loss.
    if (!result.sent) {
      return json({
        error: 'Esta dirección está en la lista de rebotes por un envío fallido anterior. Corrija el correo o retírela de la lista antes de reenviar.',
      }, 400);
    }

    return json({ success: true, emailSent: true, email });

  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
