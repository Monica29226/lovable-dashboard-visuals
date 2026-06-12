import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/microsoft_outlook";

const requestSchema = z.object({
  companyId: z.string().uuid(),
  action: z.enum(["list", "get"]),
  messageId: z.string().trim().min(1).max(512).optional(),
  top: z.number().int().min(1).max(50).optional(),
});

function gatewayHeaders() {
  return {
    Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
    "X-Connection-Api-Key": Deno.env.get("MICROSOFT_OUTLOOK_API_KEY")!,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = requestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Validation failed", details: parsed.error.errors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { companyId, action, messageId, top } = parsed.data;

    // --- Access control: admin OR explicit company access ---
    const { data: adminRole } = await supabaseAdmin
      .from("user_roles").select("id").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!adminRole) {
      const { data: access } = await supabaseAdmin
        .from("company_users").select("id").eq("user_id", user.id).eq("company_id", companyId).maybeSingle();
      if (!access) {
        return new Response(JSON.stringify({ error: "Forbidden - no access to this company" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data: company } = await supabaseAdmin
      .from("quickbooks_companies").select("correo_principal").eq("id", companyId).maybeSingle();
    const companyEmail = (company?.correo_principal ?? "").trim();

    if (action === "list") {
      if (!companyEmail) {
        return new Response(JSON.stringify({ items: [], noEmail: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const search = encodeURIComponent(`"${companyEmail}"`);
      const limit = top ?? 25;
      const res = await fetch(
        `${GATEWAY_URL}/me/messages?$search=${search}&$top=${limit}&$select=id,subject,from,toRecipients,receivedDateTime,isRead,bodyPreview,hasAttachments`,
        { headers: gatewayHeaders() },
      );
      const data = await res.json();
      if (!res.ok) {
        return new Response(JSON.stringify({ error: "Outlook error", status: res.status, body: data }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const items = (data.value ?? []).map((m: any) => ({
        id: m.id,
        subject: m.subject,
        from: m.from?.emailAddress?.address ?? "",
        fromName: m.from?.emailAddress?.name ?? "",
        received: m.receivedDateTime,
        isRead: m.isRead,
        preview: m.bodyPreview,
        hasAttachments: m.hasAttachments,
      }));
      return new Response(JSON.stringify({ items, companyEmail }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get") {
      if (!messageId) {
        return new Response(JSON.stringify({ error: "messageId required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const res = await fetch(
        `${GATEWAY_URL}/me/messages/${encodeURIComponent(messageId)}?$select=id,subject,from,toRecipients,ccRecipients,receivedDateTime,body`,
        { headers: gatewayHeaders() },
      );
      const data = await res.json();
      if (!res.ok) {
        return new Response(JSON.stringify({ error: "Outlook error", status: res.status, body: data }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({
        id: data.id,
        subject: data.subject,
        from: data.from?.emailAddress?.address ?? "",
        fromName: data.from?.emailAddress?.name ?? "",
        to: (data.toRecipients ?? []).map((r: any) => r.emailAddress?.address),
        received: data.receivedDateTime,
        bodyType: data.body?.contentType,
        body: data.body?.content ?? "",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
