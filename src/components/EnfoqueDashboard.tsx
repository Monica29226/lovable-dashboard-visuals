import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line,
} from "recharts";
import {
  Languages, TrendingUp, TrendingDown, Wallet, Building2,
  Loader2, Lock, CheckCircle2, AlertCircle, Target,
} from "lucide-react";
import enfoqueLogo from "@/assets/enfoque-logo.jpg";
import { getEnfoqueFinancialData, type Lang } from "@/data/enfoqueFinancialData";

interface ProcessedRow {
  name: string;
  monthlyValues: number[];
  total: number;
  type: string;
  level: number;
  children?: ProcessedRow[];
}

interface IncomeData {
  months: string[];
  sections: ProcessedRow[];
  totalIncome: ProcessedRow | null;
  totalExpenses: ProcessedRow | null;
  netIncome: ProcessedRow | null;
  startDate: string;
  endDate: string;
}

interface BalanceData {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  reportDate: string;
}

interface Props {
  companyId: string;
  companyName: string;
  isConnected: boolean;
}

const COLORS_INCOME = ["#0E3A5A", "#2A9D8F", "#E9C46A", "#3C6E91", "#F4A261", "#6A994E"];
const COLORS_EXPENSE = [
  "#0E3A5A", "#2A9D8F", "#E76F51", "#E9C46A", "#3C6E91",
  "#8AA6BF", "#F4A261", "#264653", "#6A994E", "#BC6C25",
];

