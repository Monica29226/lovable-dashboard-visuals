import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { useBudget, BudgetRow } from "@/contexts/BudgetContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, RefreshCw, ChevronDown, ChevronRight, Calendar, BarChart3,
} from "lucide-react";

// ── Constants ────────────────────────────────────────────────────────
const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
] as const;

const MONTH_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const REPORT_YEAR = "2026";

// Normalización compartida (mismo patrón que BudgetSummary2026).
const normalize = (s: string) => s.trim().toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[,.\s]+/g, " ").trim();

// Palabras genéricas que no identifican una cuenta.
const STOPWORDS = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'y', 'o', 'con', 'por', 'para',
  'otros', 'otras', 'no', 'soportado', 'estimado', 'mas', 'a', 'en', 'total',
  'gastos', 'gasto', 'ingreso', 'ingresos',
]);

// Tokens significativos: sin tildes/puntuación, sin códigos numéricos ni stopwords.
const meaningfulTokens = (name: string): string[] =>
  normalize(name)
    .split(' ')
    .map((t) => t.replace(/[%+]/g, ''))
    .filter((t) => t.length >= 3 && !/^\d/.test(t) && !STOPWORDS.has(t));

const formatUSD = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(value);

const lastDayOfMonth = (year: number, month0: number): string => {
  const d = new Date(year, month0 + 1, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

interface QbLeaf { name: string; monthlyValues: number[]; }

type RowKind = 'section' | 'category' | 'total' | 'net';

interface FlatRow {
  name: string;
  kind: RowKind;
  presupuestoAnual: number;
  presupuestoMes: number;
  real: number;
}

// ── Fila plana de la tabla ───────────────────────────────────────────
const ReportRow = ({ row }: { row: FlatRow }) => {
  const rowClass =
    row.kind === 'section'
      ? "bg-muted/50 font-bold border-t-2 border-t-primary"
      : row.kind === 'total'
      ? "font-semibold bg-muted/20"
      : row.kind === 'net'
      ? "bg-primary/15 font-bold text-base border-t-2 border-t-primary"
      : "hover:bg-muted/10";

  const { real, presupuestoMes, presupuestoAnual } = row;
  const variation = real - presupuestoMes;
  const pendiente = presupuestoAnual - real;
  const avance = presupuestoAnual !== 0 ? (real / presupuestoAnual) * 100 : null;

  const num = (v: number) => formatUSD(v);
  const signed = (v: number) => (v < 0 ? `(${formatUSD(Math.abs(v))})` : formatUSD(v));
  const paddingLeft = row.kind === 'category' ? '1.5rem' : undefined;

  return (
    <tr className={rowClass}>
      <td className="border border-border px-4 py-2 whitespace-nowrap" style={{ paddingLeft }}>
        {row.name}
      </td>
      <td className="border border-border px-4 py-2 text-right whitespace-nowrap min-w-[120px]">
        {num(presupuestoAnual)}
      </td>
      <td className="border border-border px-4 py-2 text-right whitespace-nowrap min-w-[120px]">
        {num(presupuestoMes)}
      </td>
      <td className="border border-border px-4 py-2 text-right whitespace-nowrap min-w-[140px] bg-muted/10">
        <span className="font-medium">{num(real)}</span>
      </td>
      <td className={`border border-border px-4 py-2 text-right whitespace-nowrap min-w-[120px] ${variation < 0 ? 'text-red-600' : 'text-green-700'}`}>
        {signed(variation)}
      </td>
      <td className="border border-border px-4 py-2 text-right whitespace-nowrap min-w-[120px] text-muted-foreground">
        {signed(pendiente)}
      </td>
      <td className="border border-border px-4 py-2 text-right whitespace-nowrap min-w-[90px]">
        {avance === null ? '—' : `${avance.toFixed(1)}%`}
      </td>
    </tr>
  );
};

export function BudgetExecutionReport() {
  const { language } = useLanguage();
  const { selectedCompanyId } = useCompany();
  const { budgetData } = useBudget();

  const [incomeData, setIncomeData] = useState<any>(null);
  const [loadingIncome, setLoadingIncome] = useState(false);
  const [rateMap, setRateMap] = useState<Record<string, number>>({});
  const [invoices, setInvoices] = useState<{ total_amount: number; currency: string | null; txn_date: string | null }[]>([]);
  const [cutoff, setCutoff] = useState<number>(() => new Date().getMonth());

  // ── Fetch ──────────────────────────────────────────────────────────
  const fetchRates = async () => {
    const { data, error } = await supabase.from('exchange_rates').select('rate_date, sell_rate');
    if (error) { console.error('Error loading exchange rates:', error); return; }
    const map: Record<string, number> = {};
    (data || []).forEach((r: any) => { map[r.rate_date] = Number(r.sell_rate); });
    setRateMap(map);
  };

  const fetchInvoices = async () => {
    if (!selectedCompanyId) { setInvoices([]); return; }
    const { data, error } = await supabase
      .from('quickbooks_invoices')
      .select('total_amount, currency, txn_date')
      .eq('company_id', selectedCompanyId);
    if (error) { console.error('Error loading invoices:', error); setInvoices([]); return; }
    setInvoices((data || []).map((r: any) => ({
      total_amount: Number(r.total_amount) || 0,
      currency: r.currency ?? null,
      txn_date: r.txn_date ?? null,
    })));
  };

  const fetchIncome = async () => {
    if (!selectedCompanyId) return;
    try {
      setLoadingIncome(true);
      const { data, error } = await supabase.functions.invoke('quickbooks-income', {
        body: { companyId: selectedCompanyId, year: REPORT_YEAR },
      });
      if (error) throw error;
      setIncomeData(data);
    } catch (err) {
      console.error('Error fetching income:', err);
    } finally {
      setLoadingIncome(false);
    }
  };

  useEffect(() => { fetchRates(); }, []);
  useEffect(() => {
    if (selectedCompanyId) { fetchIncome(); fetchInvoices(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId]);

  // ── Alineación de meses de QuickBooks al calendario ────────────────
  const monthRateDates = useMemo<string[]>(() => {
    if (!incomeData?.months?.length) return [];
    const start = incomeData?.startDate ? new Date(incomeData.startDate) : null;
    const baseYear = start ? start.getFullYear() : parseInt(REPORT_YEAR);
    const baseMonth = start ? start.getMonth() : 0;
    return incomeData.months.map((_: string, idx: number) => {
      const d = new Date(baseYear, baseMonth + idx, 1);
      return lastDayOfMonth(d.getFullYear(), d.getMonth());
    });
  }, [incomeData]);

  const monthKeys = useMemo<string[]>(() => {
    if (!incomeData?.months?.length) return [];
    const start = incomeData?.startDate ? new Date(incomeData.startDate) : null;
    const baseYear = start ? start.getFullYear() : parseInt(REPORT_YEAR);
    const baseMonth = start ? start.getMonth() : 0;
    return incomeData.months.map((_: string, idx: number) => {
      const d = new Date(baseYear, baseMonth + idx, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
  }, [incomeData]);

  const qbCalMonths = useMemo<number[]>(
    () => monthKeys.map((k) => parseInt(k.split('-')[1], 10) - 1),
    [monthKeys]
  );

  const usdRates = useMemo<(number | null)[]>(
    () => monthRateDates.map((rd) => (rd in rateMap ? rateMap[rd] : null)),
    [monthRateDates, rateMap]
  );

  // Hojas (cuentas) de QuickBooks aplanadas.
  const qbLeaves = useMemo<QbLeaf[]>(() => {
    const leaves: QbLeaf[] = [];
    const walk = (nodes: any[]) => {
      nodes.forEach((n) => {
        if (n.children && n.children.length) walk(n.children);
        else if (n.type === 'Data') leaves.push({ name: n.name, monthlyValues: n.monthlyValues || [] });
      });
    };
    walk(incomeData?.sections || []);
    return leaves;
  }, [incomeData]);

  // Ingreso mensual PRECISO por factura (NIIF/IAS 21), en USD por índice de mes QB.
  const incomeValuesUSD = useMemo<number[]>(() => {
    const crcMonthly: number[] = incomeData?.totalIncome?.monthlyValues || [];
    return monthKeys.map((key, idx) => {
      const rate = usdRates[idx] ?? null;
      const monthInv = invoices.filter((i) => i.txn_date && i.txn_date.startsWith(key));
      if (monthInv.length === 0) return rate ? (crcMonthly[idx] || 0) / rate : 0;
      let usd = 0, crc = 0;
      monthInv.forEach((i) => { if (i.currency === 'USD') usd += i.total_amount; else crc += i.total_amount; });
      return usd + (crc > 0 && rate ? crc / rate : 0);
    });
  }, [incomeData, invoices, monthKeys, usdRates]);

  // Ingreso real acumulado (preciso) hasta el mes de corte.
  const incomePreciseCumulative = useMemo<number>(() => {
    return incomeValuesUSD.reduce((sum, v, idx) =>
      qbCalMonths[idx] <= cutoff ? sum + v : sum, 0);
  }, [incomeValuesUSD, qbCalMonths, cutoff]);

  // Suma acumulada USD de las cuentas de QB que empatan con la categoría.
  // Empareja por nombre normalizado contenido (o viceversa) y, como respaldo,
  // por coincidencia de tokens significativos (ignorando códigos de cuenta,
  // porcentajes y palabras genéricas).
  const matchReal = (budgetName: string): number | null => {
    const nb = normalize(budgetName);
    if (!nb) return null;
    const bTokens = new Set(meaningfulTokens(budgetName));
    const matched = qbLeaves.filter((l) => {
      const nl = normalize(l.name);
      if (!nl) return false;
      if (nl === nb || nl.includes(nb) || nb.includes(nl)) return true;
      if (bTokens.size === 0) return false;
      return meaningfulTokens(l.name).some((t) => bTokens.has(t));
    });
    if (matched.length === 0) return null;
    let usd = 0;
    matched.forEach((l) => {
      l.monthlyValues.forEach((val, idx) => {
        if (qbCalMonths[idx] === undefined || qbCalMonths[idx] > cutoff) return;
        const rate = usdRates[idx] ?? null;
        if (rate) usd += (val || 0) / rate;
      });
    });
    return usd;
  };

  // ── Construcción de la tabla plana ─────────────────────────────────
  const cumBudget = (row: BudgetRow): number =>
    MONTHS.reduce((sum, m, idx) => idx <= cutoff ? sum + (Number((row as any)[m]) || 0) : sum, 0);

  const isIncomeRoot = (row: BudgetRow) =>
    row.level === 0 && (row.category.includes('INGRESO') || row.category === 'INCOME');

  // Suma recursiva del real emparejado en QuickBooks (parcial; sin match = 0).
  const sumRealRecursive = (row: BudgetRow): number => {
    const kids = budgetData.filter(
      (r) => r.parent_category === row.category && r.level === row.level + 1
    );
    if (kids.length === 0) return matchReal(row.category) ?? 0;
    return kids.reduce((sum, k) => sum + sumRealRecursive(k), 0);
  };

  const { flatRows, incomeReal, expenseReal, incomeMes, expenseMes, incomeAnual, expenseAnual } = useMemo(() => {
    const rows: FlatRow[] = [];
    let incReal = 0, expReal = 0, incMes = 0, expMes = 0, incAnual = 0, expAnual = 0;

    const roots = budgetData.filter((r) => r.level === 0);
    roots.sort((a, b) => (isIncomeRoot(a) ? -1 : isIncomeRoot(b) ? 1 : 0));

    roots.forEach((root) => {
      const isIncome = isIncomeRoot(root);
      const level1 = budgetData.filter(
        (r) => r.parent_category === root.category && r.level === 1
      );
      const sectionAnual = root.total || 0;
      const sectionMes = cumBudget(root);
      const sectionReal = isIncome
        ? incomePreciseCumulative
        : level1.reduce((s, c) => s + sumRealRecursive(c), 0);

      if (isIncome) {
        incReal = sectionReal; incMes = sectionMes; incAnual = sectionAnual;
      } else {
        expReal = sectionReal; expMes = sectionMes; expAnual = sectionAnual;
      }

      // Encabezado de sección.
      rows.push({
        name: root.category,
        kind: 'section',
        presupuestoAnual: sectionAnual,
        presupuestoMes: sectionMes,
        real: sectionReal,
      });

      // Categorías de nivel 1.
      level1.forEach((c) => {
        rows.push({
          name: c.category,
          kind: 'category',
          presupuestoAnual: c.total || 0,
          presupuestoMes: cumBudget(c),
          real: sumRealRecursive(c),
        });
      });

      // Fila de total.
      rows.push({
        name: isIncome ? 'Total ingresos' : 'Total egresos',
        kind: 'total',
        presupuestoAnual: sectionAnual,
        presupuestoMes: sectionMes,
        real: sectionReal,
      });
    });

    return {
      flatRows: rows,
      incomeReal: incReal, expenseReal: expReal,
      incomeMes: incMes, expenseMes: expMes,
      incomeAnual: incAnual, expenseAnual: expAnual,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgetData, qbLeaves, incomePreciseCumulative, usdRates, qbCalMonths, cutoff]);



  const netReal = incomeReal - expenseReal;
  const netMes = incomeMes - expenseMes;
  const netAnual = incomeAnual - expenseAnual;
  const netVariation = netReal - netMes;
  const netPendiente = netAnual - netReal;

  const monthLabel = MONTH_LABELS[cutoff];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div className="flex gap-2 items-center">
          <Select value={String(cutoff)} onValueChange={(v) => setCutoff(parseInt(v, 10))}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Mes de corte" />
            </SelectTrigger>
            <SelectContent>
              {MONTH_LABELS.map((m, idx) => (
                <SelectItem key={idx} value={String(idx)}>{m} {REPORT_YEAR}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => { fetchIncome(); fetchInvoices(); fetchRates(); }} disabled={loadingIncome} variant="outline">
          {loadingIncome && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <RefreshCw className="mr-2 h-4 w-4" />
          {language === 'es' ? 'Actualizar' : 'Update'}
        </Button>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Ingresos</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{formatUSD(incomeReal)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Presupuesto a {monthLabel}: {formatUSD(incomeMes)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Gastos</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{formatUSD(expenseReal)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Presupuesto a {monthLabel}: {formatUSD(expenseMes)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Ingresos menos Egresos</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${netReal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatUSD(netReal)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Presupuesto a {monthLabel}: {formatUSD(netMes)}
            </p>
          </CardContent>
        </Card>
      </div>

      {incomeData ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                PRESUPUESTO VS. REAL - {REPORT_YEAR}
              </span>
              <Badge variant="secondary">USD</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-primary/10">
                    <th className="border border-border px-4 py-3 text-left font-bold sticky left-0 bg-primary/10 z-10">Cuenta</th>
                    <th className="border border-border px-4 py-3 text-right font-bold whitespace-nowrap">Presupuesto Total Anual</th>
                    <th className="border border-border px-4 py-3 text-right font-bold whitespace-nowrap">Presupuesto {monthLabel}</th>
                    <th className="border border-border px-4 py-3 text-right font-bold whitespace-nowrap bg-primary/20">Acumulado {monthLabel}</th>
                    <th className="border border-border px-4 py-3 text-right font-bold whitespace-nowrap">Variación</th>
                    <th className="border border-border px-4 py-3 text-right font-bold whitespace-nowrap">Pendiente Ejecución</th>
                    <th className="border border-border px-4 py-3 text-right font-bold whitespace-nowrap">% Avance</th>
                  </tr>
                </thead>
                <tbody>
                  {tree.map((node, idx) => (
                    <ReportRow key={idx} node={node} />
                  ))}
                  {/* Ingresos menos Egresos */}
                  <tr className="bg-primary/15 font-bold text-base border-t-2 border-t-primary">
                    <td className="border border-border px-4 py-3">Ingresos menos Egresos</td>
                    <td className="border border-border px-4 py-3 text-right">{formatUSD(netAnual)}</td>
                    <td className="border border-border px-4 py-3 text-right">{formatUSD(netMes)}</td>
                    <td className="border border-border px-4 py-3 text-right bg-muted/10">{formatUSD(netReal)}</td>
                    <td className={`border border-border px-4 py-3 text-right ${netVariation < 0 ? 'text-red-600' : 'text-green-700'}`}>
                      {netVariation < 0 ? `(${formatUSD(Math.abs(netVariation))})` : formatUSD(netVariation)}
                    </td>
                    <td className="border border-border px-4 py-3 text-right text-muted-foreground">
                      {netPendiente < 0 ? `(${formatUSD(Math.abs(netPendiente))})` : formatUSD(netPendiente)}
                    </td>
                    <td className="border border-border px-4 py-3 text-right">
                      {netAnual !== 0 ? `${((netReal / netAnual) * 100).toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {missingCount > 0 && (
              <p className="text-xs text-amber-600 mt-3">
                {missingCount} categoría(s) de presupuesto no encontraron cuenta de QuickBooks emparejada
                (marcadas como "Sin dato — revisar mapeo").
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            {loadingIncome ? (
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-4" />
            ) : (
              <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
            )}
            <p className="text-lg text-muted-foreground">
              {language === 'es' ? 'No hay datos disponibles' : 'No data available'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default BudgetExecutionReport;
