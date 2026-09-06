import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TaxEstimate, TaxSettings, estimateTax } from '@/lib/groupConsolidation';

export interface ExecutiveMonth {
  month: number;
  income: number;
  expenses: number;
  profit: number;
}

export interface CompanyExecutive {
  companyName: string;
  isConnected: boolean;
  syncedAt: string | null;
  hasData: boolean;
  /** Corte real del dato (end_date del snapshot más reciente). */
  cutoff: string | null;
  income: number;
  expenses: number;
  profit: number;
  monthsElapsed: number;
  months: ExecutiveMonth[];
  /** Impuesto estimado sobre la utilidad acumulada real. */
  tax: TaxEstimate;
  /** Utilidad anualizada (real acumulado extrapolado a 12 meses). */
  annualizedProfit: number | null;
  /** Renta estimada del año completo, sobre la utilidad anualizada. */
  projectedTax: TaxEstimate;
}

const lastDayOfMonth = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);

export function useCompanyExecutive(companyId: string | null, year: number) {
  return useQuery({
    queryKey: ['company-executive', companyId, year],
    enabled: !!companyId,
    queryFn: async (): Promise<CompanyExecutive> => {
      const periodStart = `${year}-01-01`;
      const periodEnd = `${year}-12-31`;

      const [companyRes, pnlRes, taxRes] = await Promise.all([
        supabase
          .from('quickbooks_companies')
          .select('id, company_name, is_connected')
          .eq('id', companyId!)
          .maybeSingle(),
        supabase
          .from('quickbooks_profit_loss')
          .select('report_date, start_date, end_date, total_income, total_expenses, net_income, synced_at')
          .eq('company_id', companyId!)
          .gte('start_date', periodStart)
          .lte('end_date', periodEnd)
          .order('report_date', { ascending: false }),
        supabase
          .from('tax_estimate_settings')
          .select('*')
          .eq('company_id', companyId!)
          .eq('fiscal_period', String(year))
          .maybeSingle(),
      ]);

      const company = companyRes.data;
      const pnl = pnlRes.data ?? [];
      const settings = (taxRes.data ?? null) as unknown as TaxSettings | null;

      const latest = pnl[0] ?? null;
      const income = Number(latest?.total_income ?? 0);
      const expenses = Number(latest?.total_expenses ?? 0);
      const profit = Number(latest?.net_income ?? income - expenses);

      // Serie mensual: los reportes son acumulados YTD, así que el mes = diferencia
      // entre el último snapshot de cada cierre mensual.
      const cumulative: (ExecutiveMonth | null)[] = [];
      for (let m = 1; m <= 12; m++) {
        const end = lastDayOfMonth(year, m);
        const snap = pnl.find((r) => r.end_date <= end);
        cumulative.push(
          snap
            ? {
                month: m,
                income: Number(snap.total_income ?? 0),
                expenses: Number(snap.total_expenses ?? 0),
                profit: Number(snap.net_income ?? 0),
              }
            : null,
        );
      }

      const months: ExecutiveMonth[] = [];
      let prev = { income: 0, expenses: 0, profit: 0 };
      for (let m = 1; m <= 12; m++) {
        const cur = cumulative[m - 1];
        if (!cur) continue;
        months.push({
          month: m,
          income: cur.income - prev.income,
          expenses: cur.expenses - prev.expenses,
          profit: cur.profit - prev.profit,
        });
        prev = { income: cur.income, expenses: cur.expenses, profit: cur.profit };
      }

      const monthsElapsed = months.length;
      const annualizedProfit = monthsElapsed > 0 ? (profit / monthsElapsed) * 12 : null;

      return {
        companyName: company?.company_name ?? '—',
        isConnected: !!company?.is_connected,
        syncedAt: latest?.synced_at ?? null,
        hasData: !!latest,
        cutoff: latest?.end_date ?? null,
        income,
        expenses,
        profit,
        monthsElapsed,
        months,
        tax: latest
          ? estimateTax(profit, settings)
          : { configured: false, amount: null, taxableBase: null, rateLabel: null },
        annualizedProfit,
        projectedTax:
          latest && annualizedProfit !== null
            ? estimateTax(annualizedProfit, settings)
            : { configured: false, amount: null, taxableBase: null, rateLabel: null },
      };
    },
  });
}
