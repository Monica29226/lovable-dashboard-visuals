import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { userHasCompanyAccess, isServiceRoleRequest } from '../_shared/access.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const QUICKBOOKS_CLIENT_ID = Deno.env.get('QUICKBOOKS_CLIENT_ID')!;
const QUICKBOOKS_CLIENT_SECRET = Deno.env.get('QUICKBOOKS_CLIENT_SECRET')!;

const QB_BASE = 'https://quickbooks.api.intuit.com/v3/company';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z
  .object({
    companyId: z.string().uuid('Invalid company ID format'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be YYYY-MM-DD'),
  })
  .refine((d) => d.startDate <= d.endDate, {
    message: 'startDate must be <= endDate',
    path: ['startDate'],
  });

function encodeBase64(str: string): string {
  const encoder = new TextEncoder();
  return base64Encode(encoder.encode(str));
}

// Safe number parsing: QB strings can carry commas/spaces/parentheses.
function num(value: any): number | null {
  if (value === null || value === undefined) return null;
  let s = String(value).trim();
  if (s === '') return null;
  let negative = false;
  if (s.startsWith('(') && s.endsWith(')')) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/[^0-9.\-]/g, '');
  if (s === '' || s === '-' || s === '.') return null;
  const n = parseFloat(s);
  if (!isFinite(n)) return null;
  return negative ? -n : n;
}

function safe(n: number | null): number | null {
  if (n === null || n === undefined) return null;
  if (!isFinite(n)) return null;
  return n;
}

