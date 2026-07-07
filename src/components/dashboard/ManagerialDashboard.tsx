import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  CalendarIcon, TrendingUp, TrendingDown, Wallet, Coins, Percent,
  Receipt, Landmark, AlertTriangle, CheckCircle2, WifiOff, Info, ArrowDownUp,
} from "lucide-react";
import {
  ComposedChart, Bar, Line, BarChart, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";

// ============ Types ============
interface ExpenseCategory { name: string; amount: number | null; pct: number | null; }
interface MonthlyPoint { label: string; income: number | null; expenses: number | null; net: number | null; }
interface DashboardData {
  currency: string | null;
  period: { startDate: string; endDate: string };
  generatedAt: string;
  connection: string;
  pnl: {
    status: string; income: number | null; expenses: number | null; netIncome: number | null;
    netIncomeCheck: boolean | null; margin: number | null; expenseCategories: ExpenseCategory[];
  };
  monthly: { status: string; series: MonthlyPoint[] };
  balance: {
    status: string; assets: number | null; liabilities: number | null; equity: number | null;
    equitySource: string | null; reconciles: boolean | null;
  };
  receivables: {
    status: string; total: number | null; pctOverdue: number | null; pctOver60: number | null;
    buckets?: { d0_30: number | null; d31_60: number | null; d61_90: number | null; d90p: number | null };
    rows?: ReceivableRow[];
  };
  cash: { status: string; available: number | null };
  cashflow: {
    status: string; netChange: number | null;
    operating: number | null; investing: number | null; financing: number | null;
  };
  error?: string;
}

interface ReceivableRow {
  customer: string;
  amount: number | null;
  daysOverdue: number | null;
  dueDate: string | null;
  status: string;
}

interface Props {
  companyId: string;
  companyName: string;
  isConnected: boolean;
}

// ============ Date helpers ============
type PresetKey =
  | "mes-actual" | "mes-anterior" | "ult-3" | "ult-6" | "ult-12"
  | "anio-actual" | "anio-anterior" | "personalizado";

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "mes-actual", label: "Mes actual" },
  { key: "mes-anterior", label: "Mes anterior" },
  { key: "ult-3", label: "Últimos 3 meses" },
  { key: "ult-6", label: "Últimos 6 meses" },
  { key: "ult-12", label: "Últimos 12 meses" },
  { key: "anio-actual", label: "Año actual" },
  { key: "anio-anterior", label: "Año anterior" },
  { key: "personalizado", label: "Rango personalizado" },
];

const toISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const fmtDMY = (iso: string) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const dayDiff = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

interface Period { startDate: string; endDate: string; }

function computePeriods(
  preset: PresetKey,
  custom: { from?: Date; to?: Date }
): { current: Period | null; comparison: Period | null } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  const monthStart = (yr: number, mo: number) => new Date(yr, mo, 1);
  const monthEnd = (yr: number, mo: number) => new Date(yr, mo + 1, 0);

  const build = (s: Date, e: Date): Period => ({ startDate: toISO(s), endDate: toISO(e) });

  switch (preset) {
    case "mes-actual": {
      return {
        current: build(monthStart(y, m), monthEnd(y, m)),
        comparison: build(monthStart(y, m - 1), monthEnd(y, m - 1)),
      };
    }
    case "mes-anterior": {
      return {
        current: build(monthStart(y, m - 1), monthEnd(y, m - 1)),
        comparison: build(monthStart(y, m - 2), monthEnd(y, m - 2)),
      };
    }
    case "ult-3":
    case "ult-6":
    case "ult-12": {
      const n = preset === "ult-3" ? 3 : preset === "ult-6" ? 6 : 12;
      const curStart = monthStart(y, m - (n - 1));
      const curEnd = monthEnd(y, m);
      const cmpStart = monthStart(y, m - (2 * n - 1));
      const cmpEnd = monthEnd(y, m - n);
      return { current: build(curStart, curEnd), comparison: build(cmpStart, cmpEnd) };
    }
    case "anio-actual": {
      return {
        current: build(new Date(y, 0, 1), new Date(y, 11, 31)),
        comparison: build(new Date(y - 1, 0, 1), new Date(y - 1, 11, 31)),
      };
    }
    case "anio-anterior": {
      return {
        current: build(new Date(y - 1, 0, 1), new Date(y - 1, 11, 31)),
        comparison: build(new Date(y - 2, 0, 1), new Date(y - 2, 11, 31)),
      };
    }
    case "personalizado": {
      if (!custom.from || !custom.to) return { current: null, comparison: null };
      const from = custom.from;
      const to = custom.to;
      const cur = build(from, to);
      const days = dayDiff(cur.startDate, cur.endDate);
      const cmpEnd = new Date(from.getTime() - 86400000);
      const cmpStart = new Date(cmpEnd.getTime() - days * 86400000);
      return { current: cur, comparison: build(cmpStart, cmpEnd) };
    }
    default:
      return { current: null, comparison: null };
  }
}

