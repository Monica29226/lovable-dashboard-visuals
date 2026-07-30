import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ReferenceLine,
} from "recharts";
import { AlertTriangle, Info } from "lucide-react";
import enfoqueLogo from "@/assets/enfoque-logo.jpg";
import { enfoqueData, pick, type BiText, type ComparativeLine } from "@/data/enfoqueFinancialData";

interface Props {
  companyId: string;
  companyName: string;
  /** Ignorada a propósito: el panel siempre usa el Excel de cierre mensual. */
  isConnected: boolean;
}

const NUM = "font-mono [font-variant-numeric:tabular-nums]";

const fmt = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "—";
  const formatted = new Intl.NumberFormat("es-CR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(value));
  return value < 0 ? `(₡${formatted})` : `₡${formatted}`;
};

const signClass = (v: number) =>
  v < 0 ? "text-destructive" : v > 0 ? "text-emerald-600" : "text-foreground";

export const EnfoqueDashboard = ({ companyName }: Props) => {
  const { language } = useLanguage();
  const d = enfoqueData;
  const T = (text: BiText) => pick(text, language);
  const L = d.labels;

  /* ---------------- Resumen ---------------- */
  const monthlyNet = d.summary.monthlyNet.map((m) => ({
    month: T(m.month),
    value: m.value,
  }));

  /* ---------------- Ingresos ---------------- */
  const incomeLines = [...d.income.lines].sort((a, b) => {
    const da = a.budgetToDate === null ? -1 : Math.abs(a.actual - a.budgetToDate);
    const db = b.budgetToDate === null ? -1 : Math.abs(b.actual - b.budgetToDate);
    return db - da;
  });
  const incomeScale = Math.max(
    ...d.income.lines.map((l) => Math.max(l.actual, l.budgetToDate ?? 0))
  );
  const blueRamp = ["#0E3A5A", "#1D5480", "#3C6E91", "#6E96B4", "#A9C3D6"];

  /* ---------------- Gastos ---------------- */
  const expenseLines = [...d.expenses.lines].sort(
    (a, b) => Math.abs(b.actual - b.budget) - Math.abs(a.actual - a.budget)
  );
  const statusOf = (actual: number, budget: number) => {
    if (budget === 0 && actual > 0) return { text: T(L.overBudget), cls: "text-destructive border-destructive/40 bg-destructive/10" };
    if (actual === 0) return { text: T(L.notExecuted), cls: "text-amber-700 border-amber-500/40 bg-amber-500/10" };
    const ratio = actual / budget;
    if (ratio > 1.02) return { text: T(L.overBudget), cls: "text-destructive border-destructive/40 bg-destructive/10" };
    if (ratio < 0.9) return { text: T(L.underBudget), cls: "text-emerald-700 border-emerald-500/40 bg-emerald-500/10" };
    return { text: T(L.onTrack), cls: "text-amber-700 border-amber-500/40 bg-amber-500/10" };
  };

  /* ---------------- Shared UI ---------------- */
  const Note = ({ text, tone = "info" }: { text: string; tone?: "info" | "warn" }) => (
    <div
      className={`flex gap-2 rounded-md border p-3 text-sm leading-relaxed ${
        tone === "warn"
          ? "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200"
          : "border-border bg-muted/40 text-muted-foreground"
      }`}
    >
      {tone === "warn" ? (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <p>{text}</p>
    </div>
  );

  const ComparativeTable = ({ title, rows }: { title: string; rows: ComparativeLine[] }) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left font-semibold text-muted-foreground">{T(L.account)}</th>
                <th className="p-3 text-right font-semibold text-muted-foreground">{T(L.y2024)}</th>
                <th className="p-3 text-right font-semibold text-muted-foreground">{T(L.y2025)}</th>
                <th className="p-3 text-right font-semibold text-muted-foreground">{T(L.y2026h1)}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={i}
                  className={`border-b border-border/50 ${
                    r.emphasis === "total" ? "bg-muted/40 font-bold" : "hover:bg-muted/20"
                  }`}
                >
                  <td className="p-3">{T(r.label)}</td>
                  {[r.y2024, r.y2025, r.y2026h1].map((v, j) => (
                    <td key={j} className={`p-3 text-right ${NUM} ${v !== null && v < 0 ? "text-destructive" : ""}`}>
                      {fmt(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative mb-6 w-full bg-ink">
        <div className="relative mx-auto flex max-w-[1600px] flex-col items-center justify-center gap-4 px-6 py-10 md:py-12">
          <img
            src={enfoqueLogo}
            alt={companyName}
            className="h-16 rounded-lg bg-paper object-contain p-2 shadow-md md:h-20"
          />
          <h1 className="font-display text-center text-3xl text-paper md:text-4xl">{T(d.meta.title)}</h1>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <Badge variant="outline" className="border-paper/20 bg-paper/10 text-paper/90">
              {T(d.meta.periodBadge)}
            </Badge>
            <Badge variant="outline" className="border-paper/20 bg-paper/10 text-paper/90">
              {T(d.meta.annualBudgetBadge)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] space-y-6 px-4 pb-12 md:px-6">
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-card p-1 shadow-sm md:grid-cols-5">
            <TabsTrigger value="summary" className="py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{T(d.tabs.summary)}</TabsTrigger>
            <TabsTrigger value="income" className="py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{T(d.tabs.income)}</TabsTrigger>
            <TabsTrigger value="expenses" className="py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{T(d.tabs.expenses)}</TabsTrigger>
            <TabsTrigger value="balance" className="py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{T(d.tabs.balance)}</TabsTrigger>
            <TabsTrigger value="results" className="py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{T(d.tabs.results)}</TabsTrigger>
          </TabsList>

          {/* ============ RESUMEN ============ */}
          <TabsContent value="summary" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {d.summary.headline.map((h, i) => (
                <Card key={i} className={i === 2 ? "border-destructive/40" : ""}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{T(h.label)}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <p className={`text-3xl font-bold ${NUM} ${signClass(h.value)}`}>{fmt(h.value)}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{T(h.note)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Note text={T(d.summary.headlineNote)} />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {d.summary.kpis.map((k, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{T(k.label)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-2xl font-bold ${NUM}`}>{k.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{T(k.note)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{T(d.summary.monthlyNetTitle)}</CardTitle>
                <p className="text-sm text-muted-foreground">{T(d.summary.monthlyNetNote)}</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyNet} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(1)}M`}
                      width={56}
                    />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <ReferenceLine y={0} stroke="currentColor" opacity={0.4} />
                    <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                      {monthlyNet.map((m, i) => (
                        <Cell key={i} fill={m.value < 0 ? "hsl(var(--destructive))" : "#2A9D8F"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============ INGRESOS ============ */}
          <TabsContent value="income" className="mt-6 space-y-6">
            <Note text={T(d.income.note)} />

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="p-3 text-left font-semibold text-muted-foreground">{T(L.line)}</th>
                        <th className="w-[28%] p-3 text-left font-semibold text-muted-foreground"> </th>
                        <th className="p-3 text-right font-semibold text-muted-foreground">{T(L.actual)}</th>
                        <th className="p-3 text-right font-semibold text-muted-foreground">{T(L.budgetToDate)}</th>
                        <th className="p-3 text-right font-semibold text-muted-foreground">{T(L.annualBudget)}</th>
                        <th className="p-3 text-right font-semibold text-muted-foreground">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomeLines.map((r, i) => {
                        const pctW = (r.actual / incomeScale) * 100;
                        const markW = r.budgetToDate ? (r.budgetToDate / incomeScale) * 100 : null;
                        return (
                          <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                            <td className="p-3">{T(r.label)}</td>
                            <td className="p-3">
                              <div className="relative h-3 w-full rounded-sm bg-muted">
                                <div
                                  className="h-3 rounded-sm bg-[#1D5480]"
                                  style={{ width: `${Math.min(pctW, 100)}%` }}
                                />
                                {markW !== null && (
                                  <span
                                    className="absolute top-[-3px] h-[18px] w-[2px] bg-foreground/70"
                                    style={{ left: `${Math.min(markW, 100)}%` }}
                                  />
                                )}
                              </div>
                            </td>
                            <td className={`p-3 text-right ${NUM}`}>{fmt(r.actual)}</td>
                            <td className={`p-3 text-right text-muted-foreground ${NUM}`}>
                              {r.budgetToDate === null ? T(L.noBudget) : fmt(r.budgetToDate)}
                            </td>
                            <td className={`p-3 text-right text-muted-foreground ${NUM}`}>
                              {r.annualBudget === null ? T(L.noBudget) : fmt(r.annualBudget)}
                            </td>
                            <td className={`p-3 text-right ${NUM}`}>
                              {r.budgetToDate ? `${Math.round((r.actual / r.budgetToDate) * 100)} %` : "—"}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-muted/40 font-bold">
                        <td className="p-3">{T(d.income.total.label)}</td>
                        <td className="p-3" />
                        <td className={`p-3 text-right ${NUM}`}>{fmt(d.income.total.actual)}</td>
                        <td className={`p-3 text-right ${NUM}`}>{fmt(d.income.total.budgetToDate)}</td>
                        <td className={`p-3 text-right ${NUM}`}>{fmt(d.income.total.annualBudget)}</td>
                        <td className={`p-3 text-right ${NUM}`}>
                          {Math.round((d.income.total.actual / (d.income.total.budgetToDate ?? 1)) * 100)} %
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{T(d.income.compositionTitle)}</CardTitle>
                <p className="text-sm text-muted-foreground">{T(d.income.compositionSubtitle)}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex h-6 w-full overflow-hidden rounded-md">
                  {d.income.composition.map((c, i) => (
                    <div
                      key={i}
                      style={{ width: `${c.share}%`, backgroundColor: blueRamp[i % blueRamp.length] }}
                      title={`${T(c.label)} · ${c.share} %`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {d.income.composition.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span
                        className="h-3 w-3 shrink-0 rounded-sm"
                        style={{ backgroundColor: blueRamp[i % blueRamp.length] }}
                      />
                      <span className="flex-1 truncate">{T(c.label)}</span>
                      <span className={`${NUM} text-muted-foreground`}>{fmt(c.value)}</span>
                      <span className={`${NUM} w-14 text-right font-semibold`}>{c.share.toFixed(1)} %</span>
                    </div>
                  ))}
                </div>
                <Note text={T(d.income.compositionNote)} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============ GASTOS ============ */}
          <TabsContent value="expenses" className="mt-6 space-y-6">
            <Note text={T(d.expenses.note)} />
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="p-3 text-left font-semibold text-muted-foreground">{T(L.line)}</th>
                        <th className="p-3 text-right font-semibold text-muted-foreground">{T(L.actual)}</th>
                        <th className="p-3 text-right font-semibold text-muted-foreground">{T(L.budget)}</th>
                        <th className="p-3 text-right font-semibold text-muted-foreground">{T(L.variance)}</th>
                        <th className="p-3 text-right font-semibold text-muted-foreground">%</th>
                        <th className="p-3 text-right font-semibold text-muted-foreground">{T(L.status)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenseLines.map((r, i) => {
                        const variance = r.budget - r.actual;
                        const st = statusOf(r.actual, r.budget);
                        return (
                          <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                            <td className="p-3">
                              {T(r.label)}
                              {r.unbudgeted && (
                                <span className="ml-2 text-xs text-muted-foreground">({T(L.unbudgeted)})</span>
                              )}
                            </td>
                            <td className={`p-3 text-right ${NUM}`}>{fmt(r.actual)}</td>
                            <td className={`p-3 text-right text-muted-foreground ${NUM}`}>{fmt(r.budget)}</td>
                            <td className={`p-3 text-right ${NUM} ${signClass(variance)}`}>{fmt(variance)}</td>
                            <td className={`p-3 text-right ${NUM}`}>
                              {r.budget > 0 ? `${Math.round((r.actual / r.budget) * 100)} %` : "—"}
                            </td>
                            <td className="p-3 text-right">
                              <span className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-xs ${st.cls}`}>
                                {st.text}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-muted/40 font-bold">
                        <td className="p-3">{T(d.expenses.total.label)}</td>
                        <td className={`p-3 text-right ${NUM}`}>{fmt(d.expenses.total.actual)}</td>
                        <td className={`p-3 text-right ${NUM}`}>{fmt(d.expenses.total.budget)}</td>
                        <td className={`p-3 text-right ${NUM} ${signClass(d.expenses.total.budget - d.expenses.total.actual)}`}>
                          {fmt(d.expenses.total.budget - d.expenses.total.actual)}
                        </td>
                        <td className={`p-3 text-right ${NUM}`}>
                          {Math.round((d.expenses.total.actual / d.expenses.total.budget) * 100)} %
                        </td>
                        <td className="p-3" />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============ BALANCE ============ */}
          <TabsContent value="balance" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {d.balance.cards.map((c, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{T(c.label)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-2xl font-bold ${NUM}`}>{fmt(c.value)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{T(c.note)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{T(d.balance.tableTitle)}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="p-3 text-left font-semibold text-muted-foreground">{T(L.account)}</th>
                        <th className="p-3 text-right font-semibold text-muted-foreground">{T(L.dec2025)}</th>
                        <th className="p-3 text-right font-semibold text-muted-foreground">{T(L.jun2026)}</th>
                        <th className="p-3 text-right font-semibold text-muted-foreground">{T(L.variance)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.balance.lines.map((r, i) => {
                        const diff = r.jun2026 - r.dec2025;
                        return (
                          <tr
                            key={i}
                            className={`border-b border-border/50 ${
                              r.emphasis === "total" ? "bg-muted/40 font-bold" : "hover:bg-muted/20"
                            }`}
                          >
                            <td className="p-3">{T(r.label)}</td>
                            <td className={`p-3 text-right ${NUM} ${r.dec2025 < 0 ? "text-destructive" : ""}`}>{fmt(r.dec2025)}</td>
                            <td className={`p-3 text-right ${NUM} ${r.jun2026 < 0 ? "text-destructive" : ""}`}>{fmt(r.jun2026)}</td>
                            <td className={`p-3 text-right ${NUM} ${signClass(diff)}`}>{fmt(diff)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{T(d.balance.cash.title)}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className={`text-2xl font-bold ${NUM}`}>{fmt(d.balance.cash.amount)}</p>
                    <p className="text-xs text-muted-foreground">{T(d.balance.cash.changeLabel)}</p>
                  </div>
                  <div className="flex h-6 w-full overflow-hidden rounded-md">
                    <div style={{ width: `${d.balance.cash.usdShare}%`, backgroundColor: "#0E3A5A" }} />
                    <div style={{ width: `${d.balance.cash.crcShare}%`, backgroundColor: "#A9C3D6" }} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{T(d.balance.cash.usdLabel)} · <strong className={NUM}>{d.balance.cash.usdShare} %</strong></span>
                    <span>{T(d.balance.cash.crcLabel)} · <strong className={NUM}>{d.balance.cash.crcShare} %</strong></span>
                  </div>
                  <Note text={T(d.balance.cash.note)} />
                  <Note tone="warn" text={T(d.balance.cash.warning)} />
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{T(d.balance.growth.title)}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm font-medium">{T(d.balance.growth.label)}</p>
                    <p className={`text-lg ${NUM}`}>
                      {fmt(d.balance.growth.from)} → <strong>{fmt(d.balance.growth.to)}</strong>{" "}
                      <span className="text-destructive">(+{d.balance.growth.pct} %)</span>
                    </p>
                    <p className="text-sm text-muted-foreground">{T(d.balance.growth.note)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{T(d.balance.coverage.title)}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className={`text-2xl font-bold ${NUM}`}>{d.balance.coverage.months}</p>
                    <p className="text-sm text-muted-foreground">{T(d.balance.coverage.note)}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ============ RESULTADOS ============ */}
          <TabsContent value="results" className="mt-6 space-y-6">
            <Note tone="warn" text={T(d.results.warning)} />

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{T(d.results.structural.title)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="p-3 text-left font-semibold text-muted-foreground">{T(L.line)}</th>
                        <th className="p-3 text-right font-semibold text-muted-foreground">{T(L.y2024)}</th>
                        <th className="p-3 text-right font-semibold text-muted-foreground">{T(L.y2025)}</th>
                        <th className="p-3 text-right font-semibold text-muted-foreground">{T(L.y2026h1)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.results.structural.rows.map((r, i) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="p-3">{T(r.label)}</td>
                          <td className={`p-3 text-right ${NUM}`}>{fmt(r.y2024)}</td>
                          <td className={`p-3 text-right ${NUM}`}>{fmt(r.y2025)}</td>
                          <td className={`p-3 text-right ${NUM}`}>{fmt(r.y2026h1)}</td>
                        </tr>
                      ))}
                      <tr className="border-b border-border/50 bg-muted/30 font-semibold">
                        <td className="p-3">{T(d.results.structural.shareRow.label)}</td>
                        <td className={`p-3 text-right ${NUM}`}>{d.results.structural.shareRow.y2024} %</td>
                        <td className={`p-3 text-right ${NUM}`}>{d.results.structural.shareRow.y2025} %</td>
                        <td className={`p-3 text-right ${NUM}`}>{d.results.structural.shareRow.y2026h1} %</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="p-4 pt-0">
                  <Note text={T(d.results.structural.note)} />
                </div>
              </CardContent>
            </Card>

            <ComparativeTable title={T(d.results.incomeTitle)} rows={d.results.incomeRows} />
            <Note tone="warn" text={T(d.results.incomeWarning)} />

            <ComparativeTable title={T(d.results.expenseTitle)} rows={d.results.expenseRows} />
            <Note tone="warn" text={T(d.results.expenseWarning)} />

            <ComparativeTable title={T(d.results.bridgeTitle)} rows={d.results.bridgeRows} />
            <Note text={T(d.results.bridgeNote)} />

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{T(d.results.focusTitle)}</CardTitle>
                <p className="text-sm text-muted-foreground">{T(d.results.focusSubtitle)}</p>
              </CardHeader>
              <CardContent className="space-y-4 p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      {d.results.focusRows.map((r, i) => (
                        <tr
                          key={i}
                          className={`border-b border-border/50 ${
                            r.emphasis === "total" ? "bg-muted/40 font-bold" : "hover:bg-muted/20"
                          }`}
                        >
                          <td className="p-3">{T(r.label)}</td>
                          <td className={`p-3 text-right ${NUM} ${r.value < 0 ? "text-destructive" : ""}`}>
                            {fmt(r.value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 pt-0">
                  <Note text={T(d.results.focusNote)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="pt-4 text-center text-xs text-muted-foreground">{T(d.meta.footer)}</p>
      </div>
    </div>
  );
};