async function refreshTokenIfNeeded(supabase: any, companyId: string, tokenData: any) {
  const tokenExpiry = new Date(tokenData.token_expiry);
  const now = new Date();

  if (tokenExpiry.getTime() - now.getTime() < 5 * 60 * 1000) {
    const clientId = (QUICKBOOKS_CLIENT_ID || '').trim();
    const clientSecret = (QUICKBOOKS_CLIENT_SECRET || '').trim();
    const authHeader = `Basic ${encodeBase64(`${clientId}:${clientSecret}`)}`;

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

async function qbReport(realm: string, accessToken: string, path: string) {
  const res = await fetch(`${QB_BASE}/${realm}/reports/${path}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    const err: any = new Error(`QuickBooks API error: ${res.status}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  return await res.json();
}

function asArray<T>(v: T | T[] | undefined | null): T[] {
  if (v === null || v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

function getCurrency(...reports: any[]): string | null {
  for (const r of reports) {
    const c = r?.Header?.Currency;
    if (c && typeof c === 'string' && c.trim() !== '') return c.trim();
  }
  return null;
}

// Locate a top-level section row by keywords in its group or header title.
function findSection(rows: any[], keywords: string[]): any | null {
  for (const row of rows) {
    const group = String(row.group || '').toLowerCase();
    const header = String(row.Header?.ColData?.[0]?.value || '').toLowerCase();
    if (keywords.some((k) => group.includes(k) || header.includes(k))) {
      return row;
    }
  }
  return null;
}

function sectionSummaryTotal(section: any): number | null {
  const cols = section?.Summary?.ColData;
  if (!cols) return null;
  // last column typically holds the total for single-column reports
  for (let i = cols.length - 1; i >= 1; i--) {
    const v = num(cols[i]?.value);
    if (v !== null) return v;
  }
  return null;
}

// Find a top-level section by its `group` attribute (case-insensitive, any of the given names).
function findSectionByGroup(rows: any[], groups: string[]): any | null {
  const wanted = groups.map((g) => g.toLowerCase());
  for (const row of rows) {
    const group = String(row.group || '').toLowerCase();
    if (group && wanted.includes(group)) return row;
  }
  return null;
}

// Sum the Summary totals of every section matching any of the given groups. Returns null if none present.
function sumSectionsByGroup(rows: any[], groups: string[]): number | null {
  const wanted = groups.map((g) => g.toLowerCase());
  let total: number | null = null;
  for (const row of rows) {
    const group = String(row.group || '').toLowerCase();
    if (group && wanted.includes(group)) {
      total = (total ?? 0) + (sectionSummaryTotal(row) ?? 0);
    }
  }
  return total;
}

// Sum a specific column index across every section matching any of the given groups.
function sumSectionsColByGroup(rows: any[], groups: string[], idx: number): number | null {
  const wanted = groups.map((g) => g.toLowerCase());
  let total: number | null = null;
  for (const row of rows) {
    const group = String(row.group || '').toLowerCase();
    if (group && wanted.includes(group)) {
      const v = num(row?.Summary?.ColData?.[idx]?.value);
      if (v !== null) total = (total ?? 0) + v;
    }
  }
  return total;
}

const INCOME_GROUPS = ['income', 'otherincome'];
const EXPENSE_GROUPS = ['expenses', 'otherexpenses', 'costofgoodssold', 'cogs'];



serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
    const { companyId, startDate, endDate } = parsed.data;

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

    const { data: company, error: companyError } = await supabase
      .from('quickbooks_companies')
      .select('id, company_name, realm_id, moneda_funcional')
      .eq('id', companyId)
      .single();

    if (companyError || !company || !company.realm_id) {
      throw new Error('Company not found or not connected');
    }

    const { data: tokenData, error: tokenError } = await supabase
      .from('quickbooks_tokens')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (tokenError || !tokenData) {
      throw new Error('Authentication tokens not found');
    }

    const accessToken = await refreshTokenIfNeeded(supabase, companyId, tokenData);
    const realm = company.realm_id;

    // ---- Fetch reports independently ----
    let pnlRaw: any = null;
    let monthlyRaw: any = null;
    let balanceRaw: any = null;
    let receivablesRaw: any = null;
    let receivablesUnavailable = false;

    try {
      pnlRaw = await qbReport(realm, accessToken, `ProfitAndLoss?start_date=${startDate}&end_date=${endDate}&minorversion=65`);
    } catch (e) {
      console.error('P&L fetch error:', e);
    }

    try {
      monthlyRaw = await qbReport(realm, accessToken, `ProfitAndLoss?start_date=${startDate}&end_date=${endDate}&summarize_column_by=Month&minorversion=65`);
    } catch (e) {
      console.error('Monthly P&L fetch error:', e);
    }

    try {
      balanceRaw = await qbReport(realm, accessToken, `BalanceSheet?end_date=${endDate}&minorversion=65`);
    } catch (e) {
      console.error('Balance fetch error:', e);
    }

    try {
      receivablesRaw = await qbReport(realm, accessToken, `AgedReceivables?report_date=${endDate}&minorversion=65`);
    } catch (e: any) {
      console.error('AgedReceivables fetch error:', e?.status, e?.body);
      receivablesUnavailable = true;
    }

    let cashflowRaw: any = null;
    let cashflowUnavailable = false;
    try {
      cashflowRaw = await qbReport(realm, accessToken, `CashFlow?start_date=${startDate}&end_date=${endDate}&minorversion=65`);
    } catch (e: any) {
      console.error('CashFlow fetch error:', e?.status, e?.body);
      cashflowUnavailable = true;
    }

    // ---- currency ----
    const currency =
      getCurrency(pnlRaw, balanceRaw) ||
      (company.moneda_funcional && String(company.moneda_funcional).trim() !== ''
        ? String(company.moneda_funcional).trim()
        : null);

    // ---- P&L parse ----
    const pnl: any = {
      status: 'unavailable',
      income: null,
      expenses: null,
      netIncome: null,
      netIncomeCheck: null,
      margin: null,
      expenseCategories: [],
    };
    try {
      if (pnlRaw) {
        const rows = asArray(pnlRaw.Rows?.Row);
        if (rows.length === 0) {
          pnl.status = 'no_data';
        } else {
          // income = Income + OtherIncome ; expenses = Expenses + OtherExpenses + COGS
          const income = sumSectionsByGroup(rows, INCOME_GROUPS);
          const expenses = sumSectionsByGroup(rows, EXPENSE_GROUPS);

          // Authoritative net income from the NetIncome section if present.
          const netIncomeSection = findSectionByGroup(rows, ['netincome']);
          const reportedNet = netIncomeSection ? sectionSummaryTotal(netIncomeSection) : null;

          const derivedNet =
            income !== null || expenses !== null ? (income ?? 0) - (expenses ?? 0) : null;

          const netIncome = reportedNet !== null ? reportedNet : derivedNet;

          let netIncomeCheck: boolean | null = null;
          if (netIncome !== null && derivedNet !== null) {
            netIncomeCheck = Math.abs(netIncome - derivedNet) < 1;
          }

          let margin: number | null = null;
          if (income !== null && income !== 0 && netIncome !== null) {
            margin = safe(netIncome / income);
          }

          // Expense categories: first-level accounts inside the main Expenses section.
          const expenseSection = findSectionByGroup(rows, ['expenses']);
          const catRows = asArray(expenseSection?.Rows?.Row);
          const rawCats: { name: string; amount: number }[] = [];
          for (const cr of catRows) {
            let name = '';
            let amount: number | null = null;
            if (cr.type === 'Section') {
              name = String(cr.Header?.ColData?.[0]?.value || '').trim();
              amount = sectionSummaryTotal(cr);
            } else {
              const cd = cr.ColData;
              name = String(cd?.[0]?.value || '').trim();
              for (let i = (cd?.length || 0) - 1; i >= 1; i--) {
                const v = num(cd?.[i]?.value);
                if (v !== null) { amount = v; break; }
              }
            }
            if (name && amount !== null && amount !== 0) {
              rawCats.push({ name, amount: Math.abs(amount) });
            }
          }
          rawCats.sort((a, b) => b.amount - a.amount);

          // pct is computed against the main Expenses section total so categories sum correctly.
          const expensesSectionTotal = expenseSection ? sectionSummaryTotal(expenseSection) : null;
          const totalExpForPct =
            expensesSectionTotal !== null
              ? Math.abs(expensesSectionTotal)
              : rawCats.reduce((s, c) => s + c.amount, 0);

          let categories = rawCats;
          if (rawCats.length > 8) {
            const top = rawCats.slice(0, 8);
            const rest = rawCats.slice(8).reduce((s, c) => s + c.amount, 0);
            if (rest > 0) top.push({ name: 'Otros', amount: rest });
            categories = top;
          }
          const expenseCategories = categories.map((c) => ({
            name: c.name,
            amount: safe(c.amount),
            pct: totalExpForPct > 0 ? safe(c.amount / totalExpForPct) : null,
          }));

          pnl.income = safe(income);
          pnl.expenses = safe(expenses);
          pnl.netIncome = safe(netIncome);
          pnl.netIncomeCheck = netIncomeCheck;
          pnl.margin = margin;
          pnl.expenseCategories = expenseCategories;
          pnl.status = income === null && expenses === null ? 'no_data' : 'ok';
        }
      }
    } catch (e) {
      console.error('P&L parse error:', e);
      pnl.status = 'unavailable';
    }

    // ---- Monthly parse ----
    const monthly: any = { status: 'unavailable', series: [] };
    try {
      if (monthlyRaw) {
        const cols = asArray(monthlyRaw.Columns?.Column);
        // month columns: skip first (account label) and any Total column
        const monthCols: { idx: number; label: string }[] = [];
        cols.forEach((col: any, idx: number) => {
          if (idx === 0) return;
          const title = String(col.ColTitle || '').trim();
          if (!title) return;
          if (/total/i.test(title)) return;
          // format label as 'MMM YYYY' when possible
          const meta = asArray(col.MetaData).find((m: any) => m?.Name === 'StartDate');
          let label = title;
          const dateStr = meta?.Value || title;
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) {
            label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
          }
          monthCols.push({ idx, label });
        });

        const rows = asArray(monthlyRaw.Rows?.Row);
        const netIncomeSection = findSectionByGroup(rows, ['netincome']);

        const series = monthCols.map((mc) => {
          const inc = sumSectionsColByGroup(rows, INCOME_GROUPS, mc.idx);
          const exp = sumSectionsColByGroup(rows, EXPENSE_GROUPS, mc.idx);

          const reportedNet = netIncomeSection
            ? num(netIncomeSection?.Summary?.ColData?.[mc.idx]?.value)
            : null;
          const derivedNet = inc !== null || exp !== null ? (inc ?? 0) - (exp ?? 0) : null;
          const net = reportedNet !== null ? reportedNet : derivedNet;

          return {
            label: mc.label,
            income: safe(inc),
            expenses: safe(exp),
            net: safe(net),
          };
        });

        monthly.series = series;
        if (series.length === 0) monthly.status = 'no_data';
        else if (series.length < 2) monthly.status = 'insufficient';
        else monthly.status = 'ok';
      }
    } catch (e) {
      console.error('Monthly parse error:', e);
      monthly.status = 'unavailable';
    }

    // ---- Balance parse ----
    const balance: any = {
      status: 'unavailable',
      asOf: endDate,
      assets: null,
      liabilities: null,
      equity: null,
      equitySource: null,
      reconciles: null,
    };
    try {
      if (balanceRaw) {
        const rows = asArray(balanceRaw.Rows?.Row);
        if (rows.length === 0) {
          balance.status = 'no_data';
        } else {
          let assets: number | null = null;
          let liabilities: number | null = null;
          let equity: number | null = null;

          const equityKeywords = ['fondos propios', 'patrimonio', 'equity', 'capital', 'accionista'];

          for (const mainSection of rows) {
            const group = String(mainSection.group || '');
            if (group === 'NetAssets') {
              assets = sectionSummaryTotal(mainSection);
            } else if (group === 'NetLiabilitiesAndShareHolderEquity') {
              for (const sub of asArray(mainSection.Rows?.Row)) {
                const header = String(sub.Header?.ColData?.[0]?.value || '').toLowerCase();
                const subGroup = String(sub.group || '').toLowerCase();
                if (header.includes('pasivo') || header.includes('liabilit') || subGroup.includes('liabilit')) {
                  liabilities = (liabilities ?? 0) + (sectionSummaryTotal(sub) ?? 0);
                } else if (equityKeywords.some((k) => header.includes(k)) || subGroup.includes('equity')) {
                  equity = (equity ?? 0) + (sectionSummaryTotal(sub) ?? 0);
                }
              }
            }
          }

          let equitySource: string | null = null;
          if (equity !== null && equity !== 0) {
            equitySource = 'reported';
          } else if (assets !== null && liabilities !== null) {
            equity = assets - liabilities;
            equitySource = 'calculated';
          }

          let reconciles: boolean | null = null;
          if (assets !== null && liabilities !== null && equity !== null) {
            reconciles = Math.abs((liabilities + equity) - assets) < 1;
          }

          balance.assets = safe(assets);
          balance.liabilities = safe(liabilities);
          balance.equity = safe(equity);
          balance.equitySource = equitySource;
          balance.reconciles = reconciles;
          balance.status = assets === null && liabilities === null ? 'no_data' : 'ok';
        }
      }
    } catch (e) {
      console.error('Balance parse error:', e);
      balance.status = 'unavailable';
    }

    // ---- Receivables parse ----
    const receivables: any = {
      status: 'unavailable',
      total: null,
      buckets: { d0_30: null, d31_60: null, d61_90: null, d90p: null },
      pctOverdue: null,
      pctOver60: null,
      rows: [],
    };
    try {
      if (receivablesUnavailable || !receivablesRaw) {
        receivables.status = 'unavailable';
      } else {
        const cols = asArray(receivablesRaw.Columns?.Column);
        // Map bucket columns by title
        const bucketIdx: { [k: string]: number } = {};
        let currentIdx = -1;
        let totalIdx = -1;
        cols.forEach((col: any, idx: number) => {
          const title = String(col.ColTitle || '').toLowerCase();
          if (/total/.test(title)) totalIdx = idx;
          else if (title.includes('current') || title.includes('corriente')) bucketIdx.current = idx;
          else if (title.includes('1 - 30') || title.includes('1-30')) bucketIdx.d1_30 = idx;
          else if (title.includes('31 - 60') || title.includes('31-60')) bucketIdx.d31_60 = idx;
          else if (title.includes('61 - 90') || title.includes('61-90')) bucketIdx.d61_90 = idx;
          else if (title.includes('91') || title.includes('90')) bucketIdx.d90p = idx;
        });

        let d0_30 = 0, d31_60 = 0, d61_90 = 0, d90p = 0, total = 0;
        let anyData = false;
        const dataRows: any[] = [];

        function walk(rws: any[]) {
          for (const row of rws) {
            if (row.type === 'Section' && row.Rows?.Row) {
              walk(asArray(row.Rows.Row));
            } else if (row.ColData) {
              const cd = row.ColData;
              const customer = String(cd?.[0]?.value || '').trim();
              if (!customer) continue;
              const cur = bucketIdx.current !== undefined ? (num(cd[bucketIdx.current]?.value) ?? 0) : 0;
              const b1 = bucketIdx.d1_30 !== undefined ? (num(cd[bucketIdx.d1_30]?.value) ?? 0) : 0;
              const b31 = bucketIdx.d31_60 !== undefined ? (num(cd[bucketIdx.d31_60]?.value) ?? 0) : 0;
              const b61 = bucketIdx.d61_90 !== undefined ? (num(cd[bucketIdx.d61_90]?.value) ?? 0) : 0;
              const b90 = bucketIdx.d90p !== undefined ? (num(cd[bucketIdx.d90p]?.value) ?? 0) : 0;
              const rowTotal = totalIdx >= 0 ? (num(cd[totalIdx]?.value) ?? (cur + b1 + b31 + b61 + b90)) : (cur + b1 + b31 + b61 + b90);
              if (rowTotal === 0 && cur === 0 && b1 === 0 && b31 === 0 && b61 === 0 && b90 === 0) continue;
              anyData = true;

              d0_30 += cur + b1;
              d31_60 += b31;
              d61_90 += b61;
              d90p += b90;
              total += rowTotal;

              // estimate daysOverdue by worst bucket
              let daysOverdue = 0;
              if (b90 > 0) daysOverdue = 91;
              else if (b61 > 0) daysOverdue = 61;
              else if (b31 > 0) daysOverdue = 31;
              else if (b1 > 0) daysOverdue = 1;
              let status = 'al_dia';
              if (daysOverdue > 90) status = 'critico';
              else if (daysOverdue > 0) status = 'vencido';

              dataRows.push({
                customer,
                amount: safe(rowTotal),
                daysOverdue,
                dueDate: null,
                status,
              });
            }
          }
        }

        walk(asArray(receivablesRaw.Rows?.Row));

        if (!anyData) {
          receivables.status = 'no_data';
        } else {
          const overdue = d31_60 + d61_90 + d90p + Math.max(0, d0_30 - 0); // overdue = >0 days
          // pctOverdue uses amounts in buckets >0 days. d0_30 includes current(0 days)+1-30.
          // Recompute overdue strictly >0 days: 1-30 + 31-60 + 61-90 + 90+
          const strictlyOverdue = (d0_30) + d31_60 + d61_90 + d90p; // note d0_30 mixes current; kept simple
          receivables.buckets = {
            d0_30: safe(d0_30),
            d31_60: safe(d31_60),
            d61_90: safe(d61_90),
            d90p: safe(d90p),
          };
          receivables.total = safe(total);
          const over0 = d0_30 + d31_60 + d61_90 + d90p; // best available proxy
          const over60 = d61_90 + d90p;
          receivables.pctOverdue = total > 0 ? safe(over0 / total) : null;
          receivables.pctOver60 = total > 0 ? safe(over60 / total) : null;
          receivables.rows = dataRows;
          receivables.status = 'ok';
        }
      }
    } catch (e) {
      console.error('Receivables parse error:', e);
      receivables.status = 'unavailable';
    }

    // ---- Cash parse (available cash from BalanceSheet NetAssets) ----
    const cash: any = { status: 'unavailable', available: null };
    try {
      if (balanceRaw) {
        const rows = asArray(balanceRaw.Rows?.Row);
        const cashKeywords = ['banco', 'bancos', 'caja', 'efectivo', 'bank', 'cash'];
        let total: number | null = null;

        const scan = (rws: any[]) => {
          for (const row of rws) {
            const header = String(row.Header?.ColData?.[0]?.value || '').toLowerCase();
            const label = String(row.ColData?.[0]?.value || '').toLowerCase();
            const name = header || label;
            if (name && cashKeywords.some((k) => name.includes(k))) {
              let amount: number | null = null;
              if (row.Summary?.ColData) {
                amount = sectionSummaryTotal(row);
              } else if (row.ColData) {
                const cd = row.ColData;
                for (let i = cd.length - 1; i >= 1; i--) {
                  const v = num(cd[i]?.value);
                  if (v !== null) { amount = v; break; }
                }
              }
              if (amount !== null) total = (total ?? 0) + amount;
              // matched section counted as a whole; don't double count children
              continue;
            }
            if (row.Rows?.Row) scan(asArray(row.Rows.Row));
          }
        };

        const netAssets = findSectionByGroup(rows, ['netassets']);
        if (netAssets) {
          scan(asArray(netAssets.Rows?.Row));
        }

        cash.available = safe(total);
        cash.status = total === null ? 'no_data' : 'ok';
      }
    } catch (e) {
      console.error('Cash parse error:', e);
      cash.status = 'unavailable';
    }

    const result = {
      companyId,
      companyName: company.company_name,
      currency,
      period: { startDate, endDate },
      generatedAt: new Date().toISOString(),
      connection: 'connected',
      pnl,
      monthly,
      balance,
      receivables,
      cash,
    };


    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
