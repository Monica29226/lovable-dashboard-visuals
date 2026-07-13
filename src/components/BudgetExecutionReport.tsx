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

interface ReportNode {
  name: string;
  level: number;
  isSection: boolean;
  presupuestoAnual: number;
  presupuestoMes: number;
  real: number | null; // null = sin dato (mapeo faltante)
  children: ReportNode[];
}

// ── Fila de la tabla (colapsable) ────────────────────────────────────
const ReportRow = ({ node, level = 0 }: { node: ReportNode; level?: number }) => {
  const [isOpen, setIsOpen] = useState(level < 2);
  const hasChildren = node.children.length > 0;
  const paddingLeft = `${level * 1.5}rem`;

  const rowClass = node.level === 0
    ? "bg-muted/50 font-bold border-t-2 border-t-primary"
    : node.isSection
    ? "font-semibold bg-muted/20"
    : "hover:bg-muted/10";

  const real = node.real;
  const variation = real !== null ? real - node.presupuestoMes : null;
  const pendiente = real !== null ? node.presupuestoAnual - real : null;
  const avance = real !== null && node.presupuestoAnual !== 0
    ? (real / node.presupuestoAnual) * 100
    : null;

  const num = (v: number) => formatUSD(v);
  const signed = (v: number | null) =>
    v === null ? '—' : v < 0 ? `(${formatUSD(Math.abs(v))})` : formatUSD(v);

  return (
    <>
      <tr className={rowClass}>
        <td className="border border-border px-4 py-2 whitespace-nowrap" style={{ paddingLeft }}>
          {hasChildren ? (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 hover:text-primary w-full text-left transition-colors"
            >
              {isOpen ? <ChevronDown className="h-4 w-4 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 flex-shrink-0" />}
              <span>{node.name}</span>
            </button>
          ) : (
            <span>{node.name}</span>
          )}
        </td>
        <td className="border border-border px-4 py-2 text-right whitespace-nowrap min-w-[120px]">
          {num(node.presupuestoAnual)}
        </td>
        <td className="border border-border px-4 py-2 text-right whitespace-nowrap min-w-[120px]">
          {num(node.presupuestoMes)}
        </td>
        <td className="border border-border px-4 py-2 text-right whitespace-nowrap min-w-[140px] bg-muted/10">
          {real === null ? (
            <span className="text-amber-600 text-xs">Sin dato — revisar mapeo</span>
          ) : (
            <span className="font-medium">{num(real)}</span>
          )}
        </td>
        <td className={`border border-border px-4 py-2 text-right whitespace-nowrap min-w-[120px] ${variation !== null && variation < 0 ? 'text-red-600' : 'text-green-700'}`}>
          {signed(variation)}
        </td>
        <td className="border border-border px-4 py-2 text-right whitespace-nowrap min-w-[120px] text-muted-foreground">
          {signed(pendiente)}
        </td>
        <td className="border border-border px-4 py-2 text-right whitespace-nowrap min-w-[90px]">
          {avance === null ? '—' : `${avance.toFixed(1)}%`}
        </td>
      </tr>
      {hasChildren && isOpen && node.children.map((child, idx) => (
        <ReportRow key={idx} node={child} level={level + 1} />
      ))}
    </>
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
  const matchReal = (budgetName: string): number | null => {
    const nb = normalize(budgetName);
    if (!nb) return null;
    const matched = qbLeaves.filter((l) => {
      const nl = normalize(l.name);
      if (!nl) return false;
      return nl === nb || nl.includes(nb) || nb.includes(nl);
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

  // ── Construcción del árbol del reporte ─────────────────────────────
  const cumBudget = (row: BudgetRow): number =>
    MONTHS.reduce((sum, m, idx) => idx <= cutoff ? sum + (Number((row as any)[m]) || 0) : sum, 0);

  const isIncomeRoot = (row: BudgetRow) =>
    row.level === 0 && (row.category.includes('INGRESO') || row.category === 'INCOME');

  const { tree, missingCount } = useMemo(() => {
    let missing = 0;

    const build = (row: BudgetRow): ReportNode => {
      const kids = budgetData.filter(
        (r) => r.parent_category === row.category && r.level === row.level + 1
      );
      const children = kids.map(build);

      let real: number | null;
      if (isIncomeRoot(row)) {
        real = incomePreciseCumulative;
      } else if (children.length > 0) {
        const nn = children.map((c) => c.real).filter((v): v is number => v !== null);
        real = nn.length > 0 ? nn.reduce((a, b) => a + b, 0) : (row.level === 0 ? 0 : null);
      } else {
        real = matchReal(row.category);
        if (real === null) missing += 1;
      }

      return {
        name: row.category,
        level: row.level,
        isSection: row.level <= 1,
        presupuestoAnual: row.total || 0,
        presupuestoMes: cumBudget(row),
        real,
        children,
      };
    };

    const roots = budgetData.filter((r) => r.level === 0);
    roots.sort((a, b) => (isIncomeRoot(a) ? -1 : isIncomeRoot(b) ? 1 : 0));
    const tree = roots.map(build);
    return { tree, missingCount: missing };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgetData, qbLeaves, incomePreciseCumulative, usdRates, qbCalMonths, cutoff]);

  useEffect(() => {
    if (budgetData.length && qbLeaves.length) {
      console.log(`[Presupuesto vs Real] Categorías hoja sin cuenta de QB emparejada: ${missingCount}`);
    }
  }, [missingCount, budgetData.length, qbLeaves.length]);

  const incomeNode = tree.find((n) => n.name.includes('INGRESO'));
  const expenseNode = tree.find((n) => n.name.includes('EGRESO'));

  const netReal = (incomeNode?.real ?? 0) - (expenseNode?.real ?? 0);
  const netMes = (incomeNode?.presupuestoMes ?? 0) - (expenseNode?.presupuestoMes ?? 0);
  const netAnual = (incomeNode?.presupuestoAnual ?? 0) - (expenseNode?.presupuestoAnual ?? 0);
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
            <p className="text-3xl font-bold text-green-600">{formatUSD(incomeNode?.real ?? 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Presupuesto a {monthLabel}: {formatUSD(incomeNode?.presupuestoMes ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Gastos</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{formatUSD(expenseNode?.real ?? 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Presupuesto a {monthLabel}: {formatUSD(expenseNode?.presupuestoMes ?? 0)}
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
