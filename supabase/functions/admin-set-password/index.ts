import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
    const { data: adminRole } = await admin.from('user_roles').select('id').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
    if (!adminRole) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } });

    const { email, password } = await req.json();
    if (!email || !password) return new Response(JSON.stringify({ error: 'email and password required' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });

    // Find user by email
    let target: any = null;
    let page = 1;
    while (page < 20) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      target = data.users.find((u: any) => u.email?.toLowerCase() === String(email).toLowerCase());
      if (target || data.users.length < 200) break;
      page++;
    }
    if (!target) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: { ...cors, 'Content-Type': 'application/json' } });

    const { error: updErr } = await admin.auth.admin.updateUserById(target.id, { password, email_confirm: true });
    if (updErr) return new Response(JSON.stringify({ error: updErr.message }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });

    return new Response(JSON.stringify({ success: true, user_id: target.id }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
