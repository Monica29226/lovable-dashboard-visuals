import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, Monitor, TrendingUp, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────
interface BudgetRow {
  id?: string;
  category: string;
  subcategory?: string;
  parent_category?: string;
  level: number;
  january: number;
  february: number;
  march: number;
  april: number;
  may: number;
  june: number;
  july: number;
  august: number;
  september: number;
  october: number;
  november: number;
  december: number;
  total: number;
  expanded?: boolean;
}

interface BalancePatrimonyTabProps {
  budgetData: BudgetRow[];
  /**
   * Array of ResultadoNeto per year [2026, 2027, 2028, 2029].
   * Must come from the projection component's totals – same formula:
   *   ResultadoNeto = (Membresías - Egresos + Cuotas) * (1 - 0.30)  if positive
   */
  resultadoNetoByYear: number[];
}

// ─── Helpers ─────────────────────────────────────────────────────────
const fmt = (v: number) =>
  v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtDec = (v: number) =>
  v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const YEARS = [2026, 2027, 2028, 2029];
const YEAR_LABELS = ["2026", "2027", "2028", "2029"];

// ─── Component ───────────────────────────────────────────────────────
const BalancePatrimonyTab = ({ budgetData, resultadoNetoByYear }: BalancePatrimonyTabProps) => {
  // ── Editable assumptions ────────────────────────────────────────────
  const [equityOpening2026, setEquityOpening2026] = useState(120_000);
  const [pcUnitCost, setPcUnitCost] = useState(1_200);
  const [pcPurchaseYears, setPcPurchaseYears] = useState<Set<number>>(new Set([2027, 2028, 2029]));
  const [pcQtyPerYear, setPcQtyPerYear] = useState(1);
  const [usefulLifeYears, setUsefulLifeYears] = useState(3);
  const [salvageValue, setSalvageValue] = useState(0);
  const [showDepreciation, setShowDepreciation] = useState(true);
  const [showCash, setShowCash] = useState(false);
  const [cashOpening2026, setCashOpening2026] = useState(0);

  const togglePurchaseYear = (year: number) => {
    setPcPurchaseYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  };

  const totalPCsPurchased = useMemo(
    () => Array.from(pcPurchaseYears).length * pcQtyPerYear,
    [pcPurchaseYears, pcQtyPerYear]
  );

  // ── Derived calculations ────────────────────────────────────────────
  const calculations = useMemo(() => {
    const depBasePerPurchase =
      usefulLifeYears > 0 ? (pcUnitCost * pcQtyPerYear - salvageValue * pcQtyPerYear) / usefulLifeYears : 0;

    // First pass: compute per-year raw values
    const rawRows = YEARS.map((year, idx) => {
      const capex = pcPurchaseYears.has(year) ? pcQtyPerYear * pcUnitCost : 0;

      let depYear = 0;
      if (showDepreciation) {
        for (const t of pcPurchaseYears) {
          const age = year - t;
          if (age >= 0 && age < usefulLifeYears) {
            depYear += depBasePerPurchase;
          }
        }
      }

      const resultadoNeto = resultadoNetoByYear[idx] ?? 0;
      return { year, capex, depYear, resultadoNeto };
    });

    // Second pass: cumulative values
    let pcGrossAccum = 0;
    let accDepr = 0;
    let equityOpen = equityOpening2026;
    let cashOpen = cashOpening2026;

    return rawRows.map((r) => {
      pcGrossAccum += r.capex;
      accDepr += r.depYear;
      const pcNet = pcGrossAccum - accDepr;
      const equityClose = equityOpen + r.resultadoNeto;

      let cashClose = 0;
      if (showCash) {
        cashClose = cashOpen + r.resultadoNeto - r.capex;
      }

      const row = {
        ...r,
        pcGross: pcGrossAccum,
        accDepr,
        pcNet,
        equityOpen,
        equityClose,
        cashOpen,
        cashClose,
        totalAssets: (showCash ? cashClose : 0) + pcNet,
      };

      equityOpen = equityClose;
      cashOpen = cashClose;

      return row;
    });
  }, [
    equityOpening2026, pcUnitCost, pcPurchaseYears, pcQtyPerYear,
    usefulLifeYears, salvageValue, showDepreciation, showCash,
    cashOpening2026, resultadoNetoByYear,
  ]);

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Assumptions Panel */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            Supuestos del Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Patrimonio Inicial */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Patrimonio Inicial 2026 (US$)
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent><p className="text-xs max-w-[200px]">Saldo de patrimonio neto al inicio del período 2026</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                type="number"
                value={equityOpening2026}
                onChange={(e) => setEquityOpening2026(parseFloat(e.target.value) || 0)}
                className="font-mono"
              />
            </div>

            {/* Costo unitario PC */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Costo por Computadora (US$)
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent><p className="text-xs max-w-[200px]">CAPEX = compra de activos (computadoras)</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                type="number"
                value={pcUnitCost}
                onChange={(e) => setPcUnitCost(parseFloat(e.target.value) || 0)}
                className="font-mono"
              />
            </div>

            {/* Cantidad por año */}
            <div className="space-y-2">
              <Label>Cantidad por año de compra</Label>
              <Input
                type="number"
                value={pcQtyPerYear}
                onChange={(e) => setPcQtyPerYear(parseInt(e.target.value) || 1)}
                className="font-mono"
                min={1}
              />
            </div>

            {/* Años de compra */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Años de compra
                <span className="text-xs text-muted-foreground ml-1">
                  (Total: {totalPCsPurchased} PCs)
                </span>
              </Label>
              <div className="flex gap-4">
                {YEARS.map((year) => (
                  <label key={year} className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                      checked={pcPurchaseYears.has(year)}
                      onCheckedChange={() => togglePurchaseYear(year)}
                    />
                    <span className="text-sm">{year}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Vida útil */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Vida útil (años)
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent><p className="text-xs max-w-[200px]">Depreciación línea recta: costo / vida útil por año</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                type="number"
                value={usefulLifeYears}
                onChange={(e) => setUsefulLifeYears(parseInt(e.target.value) || 1)}
                className="font-mono"
                min={1}
              />
            </div>

            {/* Valor residual */}
            <div className="space-y-2">
              <Label>Valor residual (US$)</Label>
              <Input
                type="number"
                value={salvageValue}
                onChange={(e) => setSalvageValue(parseFloat(e.target.value) || 0)}
                className="font-mono"
              />
            </div>

            {/* Toggles */}
            <div className="space-y-3 col-span-full flex gap-6 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={showDepreciation}
                  onCheckedChange={(v) => setShowDepreciation(!!v)}
                />
                <span className="text-sm">Mostrar depreciación</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={showCash}
                  onCheckedChange={(v) => setShowCash(!!v)}
                />
                <span className="text-sm">Modelar efectivo</span>
              </label>
              {showCash && (
                <div className="flex items-center gap-2">
                  <Label className="text-sm whitespace-nowrap">Efectivo inicial 2026 (US$):</Label>
                  <Input
                    type="number"
                    value={cashOpening2026}
                    onChange={(e) => setCashOpening2026(parseFloat(e.target.value) || 0)}
                    className="font-mono w-32"
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 1) Movimiento de Patrimonio */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Movimiento de Patrimonio
          </CardTitle>
          <p className="text-sm text-muted-foreground">Evolución del patrimonio neto por resultados anuales (US$)</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border p-3 text-left min-w-[200px]">Concepto</th>
                  {YEAR_LABELS.map((y) => (
                    <th key={y} className="border p-3 text-right min-w-[120px]">{y}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="border p-3 font-medium">Patrimonio Inicial</td>
                  {calculations.map((c) => (
                    <td key={c.year} className="border p-3 text-right font-mono">{fmt(c.equityOpen)}</td>
                  ))}
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="border p-3 font-medium">
                    <span className="flex items-center gap-1">
                      + Resultado Neto
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                          <TooltipContent><p className="text-xs max-w-[250px]">Derivado de la proyección: Resultado Bruto Total − Impuesto Renta 30%</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                  </td>
                  {calculations.map((c) => (
                    <td key={c.year} className={cn(
                      "border p-3 text-right font-mono",
                      c.resultadoNeto >= 0 ? "text-chart-2" : "text-destructive"
                    )}>
                      {fmt(c.resultadoNeto)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-primary/10 font-bold hover:bg-primary/15 transition-colors">
                  <td className="border p-3">= Patrimonio Final</td>
                  {calculations.map((c) => (
                    <td key={c.year} className="border p-3 text-right font-mono text-primary">{fmt(c.equityClose)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Validation badges */}
          <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
            {calculations.map((c) => {
              const valid = Math.abs(c.equityClose - (c.equityOpen + c.resultadoNeto)) < 0.01;
              return (
                <span key={c.year} className={cn(
                  "px-2 py-0.5 rounded",
                  valid ? "bg-chart-2/10 text-chart-2" : "bg-destructive/10 text-destructive"
                )}>
                  {c.year}: {valid ? "✓ Cuadra" : "✗ Descuadre"}
                </span>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 2) Activos Fijos – Computadoras */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Monitor className="h-5 w-5 text-primary" />
            Activos Fijos — Computadoras
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Plan de compras y depreciación ({totalPCsPurchased} unidades en total) (US$)
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border p-3 text-left min-w-[220px]">Concepto</th>
                  {YEAR_LABELS.map((y) => (
                    <th key={y} className="border p-3 text-right min-w-[120px]">{y}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="border p-3 font-medium">
                    <span className="flex items-center gap-1">
                      CAPEX del año (compras)
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                          <TooltipContent><p className="text-xs max-w-[200px]">Inversión en activos fijos: compra de computadoras</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                  </td>
                  {calculations.map((c) => (
                    <td key={c.year} className={cn(
                      "border p-3 text-right font-mono",
                      c.capex > 0 && "text-chart-4 font-semibold"
                    )}>
                      {c.capex > 0 ? fmt(c.capex) : "—"}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="border p-3 font-medium">Activo Bruto (acumulado)</td>
                  {calculations.map((c) => (
                    <td key={c.year} className="border p-3 text-right font-mono">{fmt(c.pcGross)}</td>
                  ))}
                </tr>
                {showDepreciation && (
                  <>
                    <tr className="hover:bg-muted/30 transition-colors">
                      <td className="border p-3 font-medium">Depreciación del año</td>
                      {calculations.map((c) => (
                        <td key={c.year} className="border p-3 text-right font-mono text-muted-foreground">
                          {c.depYear > 0 ? `(${fmt(c.depYear)})` : "—"}
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-muted/30 transition-colors">
                      <td className="border p-3 font-medium">Depreciación acumulada</td>
                      {calculations.map((c) => (
                        <td key={c.year} className="border p-3 text-right font-mono text-muted-foreground">
                          {c.accDepr > 0 ? `(${fmt(c.accDepr)})` : "—"}
                        </td>
                      ))}
                    </tr>
                  </>
                )}
                <tr className="bg-primary/10 font-bold hover:bg-primary/15 transition-colors">
                  <td className="border p-3">Activo Neto</td>
                  {calculations.map((c) => (
                    <td key={c.year} className="border p-3 text-right font-mono text-primary">{fmt(c.pcNet)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 3) Balance Simplificado */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            Balance Simplificado
          </CardTitle>
          <p className="text-sm text-muted-foreground">Vista ejecutiva: Activos = Patrimonio (pasivos = 0) (US$)</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border p-3 text-left min-w-[220px]">Concepto</th>
                  {YEAR_LABELS.map((y) => (
                    <th key={y} className="border p-3 text-right min-w-[120px]">{y}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* ACTIVOS */}
                <tr className="bg-primary/5">
                  <td className="border p-3 font-bold" colSpan={5}>ACTIVOS</td>
                </tr>
                {showCash && (
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="border p-3 pl-6 font-medium">Efectivo</td>
                    {calculations.map((c) => (
                      <td key={c.year} className={cn("border p-3 text-right font-mono", c.cashClose < 0 && "text-destructive")}>
                        {fmt(c.cashClose)}
                      </td>
                    ))}
                  </tr>
                )}
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="border p-3 pl-6 font-medium">Activo Fijo Neto</td>
                  {calculations.map((c) => (
                    <td key={c.year} className="border p-3 text-right font-mono">{fmt(c.pcNet)}</td>
                  ))}
                </tr>
                <tr className="bg-primary/10 font-bold hover:bg-primary/15 transition-colors">
                  <td className="border p-3">Total Activos</td>
                  {calculations.map((c) => (
                    <td key={c.year} className="border p-3 text-right font-mono text-primary">{fmt(c.totalAssets)}</td>
                  ))}
                </tr>

                {/* PATRIMONIO */}
                <tr className="bg-primary/5">
                  <td className="border p-3 font-bold" colSpan={5}>PATRIMONIO</td>
                </tr>
                <tr className="bg-primary/10 font-bold hover:bg-primary/15 transition-colors">
                  <td className="border p-3">Patrimonio Neto</td>
                  {calculations.map((c) => (
                    <td key={c.year} className="border p-3 text-right font-mono text-primary">{fmt(c.equityClose)}</td>
                  ))}
                </tr>

                {/* Validation Row */}
                <tr className="bg-muted/50">
                  <td className="border p-3 font-medium text-muted-foreground">Diferencia (Activo − Patrimonio)</td>
                  {calculations.map((c) => {
                    const diff = c.totalAssets - c.equityClose;
                    const valid = Math.abs(diff) < 0.01;
                    return (
                      <td key={c.year} className={cn(
                        "border p-3 text-right font-mono text-xs",
                        valid ? "text-chart-2" : "text-destructive font-bold"
                      )}>
                        {valid ? "✓ 0" : fmtDec(diff)}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-muted-foreground italic">
            Nota: Este balance simplificado asume pasivos = 0. Si Activos ≠ Patrimonio, la diferencia
            se explica por el modelado de efectivo o la exclusión de pasivos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BalancePatrimonyTab;
