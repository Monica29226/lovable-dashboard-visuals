import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  email: z.string().email('Invalid email format').max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password too long'),
  full_name: z.string().max(100, 'Full name must be less than 100 characters').optional(),
  role: z.enum(['admin', 'contador', 'cliente', 'user', 'viewer']).optional(),
  company_ids: z.array(z.string().uuid()).max(100).optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin directly with the service role client
    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !adminRole) {
      return new Response(JSON.stringify({ error: 'Unauthorized - Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate input
    const body = await req.json();
    const validationResult = requestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(JSON.stringify({ 
        error: 'Validation failed', 
        details: validationResult.error.errors 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email, password, full_name, role, company_ids } = validationResult.data;

    // Create the user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || email }
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update role if specified and different from default
    if (role && role !== 'user') {
      await supabaseAdmin
        .from('user_roles')
        .update({ role })
        .eq('user_id', newUser.user.id);
    }

    // Grant access ONLY to the explicitly selected companies (strict isolation).
    // The handle_new_user trigger no longer auto-assigns any company.
    if (company_ids && company_ids.length > 0) {
      const rows = company_ids.map((company_id) => ({
        user_id: newUser.user.id,
        company_id,
        role: 'user' as const,
      }));
      const { error: accessError } = await supabaseAdmin
        .from('company_users')
        .insert(rows);
      if (accessError) {
        console.error('Error assigning company access:', accessError.message);
      }
    }

    // Generate a password-setup (recovery) link so we never email plaintext passwords.
    let actionUrl: string | undefined;
    try {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo: 'https://dashboard.aclcostarica.com/reset-password' },
      });
      if (linkError) {
        console.error('Error generating password setup link:', linkError.message);
      } else {
        actionUrl = linkData.properties?.action_link;
      }
    } catch (e) {
      console.error('Unexpected error generating password setup link:', (e as Error).message);
    }

    // Send the branded invitation email with a password-setup link (no plaintext password).
    // Failure to send must not fail user creation — it is logged and reported.
    let emailSent = false;
    try {
      const { error: emailError } = await supabaseAdmin.functions.invoke(
        'send-transactional-email',
        {
          body: {
            templateName: 'user-invitation',
            recipientEmail: email,
            idempotencyKey: `user-invitation-${newUser.user.id}`,
            templateData: {
              fullName: full_name || email,
              email,
              actionUrl,
              portalUrl: 'https://dashboard.aclcostarica.com',
            },
          },
        },
      );
      if (emailError) {
        console.error('Error sending invitation email:', emailError.message);
      } else {
        emailSent = true;
      }
    } catch (e) {
      console.error('Unexpected error sending invitation email:', (e as Error).message);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      emailSent,
      user: { 
        id: newUser.user.id, 
        email: newUser.user.email,
        role: role || 'user'
      } 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});