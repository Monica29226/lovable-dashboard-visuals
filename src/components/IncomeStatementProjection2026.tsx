import { useState } from "react";
import { ChevronDown, ChevronRight, Minus, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { projectionIncomeStatement2026, type ProjectionRow } from "@/data/financialData2026";

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"];

const fmt = (v: number | null): string => {
  if (v === null || v === 0) return "-";
  const abs = Math.abs(Math.round(v)).toLocaleString("en-US");
  return v < 0 ? `(${abs})` : abs;
};

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

const IncomeStatementProjection2026 = () => {
  const rows = projectionIncomeStatement2026;
  const [openIncome, setOpenIncome] = useState(true);
  const [openExpense, setOpenExpense] = useState(true);
  const [showRealMonths, setShowRealMonths] = useState(true);
  const [showProjMonths, setShowProjMonths] = useState(true);

  const realColSpan = showRealMonths ? 6 : 1;
  const projColSpan = showProjMonths ? 6 : 1;
  const totalCols = 1 + realColSpan + 1 + projColSpan + 4; // Cuenta + real + Acum + proj + (TotJulDic, TotProy, Presup, Var)

  const renderRow = (r: ProjectionRow, i: number, opts: { hideVariance?: boolean } = {}) => {
    const isTotal = r.section === "incomeTotal" || r.section === "expenseTotal" || r.section === "net";
    const real = r.values.slice(0, 6);
    const proj = r.values.slice(6, 12);
    const acumJun = sum(real);
    const totalJulDic = sum(proj);
    const totalProy = acumJun + totalJulDic;
    const isExpense = r.section === "expense" || r.section === "expenseTotal";
    const variance = isExpense ? r.budget - totalProy : totalProy - r.budget;

    const rowCls = isTotal
      ? "font-bold bg-muted/60 border-t-2 border-border"
      : "hover:bg-muted/30";

    return (
      <tr key={i} className={rowCls}>
        <td className={`border border-border px-2 py-1 sticky left-0 bg-background ${isTotal ? "font-bold bg-muted/60" : "pl-6"}`}>
          {r.label}
        </td>
        {showRealMonths
          ? real.map((v, idx) => (
              <td key={idx} className="border border-border px-2 py-1 text-right bg-primary/5">{fmt(v)}</td>
            ))
          : <td className="border border-border px-2 py-1 text-right bg-primary/5 text-muted-foreground">…</td>}
        <td className="border border-border px-2 py-1 text-right font-semibold bg-primary/15">{fmt(acumJun)}</td>
        {showProjMonths
          ? proj.map((v, idx) => (
              <td key={idx} className="border border-border px-2 py-1 text-right bg-accent/10">{fmt(v)}</td>
            ))
          : <td className="border border-border px-2 py-1 text-right bg-accent/10 text-muted-foreground">…</td>}
        <td className="border border-border px-2 py-1 text-right font-semibold bg-accent/20">{fmt(totalJulDic)}</td>
        <td className="border border-border px-2 py-1 text-right font-semibold bg-muted/50">{fmt(totalProy)}</td>
        <td className="border border-border px-2 py-1 text-right font-semibold">{fmt(r.budget)}</td>
        <td className="border border-border px-2 py-1 text-right font-semibold">
          {opts.hideVariance ? "" : fmt(variance)}
        </td>
      </tr>
    );
  };

  const incomeRows = rows.filter((r) => r.section === "income" || r.section === "incomeTotal");
  const expenseRows = rows.filter((r) => r.section === "expense" || r.section === "expenseTotal");
  const netRows = rows.filter((r) => r.section === "net");

  const GroupHeader = ({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) => (
    <tr className="bg-primary/10">
      <td className="border border-border px-2 py-1 font-bold" colSpan={totalCols}>
        <button
          onClick={onToggle}
          className="inline-flex items-center gap-1 hover:text-primary transition-colors"
          aria-expanded={open}
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {label}
        </button>
      </td>
    </tr>
  );

  const HeaderToggle = ({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
      aria-expanded={open}
      title={open ? `Colapsar meses de ${label}` : `Expandir meses de ${label}`}
    >
      {open ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Estado de Resultados con Proyección — 2026</h2>
        <p className="text-sm text-muted-foreground">
          Valores en US$ · Real Enero–Junio + Proyección Julio–Diciembre
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Detalle mensual</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="border border-border px-2 py-2 text-left sticky left-0 bg-primary z-10">Cuenta</th>
                  <th className="border border-border px-2 py-2 text-center bg-primary/90" colSpan={realColSpan}>
                    <HeaderToggle label="Real" open={showRealMonths} onToggle={() => setShowRealMonths((v) => !v)} />
                  </th>
                  <th className="border border-border px-2 py-2 text-center bg-primary">Acumulado</th>
                  <th className="border border-border px-2 py-2 text-center bg-primary/90" colSpan={projColSpan}>
                    <HeaderToggle label="Proyección" open={showProjMonths} onToggle={() => setShowProjMonths((v) => !v)} />
                  </th>
                  <th className="border border-border px-2 py-2 text-center bg-primary">Total Jul-Dic</th>
                  <th className="border border-border px-2 py-2 text-center bg-primary">Total Proyección</th>
                  <th className="border border-border px-2 py-2 text-center bg-primary">Presup. Original</th>
                  <th className="border border-border px-2 py-2 text-center bg-primary">Variación</th>
                </tr>
                <tr className="bg-muted text-foreground">
                  <th className="border border-border px-2 py-1 sticky left-0 bg-muted"></th>
                  {showRealMonths
                    ? MONTHS.slice(0, 6).map((m) => (
                        <th key={m} className="border border-border px-2 py-1 text-right">{m}</th>
                      ))
                    : <th className="border border-border px-2 py-1 text-right text-muted-foreground italic">Ene–Jun</th>}
                  <th className="border border-border px-2 py-1 text-right">Junio</th>
                  {showProjMonths
                    ? MONTHS.slice(6, 12).map((m) => (
                        <th key={m} className="border border-border px-2 py-1 text-right">{m}</th>
                      ))
                    : <th className="border border-border px-2 py-1 text-right text-muted-foreground italic">Jul–Dic</th>}
                  <th className="border border-border px-2 py-1"></th>
                  <th className="border border-border px-2 py-1"></th>
                  <th className="border border-border px-2 py-1"></th>
                  <th className="border border-border px-2 py-1"></th>
                </tr>
              </thead>
              <tbody>
                <GroupHeader label="Ingresos" open={openIncome} onToggle={() => setOpenIncome((v) => !v)} />
                {openIncome
                  ? incomeRows.map((r, i) => renderRow(r, i))
                  : incomeRows.filter((r) => r.section === "incomeTotal").map((r, i) => renderRow(r, i))}
                <GroupHeader label="Egresos" open={openExpense} onToggle={() => setOpenExpense((v) => !v)} />
                {openExpense
                  ? expenseRows.map((r, i) => renderRow(r, i))
                  : expenseRows.filter((r) => r.section === "expenseTotal").map((r, i) => renderRow(r, i))}
                {netRows.map((r, i) => renderRow(r, i, { hideVariance: true }))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IncomeStatementProjection2026;