// ============ Currency formatting ============
function symbolFor(currency: string | null): string {
  if (currency === "CRC") return "₡";
  if (currency === "USD") return "$";
  return "";
}

function makeFormatter(currency: string | null) {
  const sym = symbolFor(currency);
  const full = (v: number | null | undefined) => {
    if (v === null || v === undefined || !isFinite(v)) return "Dato no disponible";
    const formatted = new Intl.NumberFormat("es-CR", {
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(Math.abs(v));
    const withSym = sym ? `${sym}${formatted}` : formatted;
    return v < 0 ? `(${withSym})` : withSym;
  };
  const compact = (v: number | null | undefined) => {
    if (v === null || v === undefined || !isFinite(v)) return "";
    const abs = Math.abs(v);
    let out: string;
    if (abs >= 1_000_000) out = `${(v / 1_000_000).toFixed(1)}M`;
    else if (abs >= 1_000) out = `${(v / 1_000).toFixed(0)}K`;
    else out = `${v.toFixed(0)}`;
    return sym ? `${sym}${out}` : out;
  };
  return { full, compact, sym };
}

const fmtPct = (v: number | null | undefined) => {
  if (v === null || v === undefined || !isFinite(v)) return "Dato no disponible";
  return `${(v * 100).toFixed(1)}%`;
};

// ============ Data hook ============
function useDashboardData(companyId: string, period: Period | null, enabled: boolean) {
  return useQuery({
    queryKey: ["qb-dashboard-data", companyId, period?.startDate, period?.endDate],
    enabled: enabled && !!companyId && !!period,
    queryFn: async (): Promise<DashboardData> => {
      const { data, error } = await supabase.functions.invoke("quickbooks-dashboard-data", {
        body: { companyId, startDate: period!.startDate, endDate: period!.endDate },
      });
      if (error) throw error;
      if (data?.error) throw new Error(typeof data.error === "string" ? data.error : "error");
      return data as DashboardData;
    },
    staleTime: 60_000,
  });
}

// ============ Variation helpers ============
function variation(current: number | null | undefined, prev: number | null | undefined) {
  if (current === null || current === undefined || prev === null || prev === undefined) {
    return { abs: null as number | null, pct: null as number | null };
  }
  const abs = current - prev;
  const pct = prev !== 0 ? abs / Math.abs(prev) : null;
  return { abs, pct };
}

// ============ KPI Card ============
interface KpiProps {
  title: string;
  icon: React.ReactNode;
  available: boolean;
  value: string;
  varAbs: number | null;
  varPct: number | null;
  fmtFull: (v: number | null) => string;
  note?: string;
  higherIsBetter?: boolean;
}

const KpiCard = ({ title, icon, available, value, varAbs, varPct, fmtFull, note, higherIsBetter = true }: KpiProps) => {
  const hasVar = varAbs !== null && isFinite(varAbs);
  const positive = hasVar ? (higherIsBetter ? varAbs! >= 0 : varAbs! <= 0) : true;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <span className="text-[hsl(var(--co))]">{icon}</span> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {available ? (
          <>
            <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
            {note ? (
              <p className="text-xs text-muted-foreground mt-1">{note}</p>
            ) : hasVar ? (
              <p className={cn("text-xs mt-1 flex items-center gap-1 font-medium",
                positive ? "text-[hsl(var(--green))]" : "text-[hsl(var(--red))]")}>
                {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {fmtFull(Math.abs(varAbs!))}
                {varPct !== null && isFinite(varPct) ? ` (${(varPct * 100).toFixed(1)}%)` : ""}
                <span className="text-muted-foreground font-normal">vs. comparación</span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">Sin dato de comparación</p>
            )}
          </>
        ) : (
          <p className="text-lg font-semibold text-muted-foreground">{note || "Dato no disponible"}</p>
        )}
      </CardContent>
    </Card>
  );
};

// ============ Main component ============
export const ManagerialDashboard = ({ companyId, companyName, isConnected }: Props) => {
  const [preset, setPreset] = useState<PresetKey>("anio-actual");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [applied, setApplied] = useState<{ preset: PresetKey; from?: Date; to?: Date }>({ preset: "anio-actual" });

  const { current, comparison } = useMemo(
    () => computePeriods(applied.preset, { from: applied.from, to: applied.to }),
    [applied]
  );

  const enabled = isConnected && !!companyId;
  const currentQ = useDashboardData(companyId, current, enabled);
  const comparisonQ = useDashboardData(companyId, comparison, enabled);

  const data = currentQ.data;
  const prev = comparisonQ.data;
  const fmt = makeFormatter(data?.currency ?? null);

  const apply = () => setApplied({ preset, from: customFrom, to: customTo });
  const clear = () => {
    setPreset("anio-actual");
    setCustomFrom(undefined);
    setCustomTo(undefined);
    setApplied({ preset: "anio-actual" });
  };

  // ---------- Guard states ----------
  if (!companyId) {
    return <StatePage title="Selecciona una empresa" msg="No hay ninguna empresa seleccionada." />;
  }

  const filterBar = (
    <FilterBar
      preset={preset} setPreset={setPreset}
      customFrom={customFrom} setCustomFrom={setCustomFrom}
      customTo={customTo} setCustomTo={setCustomTo}
      onApply={apply} onClear={clear}
    />
  );

  if (!isConnected) {
    return (
      <Shell companyName={companyName} filterBar={filterBar}>
        <StateCard msg="Empresa sin conexión activa a QuickBooks Online." />
      </Shell>
    );
  }

  const loading = currentQ.isLoading || comparisonQ.isLoading;
  const errObj = currentQ.error as Error | null;

  if (errObj) {
    const raw = (errObj.message || "").toLowerCase();
    const needsAuth = raw.includes("authorization") || raw.includes("autoriz") || raw.includes("token");
    return (
      <Shell companyName={companyName} filterBar={filterBar}>
        <StateCard msg={needsAuth
          ? "La conexión con QuickBooks requiere autorización."
          : "No se pudo conectar con QuickBooks Online."} error />
      </Shell>
    );
  }

  if (data && data.connection !== "connected") {
    return (
      <Shell companyName={companyName} filterBar={filterBar}>
        <StateCard msg="No se pudo conectar con QuickBooks Online." error />
      </Shell>
    );
  }

  // ---------- KPI values ----------
  const pnl = data?.pnl;
  const bal = data?.balance;
  const rec = data?.receivables;
  const cash = data?.cash;
  const pPnl = prev?.pnl;
  const pRec = prev?.receivables;
  const pCash = prev?.cash;

  const okP = pnl?.status === "ok";
  const okPrev = pPnl?.status === "ok";

  const incomeVar = variation(okP ? pnl?.income : null, okPrev ? pPnl?.income : null);
  const expenseVar = variation(okP ? pnl?.expenses : null, okPrev ? pPnl?.expenses : null);
  const netVar = variation(okP ? pnl?.netIncome : null, okPrev ? pPnl?.netIncome : null);
  const marginVar = variation(okP ? pnl?.margin : null, okPrev ? pPnl?.margin : null);
  const recVar = variation(
    rec?.status === "ok" ? rec?.total : null,
    pRec?.status === "ok" ? pRec?.total : null
  );
  const cashVar = variation(
    cash?.status === "ok" ? cash?.available : null,
    pCash?.status === "ok" ? pCash?.available : null
  );

  const allUnavailable = data &&
    pnl?.status !== "ok" && data.monthly?.status !== "ok" &&
    bal?.status !== "ok" && rec?.status !== "ok" && cash?.status !== "ok";

  const marginZero = okP && (pnl?.income === 0 || pnl?.income === null);

  return (
    <Shell
      companyName={companyName}
      filterBar={filterBar}
      currency={data?.currency}
      period={data?.period}
      generatedAt={data?.generatedAt}
      connectionChip={<ConnectionChip data={data} error={!!errObj} />}
    >
      {loading ? (
        <LoadingSkeletons />
      ) : allUnavailable ? (
        <StateCard msg="No hay información disponible para el periodo seleccionado." />
      ) : (
        <div className="space-y-6">
          {/* KPI CARDS */}
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Indicadores clave</h2>
              <VerOrigen
                report="Profit & Loss · Balance Sheet · Aged Receivables"
                period={data?.period} company={companyName} currency={data?.currency}
                formula="Margen neto = Utilidad neta ÷ Ingresos"
                quality={okP ? "confirmado" : "no_disponible"}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <KpiCard title="Ingresos del periodo" icon={<TrendingUp className="h-4 w-4" />}
                available={okP && pnl?.income !== null} value={fmt.full(pnl?.income ?? null)}
                varAbs={incomeVar.abs} varPct={incomeVar.pct} fmtFull={fmt.full} />
              <KpiCard title="Gastos del periodo" icon={<TrendingDown className="h-4 w-4" />}
                available={okP && pnl?.expenses !== null} value={fmt.full(pnl?.expenses ?? null)}
                varAbs={expenseVar.abs} varPct={expenseVar.pct} fmtFull={fmt.full} higherIsBetter={false} />
              <KpiCard title="Utilidad neta" icon={<Wallet className="h-4 w-4" />}
                available={okP && pnl?.netIncome !== null} value={fmt.full(pnl?.netIncome ?? null)}
                varAbs={netVar.abs} varPct={netVar.pct} fmtFull={fmt.full} />
              <KpiCard title="Margen neto" icon={<Percent className="h-4 w-4" />}
                available={okP && !marginZero && pnl?.margin !== null}
                value={fmtPct(pnl?.margin ?? null)}
                varAbs={marginVar.abs} varPct={null} fmtFull={(v) => fmtPct(v)}
                note={marginZero ? "No calculable por ingresos en cero" : undefined} />
              <KpiCard title="Cuentas por cobrar" icon={<Receipt className="h-4 w-4" />}
                available={rec?.status === "ok" && rec?.total !== null} value={fmt.full(rec?.total ?? null)}
                varAbs={recVar.abs} varPct={recVar.pct} fmtFull={fmt.full} higherIsBetter={false} />
              <KpiCard title="Efectivo disponible" icon={<Coins className="h-4 w-4" />}
                available={cash?.status === "ok" && cash?.available !== null} value={fmt.full(cash?.available ?? null)}
                varAbs={cashVar.abs} varPct={cashVar.pct} fmtFull={fmt.full} />
            </div>
          </div>

          {/* MONTHLY CHART */}
          <MonthlyChart data={data!} prev={prev} fmt={fmt} companyName={companyName} />

          {/* EXPENSE CATEGORIES */}
          <ExpenseCategoriesChart pnl={pnl!} fmt={fmt} period={data?.period} currency={data?.currency} companyName={companyName} />

          {/* RECEIVABLES AGING */}
          <ReceivablesSection rec={rec} fmt={fmt} period={data?.period} currency={data?.currency} companyName={companyName} />

          {/* CASH FLOW */}
          <CashFlowSection cashflow={data?.cashflow} fmt={fmt} period={data?.period} currency={data?.currency} companyName={companyName} />

          {/* ACCOUNTING VALIDATION */}
          <AccountingValidationSection bal={bal} pnl={pnl} period={data?.period} currency={data?.currency} companyName={companyName} fmt={fmt} />
        </div>
      )}
    </Shell>
  );
};

// ============ Shell / header ============
const Shell = ({
  companyName, filterBar, children, currency, period, generatedAt, connectionChip,
}: {
  companyName: string;
  filterBar: React.ReactNode;
  children: React.ReactNode;
  currency?: string | null;
  period?: { startDate: string; endDate: string };
  generatedAt?: string;
  connectionChip?: React.ReactNode;
}) => (
  <div className="min-h-screen bg-background">
    <div className="w-full bg-ink py-8 mb-6">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl md:text-4xl text-paper">Panel Financiero Gerencial</h1>
            <p className="text-paper/80 mt-1 text-lg">{companyName}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-paper/70">
              {period && (
                <span>Periodo: {fmtDMY(period.startDate)} al {fmtDMY(period.endDate)}</span>
              )}
              {currency !== undefined && (
                <span>Moneda: {currency || "sin especificar"}</span>
              )}
              <span>Fuente: QuickBooks Online</span>
              {generatedAt && (
                <span>Actualizado: {new Date(generatedAt).toLocaleString("es-CR")}</span>
              )}
            </div>
          </div>
          {connectionChip}
        </div>
      </div>
    </div>
    <div className="max-w-[1600px] mx-auto px-4 md:px-6 space-y-6">
      {filterBar}
      {children}
    </div>
  </div>
);

const ConnectionChip = ({ data, error }: { data?: DashboardData; error: boolean }) => {
  let label = "Conectado";
  let icon = <CheckCircle2 className="h-3.5 w-3.5" />;
  let cls = "bg-[hsl(var(--green-bg))] text-[hsl(var(--green))]";
  if (error || (data && data.connection !== "connected")) {
    label = "Error de sincronización"; icon = <AlertTriangle className="h-3.5 w-3.5" />;
    cls = "bg-[hsl(var(--red-bg))] text-[hsl(var(--red))]";
  } else if (data) {
    const anyUnavailable = [data.pnl?.status, data.balance?.status, data.monthly?.status,
      data.receivables?.status, data.cash?.status].some((s) => s !== "ok");
    if (anyUnavailable) {
      label = "Información incompleta"; icon = <AlertTriangle className="h-3.5 w-3.5" />;
      cls = "bg-[hsl(var(--amber-bg))] text-[hsl(var(--amber))]";
    }
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium h-fit", cls)}>
      {icon} {label}
    </span>
  );
};

// ============ Ver origen del dato ============
type DataQuality = "confirmado" | "calculado" | "no_disponible";

const qualityFromStatus = (status?: string): DataQuality => {
  if (status === "ok") return "confirmado";
  if (status === "unavailable" || status === "no_data" || status === "insufficient" || !status) return "no_disponible";
  return "calculado";
};

const QUALITY_META: Record<DataQuality, { label: string; cls: string }> = {
  confirmado: { label: "Confirmado", cls: "bg-[hsl(var(--green-bg))] text-[hsl(var(--green))]" },
  calculado: { label: "Calculado", cls: "bg-[hsl(var(--amber-bg))] text-[hsl(var(--amber))]" },
  no_disponible: { label: "No disponible", cls: "bg-[hsl(var(--red-bg))] text-[hsl(var(--red))]" },
};

interface VerOrigenProps {
  report: string;
  period?: { startDate: string; endDate: string };
  company?: string;
  currency?: string | null;
  formula?: string;
  status?: string;
  quality?: DataQuality;
}

const VerOrigen = ({ report, period, company, currency, formula, status, quality }: VerOrigenProps) => {
  const q = quality ?? qualityFromStatus(status);
  const meta = QUALITY_META[q];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
          aria-label="Ver origen del dato"
        >
          <Info className="h-3.5 w-3.5" /> Ver origen
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 text-sm">
        <div className="space-y-2">
          <p className="font-semibold text-foreground">Origen del dato</p>
          <dl className="space-y-1.5 text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Reporte</dt>
              <dd className="text-right font-medium text-foreground">{report}</dd>
            </div>
            {period && (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Periodo</dt>
                <dd className="text-right font-medium text-foreground">
                  {fmtDMY(period.startDate)} – {fmtDMY(period.endDate)}
                </dd>
              </div>
            )}
            {company && (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Empresa</dt>
                <dd className="text-right font-medium text-foreground">{company}</dd>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Moneda</dt>
              <dd className="text-right font-medium text-foreground">{currency || "sin especificar"}</dd>
            </div>
            {formula && (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Fórmula</dt>
                <dd className="text-right font-medium text-foreground">{formula}</dd>
              </div>
            )}
            <div className="flex justify-between gap-3 items-center pt-1">
              <dt className="text-muted-foreground">Estado del dato</dt>
              <dd>
                <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", meta.cls)}>
                  {meta.label}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </PopoverContent>
    </Popover>
  );
};



// ============ Filter bar ============
const FilterBar = ({
  preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo, onApply, onClear,
}: {
  preset: PresetKey; setPreset: (p: PresetKey) => void;
  customFrom?: Date; setCustomFrom: (d?: Date) => void;
  customTo?: Date; setCustomTo: (d?: Date) => void;
  onApply: () => void; onClear: () => void;
}) => (
  <Card className="animate-fade-in">
    <CardContent className="flex flex-wrap items-end gap-3 py-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">Periodo</span>
        <Select value={preset} onValueChange={(v) => setPreset(v as PresetKey)}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PRESETS.map((p) => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {preset === "personalizado" && (
        <>
          <DateField label="Desde" value={customFrom} onChange={setCustomFrom} />
          <DateField label="Hasta" value={customTo} onChange={setCustomTo} />
        </>
      )}

      <div className="flex gap-2">
        <Button onClick={onApply}>Aplicar</Button>
        <Button variant="outline" onClick={onClear}>Limpiar</Button>
      </div>
    </CardContent>
  </Card>
);

const DateField = ({ label, value, onChange }: { label: string; value?: Date; onChange: (d?: Date) => void }) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs font-medium text-muted-foreground">{label}</span>
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !value && "text-muted-foreground")}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? fmtDMY(toISO(value)) : "DD/MM/YYYY"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={onChange} initialFocus className={cn("p-3 pointer-events-auto")} />
      </PopoverContent>
    </Popover>
  </div>
);

// ============ Charts ============
const CHART_COLORS = {
  income: "hsl(var(--royal))",
  expenses: "hsl(var(--gold))",
  net: "hsl(var(--green))",
};

const MonthlyChart = ({ data, prev, fmt, companyName }: {
  data: DashboardData; prev?: DashboardData;
  fmt: { full: (v: number | null) => string; compact: (v: number | null) => string };
  companyName?: string;
}) => {
  const monthly = data.monthly;
  const series = monthly?.series ?? [];

  let body: React.ReactNode;
  if (monthly?.status === "insufficient") {
    body = <EmptyMsg msg="Información insuficiente para analizar tendencia." />;
  } else if (monthly?.status !== "ok" || series.length === 0) {
    body = <EmptyMsg msg="No hay información mensual disponible para el periodo seleccionado." />;
  } else {
    body = (
      <>
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={series} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => fmt.compact(v)} width={64} />
            <Tooltip
              formatter={(v: number, name: string) => [fmt.full(v), name]}
              labelClassName="font-medium"
            />
            <Legend />
            <Bar name="Ingresos" dataKey="income" fill={CHART_COLORS.income} radius={[4, 4, 0, 0]} />
            <Bar name="Gastos" dataKey="expenses" fill={CHART_COLORS.expenses} radius={[4, 4, 0, 0]} />
            <Line name="Utilidad neta" type="monotone" dataKey="net" stroke={CHART_COLORS.net} strokeWidth={2.5} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
        <p className="text-sm text-muted-foreground mt-3">{monthlyInterpretation(data, prev)}</p>
      </>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-lg">Evolución mensual de ingresos, gastos y utilidad neta</CardTitle>
        <VerOrigen report="Profit & Loss (por mes)" period={data?.period} company={companyName}
          currency={data?.currency} status={data?.monthly?.status} />
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
};

function monthlyInterpretation(data: DashboardData, prev?: DashboardData): string {
  const parts: string[] = [];
  const inc = data.pnl?.income;
  const exp = data.pnl?.expenses;
  const net = data.pnl?.netIncome;
  const pInc = prev?.pnl?.income;
  const pExp = prev?.pnl?.expenses;

  if (inc != null && pInc != null && pInc !== 0) {
    const chg = (inc - pInc) / Math.abs(pInc);
    parts.push(`Los ingresos ${chg >= 0 ? "aumentaron" : "disminuyeron"} ${Math.abs(chg * 100).toFixed(1)}% frente al periodo de comparación.`);
  }
  if (inc != null && exp != null && pInc != null && pExp != null && pInc !== 0 && pExp !== 0) {
    const incChg = (inc - pInc) / Math.abs(pInc);
    const expChg = (exp - pExp) / Math.abs(pExp);
    if (expChg > incChg) parts.push("Los gastos crecen más rápido que los ingresos, lo que presiona la utilidad.");
  }
  if (net != null) {
    parts.push(net >= 0 ? "La utilidad neta se mantiene positiva." : "La utilidad neta es negativa en el periodo.");
  }
  return parts.length ? parts.join(" ") : "No hay suficientes datos para generar una interpretación.";
}

const ExpenseCategoriesChart = ({ pnl, fmt, period, currency, companyName }: {
  pnl: DashboardData["pnl"];
  fmt: { full: (v: number | null) => string; compact: (v: number | null) => string };
  period?: { startDate: string; endDate: string };
  currency?: string | null;
  companyName?: string;
}) => {
  const cats = (pnl?.expenseCategories ?? []).filter((c) => c.amount != null);
  let body: React.ReactNode;
  if (pnl?.status !== "ok" || cats.length === 0) {
    body = <EmptyMsg msg="No hay gastos registrados para el periodo seleccionado." />;
  } else {
    const top = cats[0];
    const interp = top?.pct != null
      ? `La principal categoría "${top.name}" representa el ${(top.pct * 100).toFixed(1)}% del total de gastos.`
      : `La principal categoría de gasto es "${top?.name}".`;
    body = (
      <>
        <ResponsiveContainer width="100%" height={Math.max(240, cats.length * 42)}>
          <BarChart data={cats} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => fmt.compact(v)} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={140} />
            <Tooltip
              formatter={(v: number, _n: string, item: any) => {
                const pct = item?.payload?.pct;
                return [`${fmt.full(v)}${pct != null ? ` · ${(pct * 100).toFixed(1)}%` : ""}`, "Gasto"];
              }}
            />
            <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
              {cats.map((_, i) => (
                <Cell key={i} fill="hsl(var(--gold))" fillOpacity={0.55 + Math.min(i, 6) * 0.06} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-sm text-muted-foreground mt-3">{interp}</p>
      </>
    );
  }
  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-lg">Principales gastos por categoría</CardTitle>
        <VerOrigen report="Profit & Loss (sección Gastos)" period={period} company={companyName}
          currency={currency} formula="% = gasto de la categoría ÷ total de gastos" status={pnl?.status} />
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
};

// ============ Small state components ============
const EmptyMsg = ({ msg }: { msg: string }) => (
  <div className="flex items-center justify-center py-12 text-center text-sm text-muted-foreground">{msg}</div>
);

const StateCard = ({ msg, error }: { msg: string; error?: boolean }) => (
  <Card className="border-dashed">
    <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {error ? <WifiOff className="h-10 w-10 text-muted-foreground" /> : <Landmark className="h-10 w-10 text-muted-foreground" />}
      <p className="text-base font-medium text-foreground max-w-md">{msg}</p>
    </CardContent>
  </Card>
);

const StatePage = ({ title, msg }: { title: string; msg: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-background p-6">
    <Card className="border-dashed max-w-md">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Landmark className="h-10 w-10 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{msg}</p>
      </CardContent>
    </Card>
  </div>
);

const LoadingSkeletons = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}><CardContent className="py-6 space-y-3">
          <Skeleton className="h-4 w-32" /><Skeleton className="h-8 w-40" /><Skeleton className="h-3 w-24" />
        </CardContent></Card>
      ))}
    </div>
    <Card><CardContent className="py-6"><Skeleton className="h-[340px] w-full" /></CardContent></Card>
    <Card><CardContent className="py-6"><Skeleton className="h-[280px] w-full" /></CardContent></Card>
  </div>
);

export default ManagerialDashboard;
