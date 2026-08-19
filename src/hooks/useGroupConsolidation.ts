import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  PnlLine,
  TaxEstimate,
  TaxSettings,
  estimateTax,
  normalizeGroup,
} from '@/lib/groupConsolidation';

export interface CompanyConsolidationRow {
  companyId: string;
  companyName: string;
  isConnected: boolean;
  syncedAt: string | null;
  hasData: boolean;
  income: number;
  expenses: number;
  profit: number;
  tax: TaxEstimate;
  lines: PnlLine[];
}

export interface ConsolidatedLine {
  label: string;
  type: 'income' | 'expense' | 'other';
  amount: number;
}

export interface GroupConsolidation {
  rows: CompanyConsolidationRow[];
  totals: {
    income: number;
    expenses: number;
    profit: number;
    /** null cuando ninguna empresa tiene configuración fiscal. */
    tax: number | null;
    taxConfigured: number;
    taxTotalCompanies: number;
    taxPending: number;
  };
  consolidatedIncome: ConsolidatedLine[];
  consolidatedExpenses: ConsolidatedLine[];
  lastSyncedAt: string | null;
  /** Corte real del dato usado (end_date más antiguo entre empresas con datos). */
  dataCutoff: string | null;
  /** true si las empresas con datos tienen cortes distintos. */
  mixedCutoff: boolean;
}


const lastDayOfMonth = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);

export function useGroupConsolidation(
  companyIds: string[],
  year: number,
  cutoffMonth: number,
) {
  return useQuery({
    queryKey: ['group-consolidation', companyIds.slice().sort().join(','), year, cutoffMonth],
    enabled: companyIds.length > 0,
    queryFn: async (): Promise<GroupConsolidation> => {
      const periodEnd = lastDayOfMonth(year, cutoffMonth);
      const periodStart = `${year}-01-01`;

      const [companiesRes, pnlRes, taxRes] = await Promise.all([
        supabase
          .from('quickbooks_companies')
          .select('id, company_name, is_connected')
          .in('id', companyIds),
        supabase
          .from('quickbooks_profit_loss')
          .select('company_id, report_date, start_date, end_date, total_income, total_expenses, net_income, synced_at, raw_data')
          .in('company_id', companyIds)
          .gte('start_date', periodStart)
          .lte('end_date', periodEnd)
          .order('report_date', { ascending: false }),
        supabase
          .from('tax_estimate_settings')
          .select('*')
          .in('company_id', companyIds)
          .eq('fiscal_period', String(year)),
      ]);

      const companies = companiesRes.data ?? [];
      const pnl = pnlRes.data ?? [];
      const taxSettings = (taxRes.data ?? []) as unknown as TaxSettings[];

      // Snapshot más reciente por empresa dentro del periodo (los reportes son acumulados YTD).
      const latest = new Map<string, (typeof pnl)[number]>();
      for (const row of pnl) {
        if (!latest.has(row.company_id)) latest.set(row.company_id, row);
      }

      const incomeMap = new Map<string, number>();
      const expenseMap = new Map<string, number>();

      const rows: CompanyConsolidationRow[] = companyIds.map((id) => {
        const company = companies.find((c) => c.id === id);
        const snap = latest.get(id);
        const rawLines: PnlLine[] = Array.isArray((snap?.raw_data as any)?.lines)
          ? ((snap!.raw_data as any).lines as PnlLine[])
          : [];

        const income = Number(snap?.total_income ?? 0);
        const expenses = Number(snap?.total_expenses ?? 0);
        const profit = Number(snap?.net_income ?? income - expenses);

        for (const line of rawLines) {
          const type = normalizeGroup(line.group);
          if (type === 'income') {
            incomeMap.set(line.label, (incomeMap.get(line.label) ?? 0) + Number(line.amount || 0));
          } else if (type === 'expense') {
            expenseMap.set(line.label, (expenseMap.get(line.label) ?? 0) + Number(line.amount || 0));
          }
        }

        return {
          companyId: id,
          companyName: company?.company_name ?? '—',
          isConnected: !!company?.is_connected,
          syncedAt: snap?.synced_at ?? null,
          hasData: !!snap,
          income,
          expenses,
          profit,
          tax: snap
            ? estimateTax(profit, taxSettings.find((t) => t.company_id === id))
            : { configured: false, amount: null, taxableBase: null, rateLabel: null },
          lines: rawLines,
        };
      });

      const withData = rows.filter((r) => r.hasData);

      const totals = {
        income: withData.reduce((s, r) => s + r.income, 0),
        expenses: withData.reduce((s, r) => s + r.expenses, 0),
        profit: withData.reduce((s, r) => s + r.profit, 0),
        tax: rows.reduce((s, r) => s + (r.tax.amount ?? 0), 0),
        taxPending: rows.filter((r) => !r.tax.configured).length,
      };

      const toLines = (map: Map<string, number>, type: 'income' | 'expense'): ConsolidatedLine[] =>
        Array.from(map.entries())
          .map(([label, amount]) => ({ label, amount, type }))
          .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

      const syncTimes = withData.map((r) => r.syncedAt).filter(Boolean) as string[];

      return {
        rows,
        totals,
        consolidatedIncome: toLines(incomeMap, 'income'),
        consolidatedExpenses: toLines(expenseMap, 'expense'),
        lastSyncedAt: syncTimes.length ? syncTimes.sort().slice(-1)[0] : null,
      };
    },
  });
}
