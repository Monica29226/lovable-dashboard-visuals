/**
 * Utilidades de consolidación de grupo.
 * Consolidación simple: suma por categorías normalizadas, SIN eliminaciones intercompañía.
 * Formato ACL: montos completos, coma de miles, negativos entre paréntesis, sin decimales.
 */

export const formatAmount = (value: number): string => {
  const rounded = Math.round(value);
  const abs = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.abs(rounded));
  return rounded < 0 ? `(${abs})` : abs;
};

export const formatDateTime = (iso: string | null | undefined, language: 'es' | 'en'): string => {
  if (!iso) return language === 'es' ? 'Sin sincronizar' : 'Never synced';
  return new Date(iso).toLocaleString(language === 'es' ? 'es-CR' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

export interface PnlLine {
  group: string;
  label: string;
  amount: number;
}

export const INCOME_GROUPS = ['income', 'otherincome'];
export const EXPENSE_GROUPS = ['expenses', 'cogs', 'otherexpense', 'otherexpenses'];

export const normalizeGroup = (group: string): 'income' | 'expense' | 'other' => {
  const g = (group || '').toLowerCase().replace(/\s/g, '');
  if (INCOME_GROUPS.includes(g)) return 'income';
  if (EXPENSE_GROUPS.includes(g)) return 'expense';
  return 'other';
};

export interface TaxSettings {
  company_id: string;
  fiscal_period: string;
  taxpayer_type: string | null;
  calculation_rule: string;
  config: any;
  manual_adjustments: number;
  partial_payments: number;
  notes: string | null;
}

export interface TaxEstimate {
  configured: boolean;
  amount: number | null;
  taxableBase: number | null;
  rateLabel: string | null;
}

/**
 * Estimación por empresa/contribuyente (nunca sobre la utilidad consolidada).
 * Reglas soportadas: flat_rate ({ rate }) y brackets ({ brackets: [{ upTo, rate }] }).
 */
export function estimateTax(profit: number, settings?: TaxSettings | null): TaxEstimate {
  if (!settings) return { configured: false, amount: null, taxableBase: null, rateLabel: null };

  const base = profit + Number(settings.manual_adjustments || 0);
  const payments = Number(settings.partial_payments || 0);

  if (base <= 0) {
    return { configured: true, amount: -payments, taxableBase: base, rateLabel: null };
  }

  if (settings.calculation_rule === 'brackets' && Array.isArray(settings.config?.brackets)) {
    let remaining = base;
    let previous = 0;
    let tax = 0;
    for (const b of settings.config.brackets) {
      const upTo = b.upTo == null ? Infinity : Number(b.upTo);
      const slice = Math.max(0, Math.min(base, upTo) - previous);
      tax += slice * Number(b.rate || 0);
      previous = upTo;
      remaining -= slice;
      if (remaining <= 0) break;
    }
    return { configured: true, amount: tax - payments, taxableBase: base, rateLabel: 'Escalonada' };
  }

  const rate = Number(settings.config?.rate ?? 0);
  if (!rate) return { configured: false, amount: null, taxableBase: base, rateLabel: null };

  return {
    configured: true,
    amount: base * rate - payments,
    taxableBase: base,
    rateLabel: `${(rate * 100).toFixed(0)}%`,
  };
}