const fmt = (value: number | null | undefined): string => {
  const v = value ?? 0;
  const formatted = new Intl.NumberFormat("es-CR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(v));
  return v < 0 ? `(₡${formatted})` : `₡${formatted}`;
};

const flattenLeaves = (rows: ProcessedRow[]): { name: string; value: number }[] => {
  const out: { name: string; value: number }[] = [];
  const walk = (r: ProcessedRow) => {
    if (r.type === "Summary") return;
    if (r.children && r.children.length > 0) {
      r.children.forEach(walk);
    } else if (r.total !== 0) {
      out.push({ name: r.name, value: Math.abs(r.total) });
    }
  };
  rows.forEach(walk);
  return out;
};

export const EnfoqueDashboard = ({ companyId, companyName, isConnected }: Props) => {
  const [language, setLanguage] = useState<Lang>("ES");
  const currentYear = new Date().getFullYear();
  const [year] = useState(String(currentYear));
  const es = language === "ES";

  const curated = useMemo(() => getEnfoqueFinancialData(language), [language]);

  const t = es
    ? {
        title: "Dashboard Financiero — Enfoque a la Familia",
        live: "QuickBooks (Tiempo Real)",
        curatedSrc: "Datos curados 2025",
        onlyCompany: "Solo esta empresa",
        summary: "Resumen", income: "Ingresos", expenses: "Gastos",
        balance: "Balance", results: "Resultados", indicators: "Indicadores",
        totalIncome: "Total Ingresos", totalExpenses: "Total Gastos", netResult: "Resultado Neto",
        assets: "Activos", liabilities: "Pasivos", equity: "Patrimonio Neto",
        revenueBySource: "Ingresos por Fuente", expenseDistribution: "Distribución de Gastos",
        incomeVsExpenses: "Ingresos vs Gastos por Año", incomeTrend: "Tendencia de Ingresos",
        account: "Cuenta", real: "Real", budget: "Presupuesto", amount: "Monto",
        loading: "Cargando datos de QuickBooks...",
        others: "Otros", margin: "Margen", execution: "Ejecución Presupuestaria",
        budgeted: "Presupuestado", executed: "% Ejecutado", year: "Año", netResultRow: "Resultado",
        comparativePosition: "Posición Financiera", kpis: "KPIs Clave", okrs: "Objetivos y Resultados Clave",
        resultsAnalysis: "Análisis de Resultados 2022-2025", surplus: "Superávit", deficit: "Déficit",
      }
    : {
        title: "Financial Dashboard — Focus on the Family",
        live: "QuickBooks (Real-time)",
        curatedSrc: "Curated data 2025",
        onlyCompany: "This company only",
        summary: "Summary", income: "Income", expenses: "Expenses",
        balance: "Balance", results: "Results", indicators: "Indicators",
        totalIncome: "Total Income", totalExpenses: "Total Expenses", netResult: "Net Result",
        assets: "Assets", liabilities: "Liabilities", equity: "Equity",
        revenueBySource: "Revenue by Source", expenseDistribution: "Expense Distribution",
        incomeVsExpenses: "Income vs Expenses by Year", incomeTrend: "Income Trend",
        account: "Account", real: "Actual", budget: "Budget", amount: "Amount",
        loading: "Loading QuickBooks data...",
        others: "Others", margin: "Margin", execution: "Budget Execution",
        budgeted: "Budgeted", executed: "% Executed", year: "Year", netResultRow: "Result",
        comparativePosition: "Financial Position", kpis: "Key KPIs", okrs: "Objectives and Key Results",
        resultsAnalysis: "Results Analysis 2022-2025", surplus: "Surplus", deficit: "Deficit",
      };

  const { data: income, isLoading: incomeLoading } = useQuery({
    queryKey: ["enfoque-income", companyId, year],
    enabled: isConnected,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("quickbooks-income", {
        body: { companyId, year },
      });
      if (error) throw error;
      return data as IncomeData;
    },
  });

  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ["enfoque-balance", companyId],
    enabled: isConnected,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("quickbooks-balance", {
        body: { companyId },
      });
      if (error) throw error;
      return data as BalanceData;
    },
  });

  const liveLoading = isConnected && (incomeLoading || balanceLoading);
  const hasLive = isConnected && !!income;

  // Live breakdowns (when connected)
  const { liveIncomeBreakdown, liveExpenseBreakdown } = useMemo(() => {
    const sections = income?.sections ?? [];
    const incomeSecs = sections.filter((s) => /ingres|income/i.test(s.name));
    const expenseSecs = sections.filter((s) => /gasto|expense|cost|costo/i.test(s.name));
    const incomeLeaves = flattenLeaves(incomeSecs).sort((a, b) => b.value - a.value);
    const expenseLeavesAll = flattenLeaves(expenseSecs).sort((a, b) => b.value - a.value);
    const top = expenseLeavesAll.slice(0, 9);
    const restTotal = expenseLeavesAll.slice(9).reduce((s, i) => s + i.value, 0);
    const expenseLeaves = restTotal > 0 ? [...top, { name: t.others, value: restTotal }] : top;
    return { liveIncomeBreakdown: incomeLeaves, liveExpenseBreakdown: expenseLeaves };
  }, [income, t.others]);

  // Resolve values: prefer live data, fall back to curated.
  const totalIncome = hasLive ? (income?.totalIncome?.total ?? 0) : curated.financialSummary.accumulatedIncome2025;
  const totalExpenses = hasLive ? Math.abs(income?.totalExpenses?.total ?? 0) : curated.financialSummary.accumulatedExpenses2025;
  const netResult = hasLive ? (income?.netIncome?.total ?? totalIncome - totalExpenses) : curated.financialSummary.netResult2025;

  const totalAssets = hasLive && balance ? balance.totalAssets : curated.financialPosition.totalAssets;
  const totalLiabilities = hasLive && balance ? balance.totalLiabilities : curated.financialPosition.totalLiabilities;
  const totalEquity = hasLive && balance ? balance.totalEquity : curated.financialPosition.netEquity;

  const incomeBreakdown = hasLive && liveIncomeBreakdown.length > 0
    ? liveIncomeBreakdown
    : curated.incomeDetail2025.filter((r) => r.amount > 0).map((r) => ({ name: r.concept, value: r.amount }));
  const expenseBreakdown = hasLive && liveExpenseBreakdown.length > 0
    ? liveExpenseBreakdown
    : curated.expenseDetail2025.filter((r) => r.amount > 0).map((r) => ({ name: r.concept, value: r.amount }));

  const PieBlock = ({ title, data, colors }: { title: string; data: { name: string; value: number }[]; colors: string[] }) => (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">—</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                label={({ percent }) => (percent > 0.05 ? `${Math.round(percent * 100)}%` : "")}>
                {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );

  const DetailTable = ({ rows, total }: { rows: { concept: string; amount: number; budget: number }[]; total: number }) => (
    <Card>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3 font-semibold text-muted-foreground">{t.account}</th>
              <th className="text-right p-3 font-semibold text-muted-foreground">{t.real}</th>
              <th className="text-right p-3 font-semibold text-muted-foreground">{t.budget}</th>
              <th className="text-right p-3 font-semibold text-muted-foreground">%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                <td className="p-3">{r.concept}</td>
                <td className="p-3 text-right font-mono tabular-nums">{fmt(r.amount)}</td>
                <td className="p-3 text-right font-mono tabular-nums text-muted-foreground">{fmt(r.budget)}</td>
                <td className="p-3 text-right text-muted-foreground">
                  {r.budget > 0 ? `${((r.amount / r.budget) * 100).toFixed(0)}%` : "—"}
                </td>
              </tr>
            ))}
            <tr className="bg-muted/40 font-bold">
              <td className="p-3">Total</td>
              <td className="p-3 text-right font-mono tabular-nums">{fmt(total)}</td>
              <td className="p-3 text-right" colSpan={2}></td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );

  const KpiCard = ({ icon: Icon, label, value, valueClass }: { icon: any; label: string; value: string; valueClass?: string }) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Icon className="h-4 w-4 text-[hsl(var(--co))]" /> {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold ${valueClass ?? "text-foreground"}`}>{value}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative w-full bg-ink mb-6">
        <div className="relative max-w-[1600px] mx-auto flex flex-col items-center justify-center gap-4 px-6 py-10 md:py-12">
          <img src={enfoqueLogo} alt={companyName} className="h-16 md:h-20 object-contain rounded-lg shadow-md bg-paper p-2" />
          <h1 className="font-display text-3xl md:text-4xl text-paper text-center">{t.title}</h1>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <Badge variant="outline" className="bg-paper/10 text-paper/90 border-paper/20 gap-1.5">
              {hasLive
                ? <><CheckCircle2 className="h-3 w-3 text-success-live" /> {t.live}</>
                : <><AlertCircle className="h-3 w-3 text-gold" /> {t.curatedSrc}</>}
            </Badge>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-paper/10 px-3 py-1 text-paper/90">
              <Lock className="h-3 w-3 text-gold" /> {t.onlyCompany}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto space-y-6 px-4 md:px-6">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => setLanguage((p) => (p === "ES" ? "EN" : "ES"))}>
            <Languages className="h-4 w-4 mr-2" /> {language}
          </Button>
        </div>

        {liveLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t.loading}</p>
          </div>
        ) : (
          <Tabs defaultValue="summary" className="w-full animate-grow">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 bg-card shadow-sm h-auto p-1 gap-1">
              {[
                ["summary", t.summary], ["income", t.income], ["expenses", t.expenses],
                ["balance", t.balance], ["results", t.results], ["indicators", t.indicators],
              ].map(([v, label]) => (
                <TabsTrigger key={v} value={v}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium py-2.5 text-xs md:text-sm">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Summary */}
            <TabsContent value="summary" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                <KpiCard icon={TrendingUp} label={t.totalIncome} value={fmt(totalIncome)} />
                <KpiCard icon={TrendingDown} label={t.totalExpenses} value={fmt(totalExpenses)} />
                <KpiCard icon={Wallet} label={t.netResult} value={fmt(netResult)}
                  valueClass={netResult < 0 ? "text-danger" : "text-success-live"} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                <KpiCard icon={Wallet} label={t.assets} value={fmt(totalAssets)} />
                <KpiCard icon={TrendingDown} label={t.liabilities} value={fmt(totalLiabilities)} />
                <KpiCard icon={Building2} label={t.equity} value={fmt(totalEquity)} />
              </div>
              <Card>
                <CardHeader><CardTitle className="text-base">{t.incomeVsExpenses}</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={curated.chartData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Legend />
                      <Bar dataKey="income" name={t.income} fill="#2A9D8F" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" name={t.expenses} fill="#0E3A5A" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Income */}
            <TabsContent value="income" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                <PieBlock title={t.revenueBySource} data={incomeBreakdown} colors={COLORS_INCOME} />
                <Card>
                  <CardHeader><CardTitle className="text-base">{t.incomeTrend}</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={curated.incomeComparison}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="year" />
                        <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                        <Tooltip formatter={(v: number) => fmt(v)} />
                        <Line type="monotone" dataKey="income" name={t.income} stroke="#2A9D8F" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
              {!hasLive && <DetailTable rows={curated.incomeDetail2025} total={curated.financialSummary.accumulatedIncome2025} />}
            </TabsContent>

            {/* Expenses */}
            <TabsContent value="expenses" className="space-y-6 mt-6">
              <PieBlock title={t.expenseDistribution} data={expenseBreakdown} colors={COLORS_EXPENSE} />
              {!hasLive && <DetailTable rows={curated.expenseDetail2025} total={curated.financialSummary.accumulatedExpenses2025} />}
            </TabsContent>

            {/* Balance */}
            <TabsContent value="balance" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                <KpiCard icon={Wallet} label={t.assets} value={fmt(totalAssets)} />
                <KpiCard icon={TrendingDown} label={t.liabilities} value={fmt(totalLiabilities)} />
                <KpiCard icon={Building2} label={t.equity} value={fmt(totalEquity)} />
              </div>
              <Card>
                <CardHeader><CardTitle className="text-base">{t.execution}</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold text-muted-foreground">{t.account}</th>
                        <th className="text-right p-3 font-semibold text-muted-foreground">{t.budgeted}</th>
                        <th className="text-right p-3 font-semibold text-muted-foreground">{t.real}</th>
                        <th className="text-right p-3 font-semibold text-muted-foreground">{t.executed}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {curated.budgetExecution.map((r, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="p-3">{r.concept}</td>
                          <td className="p-3 text-right font-mono tabular-nums">{fmt(r.budgeted)}</td>
                          <td className="p-3 text-right font-mono tabular-nums">{fmt(r.real)}</td>
                          <td className="p-3 text-right">{r.executed.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Results */}
            <TabsContent value="results" className="space-y-6 mt-6">
              <Card>
                <CardHeader><CardTitle className="text-base">{t.resultsAnalysis}</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold text-muted-foreground">{t.year}</th>
                        <th className="text-right p-3 font-semibold text-muted-foreground">{t.income}</th>
                        <th className="text-right p-3 font-semibold text-muted-foreground">{t.expenses}</th>
                        <th className="text-right p-3 font-semibold text-muted-foreground">{t.netResultRow}</th>
                        <th className="text-right p-3 font-semibold text-muted-foreground">{t.margin}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {curated.resultsAnalysis.map((r, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="p-3 font-medium">{r.year}{r.accumulated ? "*" : ""}</td>
                          <td className="p-3 text-right font-mono tabular-nums">{fmt(r.income)}</td>
                          <td className="p-3 text-right font-mono tabular-nums">{fmt(r.expenses)}</td>
                          <td className={`p-3 text-right font-mono tabular-nums ${r.netResult < 0 ? "text-danger" : "text-success-live"}`}>{fmt(r.netResult)}</td>
                          <td className="p-3 text-right">
                            <Badge variant="outline" className={r.status === "surplus" ? "text-success-live" : "text-danger"}>
                              {r.margin}% {r.status === "surplus" ? t.surplus : t.deficit}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Indicators */}
            <TabsContent value="indicators" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                <Card>
                  <CardHeader><CardTitle className="text-base">{t.kpis}</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {curated.kpis.map((kpi, i) => (
                      <div key={i} className="p-4 bg-muted/40 rounded-lg">
                        <div className="text-sm text-muted-foreground">{kpi.label}</div>
                        <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4 text-[hsl(var(--co))]" /> {t.okrs}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {curated.okrs.map((okr, i) => (
                      <div key={i} className="border-l-4 border-[hsl(var(--co))] pl-4">
                        <h4 className="font-semibold text-foreground">{okr.objective}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{okr.keyResult}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default EnfoqueDashboard;
