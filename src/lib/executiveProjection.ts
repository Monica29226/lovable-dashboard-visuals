/**
 * Motor de proyección y estimación fiscal para la vista ejecutiva.
 * Lógica pura, separada de la visualización. Nada hardcodeado por empresa:
 * los tramos vienen de la configuración persistente (tabla tax_brackets)
 * y los anticipos/retenciones de tax_estimate_settings.
 */

export const MONTHS_ES_SHORT = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Set", "Oct", "Nov", "Dic",
];

export const MONTHS_ES_LONG = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "setiembre", "octubre", "noviembre", "diciembre",
];

const MONTHS_EN = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** ₡240.329.351 — monto completo, sin decimales, negativos entre paréntesis. */
export const formatMoney = (
  value: number | null | undefined,
  symbol = "₡",
  opts: { showSymbol?: boolean } = {},
): string => {
  if (value === null || value === undefined || !isFinite(value)) return "Sin dato";
  const showSymbol = opts.showSymbol !== false;
  const rounded = Math.round(value);
  const grouped = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 })
    .format(Math.abs(rounded))
    .replace(/,/g, ".");
  const withSym = showSymbol && symbol ? `${symbol}${grouped}` : grouped;
  return rounded < 0 ? `(${withSym})` : withSym;
};

/** Porcentajes con un decimal. Recibe la fracción (0.58 -> 58,0 %). */
export const formatPct = (fraction: number | null | undefined): string => {
  if (fraction === null || fraction === undefined || !isFinite(fraction)) return "Sin dato";
  return `${(fraction * 100).toFixed(1)}%`;
};

export const currencySymbol = (currency: string | null | undefined): string => {
  if (currency === "USD") return "$";
  if (currency === "CRC" || !currency) return "₡";
  return "";
};

export interface MonthlySeriesInput {
  label: string;
  income: number | null;
  expenses: number | null;
  net?: number | null;
}

export interface MonthPoint {
  month: number; // 1-12
  label: string;
  income: number;
  expenses: number;
  projected: boolean;
}

export interface YearProjection {
  year: number;
  months: MonthPoint[];
  /** Último mes cerrado con información real (0 = sin datos reales). */
  lastClosedMonth: number;
  lastClosedLabel: string | null;
  realMonths: number;
  remainingMonths: number;
  realIncome: number;
  realExpenses: number;
  realProfit: number;
  projectedIncome: number;
  projectedExpenses: number;
  projectedProfit: number;
  monthlyAverageIncome: number;
  monthlyAverageExpenses: number;
  hasRealData: boolean;
}

const parseMonthIndex = (label: string): number | null => {
  const clean = (label || "").trim().toLowerCase();
  const enIdx = MONTHS_EN.findIndex((m) => clean.startsWith(m));
  if (enIdx >= 0) return enIdx + 1;
  const esIdx = MONTHS_ES_SHORT.findIndex((m) => clean.startsWith(m.toLowerCase()));
  if (esIdx >= 0) return esIdx + 1;
  const parsed = new Date(label);
  if (!isNaN(parsed.getTime())) return parsed.getMonth() + 1;
  return null;
};

/**
 * Proyección dinámica: meses reales hasta el último mes cerrado y el resto
 * del año proyectado con el promedio mensual real (run-rate). Al cerrar un
 * mes nuevo la proyección se recalcula automáticamente.
 */
export function buildYearProjection(
  series: MonthlySeriesInput[],
  year: number,
  today: Date = new Date(),
): YearProjection {
  const byMonth = new Map<number, { income: number; expenses: number; hasData: boolean }>();

  for (const point of series ?? []) {
    const month = parseMonthIndex(point.label);
    if (!month) continue;
    const income = Number(point.income ?? 0);
    const expenses = Number(point.expenses ?? 0);
    byMonth.set(month, {
      income,
      expenses,
      hasData: point.income !== null || point.expenses !== null,
    });
  }

  const isCurrentYear = year === today.getFullYear();
  const calendarLimit = isCurrentYear ? today.getMonth() : 12; // mes actual en curso no se considera cerrado
  const dataLimit = Array.from(byMonth.entries())
    .filter(([, v]) => v.hasData && (v.income !== 0 || v.expenses !== 0))
    .reduce((max, [m]) => Math.max(max, m), 0);

  const lastClosedMonth = Math.max(0, Math.min(calendarLimit, dataLimit || calendarLimit));

  let realIncome = 0;
  let realExpenses = 0;
  for (let m = 1; m <= lastClosedMonth; m++) {
    const v = byMonth.get(m);
    realIncome += v?.income ?? 0;
    realExpenses += v?.expenses ?? 0;
  }

  const realMonths = lastClosedMonth;
  const monthlyAverageIncome = realMonths > 0 ? realIncome / realMonths : 0;
  const monthlyAverageExpenses = realMonths > 0 ? realExpenses / realMonths : 0;
  const remainingMonths = Math.max(0, 12 - lastClosedMonth);

  const months: MonthPoint[] = [];
  for (let m = 1; m <= 12; m++) {
    const real = m <= lastClosedMonth;
    const v = byMonth.get(m);
    months.push({
      month: m,
      label: MONTHS_ES_SHORT[m - 1],
      income: real ? v?.income ?? 0 : monthlyAverageIncome,
      expenses: real ? v?.expenses ?? 0 : monthlyAverageExpenses,
      projected: !real,
    });
  }

  const projectedIncome = realIncome + monthlyAverageIncome * remainingMonths;
  const projectedExpenses = realExpenses + monthlyAverageExpenses * remainingMonths;

  return {
    year,
    months,
    lastClosedMonth,
    lastClosedLabel: lastClosedMonth > 0 ? MONTHS_ES_LONG[lastClosedMonth - 1] : null,
    realMonths,
    remainingMonths,
    realIncome,
    realExpenses,
    realProfit: realIncome - realExpenses,
    projectedIncome,
    projectedExpenses,
    projectedProfit: projectedIncome - projectedExpenses,
    monthlyAverageIncome,
    monthlyAverageExpenses,
    hasRealData: realMonths > 0,
  };
}

