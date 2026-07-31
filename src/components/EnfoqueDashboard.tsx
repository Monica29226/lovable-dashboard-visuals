import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ReferenceLine, LabelList,
} from "recharts";
import { AlertTriangle, Info, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const n = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.abs(Math.round(value)));
  return value < 0 ? `(${n})` : n;
};

const signClass = (v: number) =>
  v < 0 ? "text-destructive" : v > 0 ? "text-emerald-600" : "text-foreground";

export const EnfoqueDashboard = ({ companyName }: Props) => {
  const { language } = useLanguage();
  const [printMode, setPrintMode] = useState(false);
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

  /* ---------------- Impresión ---------------- */
  useEffect(() => {
    const onAfterPrint = () => setPrintMode(false);
    window.addEventListener("afterprint", onAfterPrint);
    return () => window.removeEventListener("afterprint", onAfterPrint);
  }, []);

  const handleExportPdf = useCallback(() => {
    setPrintMode(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.print());
    });
  }, []);

  const Section = ({
    value,
    title,
    children,
  }: {
    value: string;
    title: string;
    children: React.ReactNode;
  }) =>
    printMode ? (
      <section className="print-section mt-8 space-y-6">
        <div className="border-b pb-2">
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-xs text-muted-foreground">{T(d.meta.currencyNote)}</p>
        </div>
        {children}
      </section>
    ) : (
      <TabsContent value={value} className="mt-6 space-y-6">
        <p className="px-1 text-xs text-muted-foreground">{T(d.meta.currencyNote)}</p>
        {children}
      </TabsContent>
    );

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
    <div className="dashboard-sans min-h-screen bg-background">
      {/* Hero */}
      <div className="print-hero relative mb-6 w-full bg-ink">
        <div className="relative mx-auto flex max-w-[1600px] flex-col items-center justify-center gap-4 px-6 py-10 md:py-12">
          <img
            src={enfoqueLogo}
            alt={companyName}
            className="h-16 rounded-lg bg-paper object-contain p-2 shadow-md md:h-20"
          />
          <h1 className="text-center text-3xl text-paper md:text-4xl">{T(d.meta.title)}</h1>
          <p className="text-center text-xs text-paper/70">{T(d.meta.currencyNote)}</p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <Badge variant="outline" className="border-paper/20 bg-paper/10 text-paper/90">
              {T(d.meta.periodBadge)}
            </Badge>
            <Badge variant="outline" className="border-paper/20 bg-paper/10 text-paper/90">
              {T(d.meta.annualBudgetBadge)}
            </Badge>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleExportPdf}
              className="no-print h-7 gap-2 border-paper/30 bg-paper/10 text-paper hover:bg-paper/20 hover:text-paper"
            >
              <Printer className="h-3.5 w-3.5" />
              {T(d.meta.exportPdf)}
            </Button>
          </div>
          <div className="hidden print-doc-header text-center">
            <p className="text-sm font-semibold">{companyName}</p>
            <p className="text-sm">{T(d.meta.printPeriod)}</p>
            <p className="mt-1 text-xs">{T(d.meta.footer)}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] space-y-6 px-4 pb-12 md:px-6">
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className={`no-print grid h-auto w-full grid-cols-2 gap-1 bg-card p-1 shadow-sm md:grid-cols-5 ${printMode ? "hidden" : ""}`}>
            <TabsTrigger value="summary" className="py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{T(d.tabs.summary)}</TabsTrigger>
            <TabsTrigger value="income" className="py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{T(d.tabs.income)}</TabsTrigger>
            <TabsTrigger value="expenses" className="py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{T(d.tabs.expenses)}</TabsTrigger>
            <TabsTrigger value="balance" className="py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{T(d.tabs.balance)}</TabsTrigger>
            <TabsTrigger value="results" className="py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{T(d.tabs.results)}</TabsTrigger>
          </TabsList>

          {/* ============ RESUMEN ============ */}
          <Section value="summary" title={T(d.tabs.summary)}>
            {/* 1. El semestre en cinco cifras */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-semibold">{T(d.summary.fiveTitle)}</h3>
                <p className="text-xs text-muted-foreground">{T(d.summary.fivePeriod)}</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {d.summary.fiveCards.map((c, i) => (
                  <Card
                    key={i}
                    className={c.featured ? "border-transparent bg-[#0E3A5A] text-paper" : ""}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle
                        className={`text-sm font-medium ${
                          c.featured ? "text-paper/80" : "text-muted-foreground"
                        }`}
                      >
                        {T(c.label)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <p
                        className={`text-3xl font-bold ${NUM} ${
                          c.featured ? "text-paper" : signClass(c.value)
                        }`}
                      >
                        {fmt(c.value)}
                      </p>
                      <p
                        className={`text-xs leading-relaxed ${
                          c.featured ? "text-paper/70" : "text-muted-foreground"
                        }`}
                      >
                        {T(c.note)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
                <Card className="border-amber-500/40 bg-amber-500/10">
                  <CardContent className="flex h-full items-center p-5">
                    <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-200">
                      {T(d.summary.readingCard)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 2. Cascada */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{T(d.summary.waterfall.title)}</CardTitle>
                <p className="text-sm text-muted-foreground">{T(d.summary.waterfall.subtitle)}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {d.summary.waterfall.rows.map((r, i) => (
                    <div
                      key={i}
                      className={`grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,16rem)_1fr_auto] sm:gap-4 ${
                        r.emphasis === "total" ? "border-t pt-3" : ""
                      }`}
                    >
                      <div>
                        <p className={`text-sm ${r.emphasis === "total" ? "font-semibold" : ""}`}>
                          {T(r.label)}
                        </p>
                        <p className="text-xs text-muted-foreground">{T(r.detail)}</p>
                      </div>
                      <div className="relative h-3 w-full rounded-sm bg-muted">
                        <div
                          className="absolute top-0 h-3 rounded-sm"
                          style={{
                            left: `${r.offsetPct}%`,
                            width: `${r.widthPct}%`,
                            backgroundColor: BAR_COLOR[r.tone],
                          }}
                        />
                      </div>
                      <p
                        className={`text-right ${NUM} ${TEXT_TONE[r.tone]} ${
                          r.emphasis === "total" ? "text-xl font-bold" : "text-sm font-medium"
                        }`}
                      >
                        {fmt(r.value)}
                      </p>
                    </div>
                  ))}
                </div>
                <Note text={T(d.summary.waterfall.note)} />
              </CardContent>
            </Card>

            {/* 3. La operación mejora */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{T(d.summary.operatingTrend.title)}</CardTitle>
                <p className="text-sm text-muted-foreground">{T(d.summary.operatingTrend.subtitle)}</p>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <tbody>
                    {d.summary.operatingTrend.rows.map((r, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className={`p-3 ${r.strong ? "font-bold" : ""}`}>{T(r.label)}</td>
                        <td className={`p-3 text-right ${NUM} ${r.strong ? "font-bold" : ""} text-destructive`}>
                          {fmt(r.value)}
                        </td>
                        <td className="p-3 text-right">
                          {r.tag ? (
                            <span className="inline-block whitespace-nowrap rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700">
                              {T(r.tag)}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {T(d.summary.operatingTrend.emptyTag)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* 4. Ingresos por categoría */}
            <BulletBlock
              title={T(d.summary.incomeByCategory.title)}
              subtitle={T(d.summary.incomeByCategory.subtitle)}
              rows={d.summary.incomeByCategory.rows}
              total={d.summary.incomeByCategory.total}
              note={T(d.summary.incomeByCategory.note)}
              legend={{
                actual: T(d.summary.incomeByCategory.legendActual),
                budget: T(d.summary.incomeByCategory.legendBudget),
                noBudget: T(d.summary.incomeByCategory.legendNoBudget),
              }}
            />

            {/* 5. Gastos por categoría */}
            <BulletBlock
              title={T(d.summary.expenseByCategory.title)}
              subtitle={T(d.summary.expenseByCategory.subtitle)}
              rows={d.summary.expenseByCategory.rows}
              total={d.summary.expenseByCategory.total}
              note={T(d.summary.expenseByCategory.note)}
            />

          </Section>

          {/* ============ INGRESOS ============ */}
          <Section value="income" title={T(d.tabs.income)}>
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
          </Section>

          {/* ============ GASTOS ============ */}
          <Section value="expenses" title={T(d.tabs.expenses)}>
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
          </Section>

          {/* ============ BALANCE ============ */}
          <Section value="balance" title={T(d.tabs.balance)}>
            {/* 1. Dónde está el efectivo */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{T(d.balance.cashLocation.title)}</CardTitle>
                <p className="text-sm text-muted-foreground">{T(d.balance.cashLocation.subtitle)}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
                  <Donut
                    primaryPct={d.balance.cashLocation.investPct}
                    centerValue={d.balance.cashLocation.centerValue}
                    centerLabel={T(d.balance.cashLocation.centerLabel)}
                  />
                  <div className="flex-1 space-y-3">
                    {d.balance.cashLocation.legend.map((l, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <span
                          className="h-3 w-3 shrink-0 rounded-sm"
                          style={{ backgroundColor: i === 0 ? "#0E3A5A" : "#A9C3D6" }}
                        />
                        <span className="flex-1">{T(l.label)}</span>
                        <span className={`${NUM} font-semibold`}>{fmt(l.value)}</span>
                        <span className={`${NUM} w-16 text-right text-muted-foreground`}>
                          {l.share.toFixed(1)} %
                        </span>
                      </div>
                    ))}
                    <p className="border-t pt-3 text-sm text-muted-foreground">
                      {T(d.balance.cashLocation.currencyLine)}
                    </p>
                  </div>
                </div>
                <Note tone="warn" text={T(d.balance.cashLocation.warning)} />
              </CardContent>
            </Card>

            {/* 2. Patrimonio propio */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{T(d.balance.ownEquity.title)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className={`text-4xl font-bold ${NUM}`}>{d.balance.ownEquity.value}</p>
                <p className="text-sm text-muted-foreground">{T(d.balance.ownEquity.subtitle)}</p>
                <span className={`inline-block rounded-full border bg-muted/40 px-2.5 py-0.5 text-xs ${NUM}`}>
                  {T(d.balance.ownEquity.tag)}
                </span>
                <p className="text-sm text-muted-foreground">{T(d.balance.ownEquity.note)}</p>
              </CardContent>
            </Card>

            {/* 3. Composición del pasivo */}
            <BulletBlock
              title={T(d.balance.liabilityComposition.title)}
              subtitle={T(d.balance.liabilityComposition.subtitle)}
              rows={d.balance.liabilityComposition.rows}
              total={d.balance.liabilityComposition.total}
              note={T(d.balance.liabilityComposition.note)}
            />

            {/* 4. Qué cambió en el semestre */}
            <BulletBlock
              title={T(d.balance.liabilityChange.title)}
              subtitle={T(d.balance.liabilityChange.subtitle)}
              rows={d.balance.liabilityChange.rows}
              total={d.balance.liabilityChange.total}
              note={T(d.balance.liabilityChange.note)}
              showSign
            />

            {/* 5. Tabla comparativa de respaldo */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{T(d.balance.tableTitle)}</CardTitle>
                <p className="text-sm text-muted-foreground">{T(d.balance.tableSubtitle)}</p>
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

            <Note tone="warn" text={T(d.balance.tableWarning)} />

          </Section>

          {/* ============ RESULTADOS ============ */}
          <Section value="results" title={T(d.tabs.results)}>
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
          </Section>
        </Tabs>

        <p className="pt-4 text-center text-xs text-muted-foreground">{T(d.meta.footer)}</p>
      </div>
    </div>
  );
};
