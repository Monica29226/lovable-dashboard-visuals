import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  Languages, TrendingUp, TrendingDown, Wallet, Building2, BarChart3,
  Loader2, Link2, Lock, ChevronDown, ChevronRight, AlertCircle, CheckCircle2,
} from "lucide-react";
import enfoqueLogo from "@/assets/enfoque-logo.jpg";

interface ProcessedRow {
  name: string;
  monthlyValues: number[];
  total: number;
  type: string;
  level: number;
  children?: ProcessedRow[];
}

interface BalanceItemData {
  name: string;
  value: number;
  type: string;
  level: number;
  children?: BalanceItemData[];
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
  assets: BalanceItemData[];
  liabilities: BalanceItemData[];
  equity: BalanceItemData[];
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

// Flatten leaf rows (real accounts) from a list of sections.
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

const BalanceTreeItem = ({ item, depth = 0 }: { item: BalanceItemData; depth?: number }) => {
  const [open, setOpen] = useState(depth <= 1);
  const hasChildren = item.children && item.children.length > 0;
  const paddingLeft = `${depth * 20 + 8}px`;

  if (!hasChildren) {
    return (
      <div
        className={`flex justify-between py-1.5 px-2 rounded text-sm ${
          item.type === "Summary" ? "font-bold border-t mt-1 pt-2 bg-muted/40" : "hover:bg-muted/30"
        }`}
        style={{ paddingLeft }}
      >
        <span className={item.type === "Summary" ? "" : "text-muted-foreground"}>{item.name}</span>
        <span className="font-mono tabular-nums">{fmt(item.value)}</span>
      </div>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <div
          className={`flex items-center justify-between py-1.5 px-2 rounded cursor-pointer hover:bg-muted/40 text-sm ${
            item.type === "Section" ? "font-semibold" : ""
          } ${item.type === "Summary" ? "font-bold border-t mt-1 pt-2 bg-muted/40" : ""}`}
          style={{ paddingLeft }}
        >
          <span className="flex items-center gap-1.5">
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            {item.name}
          </span>
          <span className="font-mono tabular-nums">{fmt(item.value)}</span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {item.children!.map((child, i) => (
          <BalanceTreeItem key={i} item={child} depth={depth + 1} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

export const EnfoqueDashboard = ({ companyId, companyName, isConnected }: Props) => {
  const [language, setLanguage] = useState<"ES" | "EN">("ES");
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));

  const t = language === "ES"
    ? {
        title: "Dashboard Financiero — Enfoque a la Familia",
        live: "QuickBooks (Tiempo Real)",
        connected: "Conectado",
        disconnected: "Sin conexión",
        onlyCompany: "Solo esta empresa",
        summary: "Resumen", income: "Ingresos", expenses: "Gastos",
        balance: "Balance", results: "Resultados", kpis: "KPIs",
        totalIncome: "Total Ingresos", totalExpenses: "Total Gastos", netResult: "Resultado Neto",
        assets: "Activos", liabilities: "Pasivos", equity: "Patrimonio Neto",
        revenueBySource: "Ingresos por Fuente", expenseDistribution: "Distribución de Gastos",
        account: "Cuenta", amount: "Monto",
        noConnection: "Conecta esta empresa con QuickBooks para ver sus datos",
        noConnectionHelp: "Ve a la sección de QuickBooks y conecta esta empresa para sincronizar la información en vivo.",
        loading: "Cargando datos de QuickBooks...",
        period: "Periodo", others: "Otros",
        incomeStatement: "Estado de Resultados", incomeMinusExpenses: "Ingresos menos Gastos",
        margin: "Margen Neto", expenseRatio: "Gastos / Ingresos", currentRatio: "Razón Corriente",
      }
    : {
        title: "Financial Dashboard — Focus on the Family",
        live: "QuickBooks (Real-time)",
        connected: "Connected",
        disconnected: "Disconnected",
        onlyCompany: "This company only",
        summary: "Summary", income: "Income", expenses: "Expenses",
        balance: "Balance", results: "Results", kpis: "KPIs",
        totalIncome: "Total Income", totalExpenses: "Total Expenses", netResult: "Net Result",
        assets: "Assets", liabilities: "Liabilities", equity: "Equity",
        revenueBySource: "Revenue by Source", expenseDistribution: "Expense Distribution",
        account: "Account", amount: "Amount",
        noConnection: "Connect this company with QuickBooks to view its data",
        noConnectionHelp: "Go to the QuickBooks section and connect this company to sync live information.",
        loading: "Loading QuickBooks data...",
        period: "Period", others: "Others",
        incomeStatement: "Income Statement", incomeMinusExpenses: "Income minus Expenses",
        margin: "Net Margin", expenseRatio: "Expenses / Income", currentRatio: "Current Ratio",
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

  const isLoading = incomeLoading || balanceLoading;

  const { incomeBreakdown, expenseBreakdown } = useMemo(() => {
    const sections = income?.sections ?? [];
    const incomeSecs = sections.filter((s) => /ingres|income/i.test(s.name));
    const expenseSecs = sections.filter((s) => /gasto|expense|cost|costo/i.test(s.name));
    const incomeLeaves = flattenLeaves(incomeSecs).sort((a, b) => b.value - a.value);
    const expenseLeavesAll = flattenLeaves(expenseSecs).sort((a, b) => b.value - a.value);
    // Top 9 expenses + "Otros"
    const top = expenseLeavesAll.slice(0, 9);
    const restTotal = expenseLeavesAll.slice(9).reduce((s, i) => s + i.value, 0);
    const expenseLeaves = restTotal > 0 ? [...top, { name: t.others, value: restTotal }] : top;
    return { incomeBreakdown: incomeLeaves, expenseBreakdown: expenseLeaves };
  }, [income, t.others]);

  const totalIncome = income?.totalIncome?.total ?? 0;
  const totalExpenses = Math.abs(income?.totalExpenses?.total ?? 0);
  const netResult = income?.netIncome?.total ?? totalIncome - totalExpenses;

  const totalAssets = balance?.totalAssets ?? 0;
  const totalLiabilities = balance?.totalLiabilities ?? 0;
  const totalEquity = balance?.totalEquity ?? 0;

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

  const BreakdownTable = ({ data, total }: { data: { name: string; value: number }[]; total: number }) => (
    <Card>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3 font-semibold text-muted-foreground">{t.account}</th>
              <th className="text-right p-3 font-semibold text-muted-foreground">{t.amount}</th>
              <th className="text-right p-3 font-semibold text-muted-foreground">%</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                <td className="p-3">{r.name}</td>
                <td className="p-3 text-right font-mono tabular-nums">{fmt(r.value)}</td>
                <td className="p-3 text-right text-muted-foreground">
                  {total > 0 ? `${((r.value / total) * 100).toFixed(1)}%` : "—"}
                </td>
              </tr>
            ))}
            <tr className="bg-muted/40 font-bold">
              <td className="p-3">Total</td>
              <td className="p-3 text-right font-mono tabular-nums">{fmt(total)}</td>
              <td className="p-3 text-right">100%</td>
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
              {isConnected ? <CheckCircle2 className="h-3 w-3 text-success-live" /> : <AlertCircle className="h-3 w-3 text-gold" />}
              {isConnected ? t.live : t.disconnected}
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
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setLanguage((p) => (p === "ES" ? "EN" : "ES"))}>
            <Languages className="h-4 w-4 mr-2" /> {language}
          </Button>
        </div>

        {!isConnected ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <Link2 className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{t.noConnection}</h3>
                <p className="text-sm text-muted-foreground max-w-md">{t.noConnectionHelp}</p>
              </div>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t.loading}</p>
          </div>
        ) : (
          <Tabs defaultValue="summary" className="w-full animate-grow">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 bg-card shadow-sm h-auto p-1 gap-1">
              {[
                ["summary", t.summary], ["income", t.income], ["expenses", t.expenses],
                ["balance", t.balance], ["results", t.results], ["kpis", t.kpis],
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                <PieBlock title={t.revenueBySource} data={incomeBreakdown} colors={COLORS_INCOME} />
                <PieBlock title={t.expenseDistribution} data={expenseBreakdown} colors={COLORS_EXPENSE} />
              </div>
            </TabsContent>

            {/* Income */}
            <TabsContent value="income" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                <PieBlock title={t.revenueBySource} data={incomeBreakdown} colors={COLORS_INCOME} />
                <BreakdownTable data={incomeBreakdown} total={totalIncome} />
              </div>
            </TabsContent>

            {/* Expenses */}
            <TabsContent value="expenses" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                <PieBlock title={t.expenseDistribution} data={expenseBreakdown} colors={COLORS_EXPENSE} />
                <BreakdownTable data={expenseBreakdown} total={totalExpenses} />
              </div>
            </TabsContent>

            {/* Balance */}
            <TabsContent value="balance" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                <Card>
                  <CardHeader><CardTitle className="text-base">{t.assets}</CardTitle></CardHeader>
                  <CardContent>
                    {(balance?.assets ?? []).map((it, i) => <BalanceTreeItem key={i} item={it} />)}
                    <div className="flex justify-between border-t-2 mt-2 pt-2 px-2 font-bold">
                      <span>{t.assets}</span><span className="font-mono">{fmt(totalAssets)}</span>
                    </div>
                  </CardContent>
                </Card>
                <div className="space-y-6">
                  <Card>
                    <CardHeader><CardTitle className="text-base">{t.liabilities}</CardTitle></CardHeader>
                    <CardContent>
                      {(balance?.liabilities ?? []).map((it, i) => <BalanceTreeItem key={i} item={it} />)}
                      <div className="flex justify-between border-t-2 mt-2 pt-2 px-2 font-bold">
                        <span>{t.liabilities}</span><span className="font-mono">{fmt(totalLiabilities)}</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-base">{t.equity}</CardTitle></CardHeader>
                    <CardContent>
                      {(balance?.equity ?? []).map((it, i) => <BalanceTreeItem key={i} item={it} />)}
                      <div className="flex justify-between border-t-2 mt-2 pt-2 px-2 font-bold">
                        <span>{t.equity}</span><span className="font-mono">{fmt(totalEquity)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              {balance?.reportDate && (
                <p className="text-sm text-muted-foreground text-center">
                  {t.period}: {new Date(balance.reportDate).toLocaleDateString("es-CR")}
                </p>
              )}
            </TabsContent>

            {/* Results */}
            <TabsContent value="results" className="space-y-6 mt-6">
              <Card className="animate-fade-in">
                <CardHeader><CardTitle className="text-base">{t.incomeStatement}</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3 font-semibold">{t.totalIncome}</td>
                        <td className="p-3 text-right font-mono tabular-nums">{fmt(totalIncome)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-semibold">{t.totalExpenses}</td>
                        <td className="p-3 text-right font-mono tabular-nums">{fmt(totalExpenses)}</td>
                      </tr>
                      <tr className="bg-muted/40 font-bold">
                        <td className="p-3">{t.incomeMinusExpenses}</td>
                        <td className={`p-3 text-right font-mono tabular-nums ${netResult < 0 ? "text-danger" : "text-success-live"}`}>
                          {fmt(netResult)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
              <Card className="animate-fade-in">
                <CardHeader><CardTitle className="text-base">{t.income} vs {t.expenses}</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { name: t.income, value: totalIncome },
                      { name: t.expenses, value: totalExpenses },
                      { name: t.netResult, value: netResult },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₡${(v / 1000000).toFixed(0)}M`} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {[0, 1, 2].map((i) => <Cell key={i} fill="hsl(var(--co))" fillOpacity={0.6 + i * 0.15} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* KPIs */}
            <TabsContent value="kpis" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                <KpiCard icon={BarChart3} label={t.margin}
                  value={totalIncome > 0 ? `${((netResult / totalIncome) * 100).toFixed(1)}%` : "—"}
                  valueClass={netResult < 0 ? "text-danger" : "text-success-live"} />
                <KpiCard icon={BarChart3} label={t.expenseRatio}
                  value={totalIncome > 0 ? `${((totalExpenses / totalIncome) * 100).toFixed(1)}%` : "—"} />
                <KpiCard icon={BarChart3} label={t.currentRatio}
                  value={totalLiabilities > 0 ? (totalAssets / totalLiabilities).toFixed(2) : "—"} />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};