// ============ Motor de impuesto por tramos configurables ============

export interface TaxBracket {
  id?: string;
  lower_limit: number;
  upper_limit: number | null;
  rate: number;
}

export function taxFromBrackets(base: number, brackets: TaxBracket[]): number {
  if (base <= 0 || !brackets?.length) return 0;
  const ordered = [...brackets].sort((a, b) => a.lower_limit - b.lower_limit);
  return ordered.reduce((tax, bracket) => {
    const top = bracket.upper_limit == null ? Infinity : Number(bracket.upper_limit);
    const slice = Math.max(0, Math.min(base, top) - Number(bracket.lower_limit));
    return tax + slice * Number(bracket.rate || 0);
  }, 0);
}

export interface FiscalCredits {
  fiscalAdjustments: number;
  advances: number;
  withholdings: number;
  otherCredits: number;
}

export interface FiscalResult {
  configured: boolean;
  projectedProfit: number;
  fiscalAdjustments: number;
  taxableBase: number;
  tax: number;
  advances: number;
  withholdings: number;
  otherCredits: number;
  totalCredits: number;
  pending: number;
  monthlyReserve: number;
  remainingMonths: number;
  effectiveRate: number | null;
}

export function computeFiscal(
  projection: YearProjection,
  brackets: TaxBracket[],
  credits: FiscalCredits,
): FiscalResult {
  const configured = brackets.length > 0;
  const taxableBase = Math.max(0, projection.projectedProfit + credits.fiscalAdjustments);
  const tax = configured ? taxFromBrackets(taxableBase, brackets) : 0;
  const totalCredits = credits.advances + credits.withholdings + credits.otherCredits;
  const pending = tax - totalCredits;
  const remainingMonths = projection.remainingMonths;

  return {
    configured,
    projectedProfit: projection.projectedProfit,
    fiscalAdjustments: credits.fiscalAdjustments,
    taxableBase,
    tax,
    advances: credits.advances,
    withholdings: credits.withholdings,
    otherCredits: credits.otherCredits,
    totalCredits,
    pending,
    monthlyReserve: pending > 0 && remainingMonths > 0 ? pending / remainingMonths : 0,
    remainingMonths,
    effectiveRate: taxableBase > 0 && configured ? tax / taxableBase : null,
  };
}

// ============ Gastos: Top 5 + Otros ============

export interface ExpenseSliceInput {
  name: string;
  amount: number | null;
}

export interface ExpenseSlice {
  name: string;
  amount: number;
  share: number;
}

export function topExpenses(categories: ExpenseSliceInput[], top = 5): ExpenseSlice[] {
  const clean = (categories ?? [])
    .map((c) => ({ name: c.name || "Sin categoría", amount: Math.abs(Number(c.amount ?? 0)) }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const total = clean.reduce((s, c) => s + c.amount, 0);
  if (!total) return [];

  const head = clean.slice(0, top);
  const restAmount = clean.slice(top).reduce((s, c) => s + c.amount, 0);
  const slices = head.map((c) => ({ ...c, share: c.amount / total }));
  if (restAmount > 0) slices.push({ name: "Otros", amount: restAmount, share: restAmount / total });
  return slices;
}

// ============ Conclusiones automáticas ============

export function buildInsights(
  projection: YearProjection,
  fiscal: FiscalResult,
  expenses: ExpenseSlice[],
  symbol: string,
): string[] {
  const out: string[] = [];

  if (projection.realIncome > 0) {
    const expenseShare = projection.realExpenses / projection.realIncome;
    const expensePer100 = Math.round(expenseShare * 100);
    const profitPer100 = 100 - expensePer100;
    out.push(
      `De cada ${symbol}100 facturados, ${symbol}${expensePer100} se destinan a gastos y ${symbol}${profitPer100} quedan como ganancia antes de impuestos.`,
    );
  }

  if (fiscal.configured && fiscal.pending > 0) {
    const reserve = fiscal.monthlyReserve > 0
      ? ` Reservando ${formatMoney(fiscal.monthlyReserve, symbol)} por mes durante los ${fiscal.remainingMonths} meses restantes cubriría ese monto.`
      : "";
    out.push(
      `Considerando anticipos y retenciones ya aplicados, aún debería prever ${formatMoney(fiscal.pending, symbol)} para el impuesto de renta del período.${reserve}`,
    );
  } else if (fiscal.configured && fiscal.pending <= 0) {
    out.push(
      `Con los anticipos y retenciones registrados, el impuesto proyectado quedaría cubierto y resultaría un saldo a favor de ${formatMoney(Math.abs(fiscal.pending), symbol)}.`,
    );
  } else {
    out.push(
      "Los tramos del impuesto para este período y perfil aún están pendientes de configuración, por lo que el impuesto proyectado no se muestra.",
    );
  }

  const first = expenses[0];
  if (first && first.name !== "Otros") {
    out.push(`${first.name} concentra ${formatPct(first.share)} de sus gastos (${formatMoney(first.amount, symbol)}).`);
  }

  return out.slice(0, 3);
}
