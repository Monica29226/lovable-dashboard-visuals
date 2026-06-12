import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.object({
  companyId: z.string().uuid(),
  fileBase64: z.string().min(1).max(20_000_000),
  fileName: z.string().max(255).optional(),
});

// Structured shape we want the AI to return.
const aiSchema = {
  name: "extract_financials",
  description:
    "Extrae el Balance General y el Estado de Resultados desde el contenido de un Excel financiero, sin importar el formato.",
  parameters: {
    type: "object",
    properties: {
      report_date: { type: "string", description: "Fecha del reporte en formato YYYY-MM-DD. Si solo hay año/mes, usa el último día del periodo." },
      period_start: { type: "string", description: "Inicio del periodo del estado de resultados YYYY-MM-DD (opcional)." },
      period_end: { type: "string", description: "Fin del periodo del estado de resultados YYYY-MM-DD (opcional)." },
      balance: {
        type: "object",
        properties: {
          total_assets: { type: "number" },
          total_liabilities: { type: "number" },
          total_equity: { type: "number" },
          lines: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                amount: { type: "number" },
                group: { type: "string", enum: ["asset", "liability", "equity"] },
              },
              required: ["label", "amount", "group"],
            },
          },
        },
        required: ["total_assets", "total_liabilities", "total_equity"],
      },
      income_statement: {
        type: "object",
        properties: {
          total_income: { type: "number" },
          total_expenses: { type: "number" },
          net_income: { type: "number" },
          lines: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                amount: { type: "number" },
                group: { type: "string", enum: ["income", "expense"] },
              },
              required: ["label", "amount", "group"],
            },
          },
        },
        required: ["total_income", "total_expenses", "net_income"],
      },
    },
    required: ["report_date", "balance", "income_statement"],
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Auth + admin check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) return json({ error: "Unauthorized" }, 401);

    const { data: adminRole } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) return json({ error: "Unauthorized - Admin access required" }, 403);

    if (!lovableKey) return json({ error: "LOVABLE_API_KEY is not configured" }, 500);

    // Validate input
    const parsed = requestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: "Validation failed", details: parsed.error.errors }, 400);
    }
    const { companyId, fileBase64, fileName } = parsed.data;

    // Decode and parse the Excel into readable text per sheet
    const binary = Uint8Array.from(atob(fileBase64), (c) => c.charCodeAt(0));
    const wb = XLSX.read(binary, { type: "array" });
    let sheetText = "";
    for (const name of wb.SheetNames) {
      const sheet = wb.Sheets[name];
      const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
      sheetText += `\n### Hoja: ${name}\n${csv}\n`;
    }
    sheetText = sheetText.slice(0, 60_000); // keep prompt bounded

    // Ask Lovable AI to extract structured financials
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": lovableKey,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Eres un contador experto. Recibes el contenido crudo de un Excel financiero (puede estar en español, con cualquier formato) y extraes el Balance General (Estado de Posición Financiera) y el Estado de Resultados. Convierte montos a números (sin separadores de miles, los negativos como negativos). Usa la herramienta provista para responder.",
          },
          { role: "user", content: `Contenido del archivo:\n${sheetText}` },
        ],
        tools: [{ type: "function", function: aiSchema }],
        tool_choice: { type: "function", function: { name: "extract_financials" } },
      }),
    });

    if (aiResp.status === 429) return json({ error: "AI rate limit, intenta de nuevo en unos momentos." }, 429);
    if (aiResp.status === 402) return json({ error: "Sin créditos de IA. Agrega créditos en Settings → Workspace → Usage." }, 402);
    if (!aiResp.ok) {
      const txt = await aiResp.text();
      return json({ error: `AI error ${aiResp.status}`, detail: txt.slice(0, 500) }, 502);
    }

    const aiData = await aiResp.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return json({ error: "La IA no pudo extraer datos del Excel. Revisa el formato." }, 422);
    }
    const extracted = JSON.parse(toolCall.function.arguments);

    const reportDate = extracted.report_date ?? new Date().toISOString().slice(0, 10);

    // Upload original file to storage (best-effort)
    if (fileName) {
      const path = `${companyId}/${Date.now()}-${fileName}`;
      await supabaseAdmin.storage
        .from("company-uploads")
        .upload(path, binary, {
          contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          upsert: true,
        });
    }

    // REPLACE existing data for this company
    await supabaseAdmin.from("quickbooks_balance_sheet").delete().eq("company_id", companyId);
    await supabaseAdmin.from("quickbooks_profit_loss").delete().eq("company_id", companyId);

    const { error: balErr } = await supabaseAdmin.from("quickbooks_balance_sheet").insert({
      company_id: companyId,
      report_date: reportDate,
      total_assets: extracted.balance?.total_assets ?? 0,
      total_liabilities: extracted.balance?.total_liabilities ?? 0,
      total_equity: extracted.balance?.total_equity ?? 0,
      raw_data: extracted.balance ?? {},
    });
    if (balErr) return json({ error: `No se pudo guardar el balance: ${balErr.message}` }, 500);

    const { error: plErr } = await supabaseAdmin.from("quickbooks_profit_loss").insert({
      company_id: companyId,
      report_date: reportDate,
      start_date: extracted.period_start ?? null,
      end_date: extracted.period_end ?? null,
      total_income: extracted.income_statement?.total_income ?? 0,
      total_expenses: extracted.income_statement?.total_expenses ?? 0,
      net_income: extracted.income_statement?.net_income ?? 0,
      raw_data: extracted.income_statement ?? {},
    });
    if (plErr) return json({ error: `No se pudo guardar el estado de resultados: ${plErr.message}` }, 500);

    // Mark company as excel-sourced
    await supabaseAdmin
      .from("quickbooks_companies")
      .update({ data_source: "excel" })
      .eq("id", companyId);

    return json({ success: true, report_date: reportDate, extracted });
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }

  function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
