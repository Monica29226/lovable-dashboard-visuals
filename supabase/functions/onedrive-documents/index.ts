import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/microsoft_onedrive";
const ROOT_FOLDER = "ACL Contable Cloud";

const requestSchema = z.object({
  companyId: z.string().uuid(),
  action: z.enum(["list", "upload", "download", "delete"]),
  // upload
  fileName: z.string().trim().min(1).max(255).optional(),
  fileContentBase64: z.string().optional(),
  // download / delete
  itemId: z.string().trim().min(1).max(512).optional(),
});

function gatewayHeaders(extra: Record<string, string> = {}) {
  return {
    Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
    "X-Connection-Api-Key": Deno.env.get("MICROSOFT_ONEDRIVE_API_KEY")!,
    ...extra,
  };
}

// Stable, filesystem-safe folder name per company.
function companyFolder(companyId: string, name?: string | null) {
  const safe = (name ?? "Empresa").replace(/[\\/:*?"<>|]/g, " ").trim().slice(0, 60);
  return `${safe} [${companyId}]`;
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
    const { companyId, action, fileName, fileContentBase64, itemId } = parsed.data;

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
      .from("quickbooks_companies").select("company_name").eq("id", companyId).maybeSingle();
    const folder = companyFolder(companyId, company?.company_name);
    const folderPath = encodeURIComponent(`${ROOT_FOLDER}/${folder}`);

    if (action === "list") {
      const res = await fetch(
        `${GATEWAY_URL}/me/drive/root:/${folderPath}:/children?$select=id,name,size,lastModifiedDateTime,file,webUrl`,
        { headers: gatewayHeaders() },
      );
      if (res.status === 404) {
        return new Response(JSON.stringify({ items: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await res.json();
      if (!res.ok) {
        return new Response(JSON.stringify({ error: "OneDrive error", status: res.status, body: data }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const items = (data.value ?? [])
        .filter((i: any) => i.file)
        .map((i: any) => ({
          id: i.id, name: i.name, size: i.size,
          lastModified: i.lastModifiedDateTime, webUrl: i.webUrl,
        }));
      return new Response(JSON.stringify({ items }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "upload") {
      if (!fileName || !fileContentBase64) {
        return new Response(JSON.stringify({ error: "fileName and fileContentBase64 required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const bytes = Uint8Array.from(atob(fileContentBase64), (c) => c.charCodeAt(0));
      const safeName = fileName.replace(/[\\/:*?"<>|]/g, "_");
      const uploadPath = encodeURIComponent(`${ROOT_FOLDER}/${folder}/${safeName}`);
      const res = await fetch(`${GATEWAY_URL}/me/drive/root:/${uploadPath}:/content`, {
        method: "PUT",
        headers: gatewayHeaders({ "Content-Type": "application/octet-stream" }),
        body: bytes,
      });
      const data = await res.json();
      if (!res.ok) {
        return new Response(JSON.stringify({ error: "Upload failed", status: res.status, body: data }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true, item: { id: data.id, name: data.name } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "download") {
      if (!itemId) {
        return new Response(JSON.stringify({ error: "itemId required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const res = await fetch(
        `${GATEWAY_URL}/me/drive/items/${encodeURIComponent(itemId)}?$select=id,name,@microsoft.graph.downloadUrl`,
        { headers: gatewayHeaders() },
      );
      const data = await res.json();
      if (!res.ok) {
        return new Response(JSON.stringify({ error: "Download failed", status: res.status, body: data }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ downloadUrl: data["@microsoft.graph.downloadUrl"], name: data.name }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      if (!itemId) {
        return new Response(JSON.stringify({ error: "itemId required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const res = await fetch(`${GATEWAY_URL}/me/drive/items/${encodeURIComponent(itemId)}`, {
        method: "DELETE",
        headers: gatewayHeaders(),
      });
      if (!res.ok && res.status !== 204) {
        const body = await res.text();
        return new Response(JSON.stringify({ error: "Delete failed", status: res.status, body }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
