import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { userHasCompanyAccess, isServiceRoleRequest, logSync } from '../_shared/access.ts';

const requestSchema = z.object({
  companyId: z.string().uuid('Invalid company ID format'),
});

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const QUICKBOOKS_CLIENT_ID = Deno.env.get('QUICKBOOKS_CLIENT_ID')!;
const QUICKBOOKS_CLIENT_SECRET = Deno.env.get('QUICKBOOKS_CLIENT_SECRET')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function encodeBase64(str: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  return base64Encode(data);
}

async function refreshTokenIfNeeded(supabase: any, companyId: string, tokenData: any) {
  const tokenExpiry = new Date(tokenData.token_expiry);
  const now = new Date();

  if (tokenExpiry.getTime() - now.getTime() < 5 * 60 * 1000) {
    // ARCHITECTURE: all companies use ONE ACL QuickBooks app. Refresh with global creds.
    const clientId = (QUICKBOOKS_CLIENT_ID || '').trim();
    const clientSecret = (QUICKBOOKS_CLIENT_SECRET || '').trim();
    const authString = `${clientId}:${clientSecret}`;
    const authHeader = `Basic ${encodeBase64(authString)}`;

    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeader,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokenData.refresh_token,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(`Token refresh failed: ${JSON.stringify(tokens)}`);
    }

    await supabase
      .from('quickbooks_tokens')
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      })
      .eq('company_id', companyId);

    return tokens.access_token;
  }

  return tokenData.access_token;
}

// Aplana las cuentas de PRIMER NIVEL de las secciones de Ingresos y Gastos.
// Usa el total de la sección (Summary) para cuentas agrupadas (ej. "6000 Planilla"),
// y el ColData para cuentas hoja. Maneja strings QBO con comas/paréntesis.
function extractPnlLines(report: any) {
  const lines: { label: string; amount: number; group: string }[] = [];
  const asArr = (v: any) => (Array.isArray(v) ? v : v ? [v] : []);
  const lastNum = (cd: any[]) => {
    for (let i = (cd?.length || 0) - 1; i >= 1; i--) {
      let s = String(cd[i]?.value ?? '').trim();
      let neg = false;
      if (s.startsWith('(') && s.endsWith(')')) { neg = true; s = s.slice(1, -1); }
      s = s.replace(/[^0-9.\-]/g, '');
      const n = parseFloat(s);
      if (isFinite(n)) return neg ? -n : n;
    }
    return 0;
  };
  for (const sec of asArr(report.Rows?.Row)) {
    const g = String(sec.group || '');
    if (!/income|ingres|expense|gasto|cogs/i.test(g)) continue;
    for (const child of asArr(sec.Rows?.Row)) {
      const name = String(child.Header?.ColData?.[0]?.value ?? child.ColData?.[0]?.value ?? '').trim();
      const amount = child.Summary ? lastNum(child.Summary.ColData) : lastNum(child.ColData);
      if (name && amount) lines.push({ label: name, amount, group: g });
    }
  }
  const netSec = asArr(report.Rows?.Row).find(
    (s: any) => String(s.group || '').toLowerCase() === 'netincome'
  );
  if (netSec?.Summary?.ColData) {
    const amount = lastNum(netSec.Summary.ColData);
    if (amount) lines.push({ label: 'Ganancias netas', amount, group: 'netincome' });
  }
  return lines;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  let realmIdForLog = 'unknown';

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const { companyId } = parsed.data;

    // Trusted server-to-server call (nightly cron) bypasses user/admin verification.
    if (!isServiceRoleRequest(authHeader)) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        throw new Error('Unauthorized');
      }
      const allowed = await userHasCompanyAccess(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, user.id, companyId);
      if (!allowed) {
        throw new Error('Access denied to this company');
      }
    }

    console.log('Syncing profit/loss for company:', companyId);

    const { data: company, error: companyError } = await supabase
      .from('quickbooks_companies')
      .select('realm_id')
      .eq('id', companyId)
      .single();

    if (companyError || !company || !company.realm_id) {
      throw new Error('Company not found or not connected');
    }
    realmIdForLog = company.realm_id;

    const { data: tokenData, error: tokenError } = await supabase
      .from('quickbooks_tokens')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (tokenError || !tokenData) {
      throw new Error('Authentication tokens not found');
    }

    const accessToken = await refreshTokenIfNeeded(supabase, companyId, tokenData);

    const now = new Date();
    const startDate = `${now.getFullYear()}-01-01`;
    const endDate = now.toISOString().split('T')[0];

    console.log('Fetching P&L from', startDate, 'to', endDate);

    const response = await fetch(
      `https://quickbooks.api.intuit.com/v3/company/${company.realm_id}/reports/ProfitAndLoss?start_date=${startDate}&end_date=${endDate}&minorversion=65`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('QuickBooks API error:', response.status, errorText);
      throw new Error(`Failed to fetch profit/loss: ${response.status}`);
    }

    const profitLoss = await response.json();
    console.log('Profit/loss fetched successfully');

    const INCOME_GROUPS = ['income', 'otherincome'];
    const EXPENSE_GROUPS = ['expenses', 'otherexpenses', 'costofgoodssold', 'cogs'];
    const asArr = (v: any) => (Array.isArray(v) ? v : v ? [v] : []);
    const secTotal = (sec: any) => {
      const cd = sec?.Summary?.ColData;
      if (!cd) return 0;
      for (let i = cd.length - 1; i >= 1; i--) {
        let s = String(cd[i]?.value ?? '').trim();
        let neg = false;
        if (s.startsWith('(') && s.endsWith(')')) { neg = true; s = s.slice(1, -1); }
        s = s.replace(/[^0-9.\-]/g, '');
        const n = parseFloat(s);
        if (isFinite(n)) return neg ? -n : n;
      }
      return 0;
    };

    let totalIncome = 0;
    let totalExpenses = 0;
    let netIncome = 0;
    let netIncomeFromSection = false;
    for (const sec of asArr(profitLoss.Rows?.Row)) {
      const g = String(sec.group || '').toLowerCase();
      if (INCOME_GROUPS.includes(g)) totalIncome += secTotal(sec);
      else if (EXPENSE_GROUPS.includes(g)) totalExpenses += secTotal(sec);
      else if (g === 'netincome') { netIncome = secTotal(sec); netIncomeFromSection = true; }
    }
    if (!netIncomeFromSection) netIncome = totalIncome - totalExpenses;

    const reportDate = new Date().toISOString().split('T')[0];

    // Delete old records for this company and period
    await supabase
      .from('quickbooks_profit_loss')
      .delete()
      .eq('company_id', companyId)
      .eq('report_date', reportDate);

    // Insert new profit/loss record
    const { error: insertError } = await supabase
      .from('quickbooks_profit_loss')
      .insert({
        company_id: companyId,
        report_date: reportDate,
        start_date: startDate,
        end_date: endDate,
        total_income: totalIncome,
        total_expenses: totalExpenses,
        net_income: netIncome,
        raw_data: { ...profitLoss, lines: extractPnlLines(profitLoss) },
        synced_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error(`Failed to save profit/loss: ${insertError.message}`);
    }

    console.log('Profit/loss synced successfully');

    await logSync(supabase, {
      realmId: realmIdForLog,
      syncType: 'profit_loss',
      status: 'success',
      recordsSynced: 1,
    });

    return new Response(
      JSON.stringify({
        success: true,
        reportDate,
        startDate,
        endDate,
        totalIncome,
        totalExpenses,
        netIncome,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Sync error:', error);
    await logSync(supabase, {
      realmId: realmIdForLog,
      syncType: 'profit_loss',
      status: 'error',
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
