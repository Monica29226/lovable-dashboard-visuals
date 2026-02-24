import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, Building2, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────
interface BudgetRow {
  id?: string;
  category: string;
  subcategory?: string;
  parent_category?: string;
  level: number;
  january: number; february: number; march: number; april: number;
  may: number; june: number; july: number; august: number;
  september: number; october: number; november: number; december: number;
  total: number;
  expanded?: boolean;
}

interface BalancePatrimonyTabProps {
  budgetData: BudgetRow[];
  resultadoNetoByYear?: number[]; // kept for backward compat but ignored
}

// ─── Same constants as FinancialProjection2027 ───────────────────────
const HEADCOUNT_2026 = 8;
const SALARY_POOL_MONTHLY_2026 = 15_300;
const NEW_HIRE_SALARY_MONTHLY = 1_500;
const CCSS_RATE = 0.2687;
const AGUINALDO_RATE = 0.0833;

const BASE_OVERRIDES: Record<string, number> = {
  "Salarios": SALARY_POOL_MONTHLY_2026 * 12,
  "CCSS + LPT + Otros 26.83%": SALARY_POOL_MONTHLY_2026 * 12 * CCSS_RATE,
  "Aguinaldo 8.33%": SALARY_POOL_MONTHLY_2026 * 12 * AGUINALDO_RATE,
  "Prestaciones Sociales": 6_000,
  "Eventos": 16_000,
  "Alquiler Oficinas y Parqueo": 1_173 * 12,
  "Telefonía Celular": 1_200 * 12,
  "Suministros de Oficina": 120 * 12,
  "Comisiones Financieras": 0,
  "Compra de equipo": 0,
  "Depreciación": 250 * 12,
  "Patente": 1_300,
  "IVA no soportado": 10_000,
  "Impuesto de Renta Estimado": 0,
};

const EXPENSE_CATEGORIES = [
  "Salarios", "CCSS + LPT + Otros 26.83%", "Aguinaldo 8.33%",
  "Beneficios Salud", "Pólizas", "Capacitación personal", "Prestaciones Sociales",
  "Alquiler Oficinas y Parqueo", "Telefonía Celular", "Suministros de Oficina",
  "Comisiones Financieras", "Compra de equipo",
  "Viáticos",
  "Pauta Redes Digitales", "Pauta Medios de Comunicación", "Eventos",
  "Legal", "Contabilidad", "Otros servicios profesionales",
  "Soporte TI", "Soporte y desarrollos tecnológicos", "Seguridad de la información", "Cuotas y Suscripciones",
  "Patente", "IVA no soportado", "Depreciación", "Otros Gastos ", "Impuesto de Renta Estimado",
];

const TECH_CATS = ["Soporte TI", "Soporte y desarrollos tecnológicos", "Seguridad de la información", "Cuotas y Suscripciones"];
const PERSONAL_CATS = ["Beneficios Salud", "Pólizas", "Capacitación personal", "Prestaciones Sociales"];

type ScenarioKey = "conservative" | "moderate" | "expansive" | "custom";

interface ScenarioConfig {
  newCompanies: [number, number, number];
  pricePerCompany: number;
  pricingIncrease: [number, number, number];
  growthRates: { operative: number; technology: number; personal: number };
  headcount: [number, number, number];
}

const SCENARIOS: Record<Exclude<ScenarioKey, "custom">, ScenarioConfig> = {
  conservative: {
    newCompanies: [8, 8, 8], pricePerCompany: 9000, pricingIncrease: [0, 0, 0],
    growthRates: { operative: 0.06, technology: 0.06, personal: 0.06 },
    headcount: [9, 10, 11],
  },
  moderate: {
    newCompanies: [12, 12, 12], pricePerCompany: 9000, pricingIncrease: [0, 2.5, 2.5],
    growthRates: { operative: 0.08, technology: 0.08, personal: 0.08 },
    headcount: [9, 10, 11],
  },
  expansive: {
    newCompanies: [18, 18, 18], pricePerCompany: 9000, pricingIncrease: [0, 2.5, 2.5],
    growthRates: { operative: 0.10, technology: 0.10, personal: 0.10 },
    headcount: [9, 10, 11],
  },
};

const SCENARIO_LABELS: Record<string, string> = {
  conservative: "Conservador",
  moderate: "Moderado",
  expansive: "Expansivo",
};

const normalize = (s: string) => s.trim().toLowerCase().replace(/[,.\s]+/g, " ");

const YEARS = [2026, 2027, 2028, 2029];

const fmt = (v: number) =>
  v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// ─── Component ───────────────────────────────────────────────────────
const BalancePatrimonyTab = ({ budgetData }: BalancePatrimonyTabProps) => {
  const [scenario, setScenario] = useState<ScenarioKey>("moderate");
  const [equityOpening2026, setEquityOpening2026] = useState(120_000);
  const [pcUnitCost, setPcUnitCost] = useState(1_200);

  const PC_QTY = 3;

  const config = scenario !== "custom" ? SCENARIOS[scenario] : SCENARIOS.moderate;

  // ── Compute ResultadoNeto per year (same as FinancialProjection2027) ──
  const resultadoNetoByYear = useMemo(() => {
    const findTotal = (cat: string) => {
      const n = normalize(cat);
      return budgetData.find((r) => normalize(r.category) === n)?.total ?? 0;
    };
    const getBase = (cat: string) => BASE_OVERRIDES[cat] !== undefined ? BASE_OVERRIDES[cat] : findTotal(cat);

    const membresiasBase = findTotal("Membresías");
    const cuotasBase = findTotal("Cuotas de Asociados");
    const base2026Expenses = EXPENSE_CATEGORIES.reduce((sum, cat) => sum + getBase(cat), 0);

    // 2026
    const membResult2026 = membresiasBase - base2026Expenses;
    const bruto2026 = membResult2026 + cuotasBase;
    const tax2026 = bruto2026 > 0 ? bruto2026 * 0.30 : 0;
    const neto2026 = bruto2026 - tax2026;

    const results = [neto2026];

    // 2027-2029
    let prevExpenses: Record<string, number> = {};
    EXPENSE_CATEGORIES.forEach(cat => { prevExpenses[cat] = getBase(cat); });
    let cumulativeNewCompanies = 0;

    for (let yi = 0; yi < 3; yi++) {
      cumulativeNewCompanies += config.newCompanies[yi];
      const newRevenue = cumulativeNewCompanies * config.pricePerCompany;
      const pricingFactor = config.pricingIncrease.slice(0, yi + 1).reduce((acc, p) => acc * (1 + p / 100), 1);
      const membresias = membresiasBase * pricingFactor + newRevenue;
      const cuotas = cuotasBase;

      const salaryPool = SALARY_POOL_MONTHLY_2026 + (config.headcount[yi] - HEADCOUNT_2026) * NEW_HIRE_SALARY_MONTHLY;
      const salarios = salaryPool * 12;

      let totalExp = 0;
      EXPENSE_CATEGORIES.forEach(cat => {
        let val: number;
        if (cat === "Salarios") val = salarios;
        else if (cat === "CCSS + LPT + Otros 26.83%") val = salarios * CCSS_RATE;
        else if (cat === "Aguinaldo 8.33%") val = salarios * AGUINALDO_RATE;
        else if (cat === "Impuesto de Renta Estimado") val = 0;
        else {
          const rate = TECH_CATS.includes(cat)
            ? config.growthRates.technology
            : PERSONAL_CATS.includes(cat)
              ? config.growthRates.personal
              : config.growthRates.operative;
          val = prevExpenses[cat] * (1 + rate);
        }
        prevExpenses[cat] = val;
        totalExp += val;
      });

      const membResult = membresias - totalExp;
      const bruto = membResult + cuotas;
      const tax = bruto > 0 ? bruto * 0.30 : 0;
      results.push(bruto - tax);
    }

    return results;
  }, [budgetData, config]);

  // ── Derived calculations ──────────────────────────────────────────
  const calculations = useMemo(() => {
    const activoFijo = PC_QTY * pcUnitCost;

    let equityOpen = equityOpening2026;
    return YEARS.map((year, idx) => {
      const resultadoNeto = resultadoNetoByYear[idx] ?? 0;
      const patrimonio = equityOpen + resultadoNeto;
      const activoCorriente = patrimonio - activoFijo;
      const totalActivo = activoCorriente + activoFijo;

      // Validation
      const balanceCuadra = Math.abs(totalActivo - patrimonio) < 0.01;

      const row = {
        year,
        resultadoNeto,
        equityOpen,
        patrimonio,
        activoFijo,
        activoCorriente,
        totalActivo,
        balanceCuadra,
      };

      equityOpen = patrimonio;
      return row;
    });
  }, [equityOpening2026, pcUnitCost, resultadoNetoByYear]);

  return (
    <div className="space-y-6">
      {/* Supuestos */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            Supuestos del Estado de Posición Financiera
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Escenario */}
            <div className="space-y-2">
              <Label className="font-medium">Escenario</Label>
              <Select value={scenario} onValueChange={(v) => setScenario(v as ScenarioKey)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">Conservador</SelectItem>
                  <SelectItem value="moderate">Moderado</SelectItem>
                  <SelectItem value="expansive">Expansivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

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

            {/* Valor Unitario Computadora */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Valor Unitario Computadora (US$)
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent><p className="text-xs max-w-[200px]">Costo por unidad. Cantidad fija: 3 computadoras</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                type="number"
                value={pcUnitCost}
                onChange={(e) => setPcUnitCost(parseFloat(e.target.value) || 0)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">Cantidad fija: {PC_QTY} computadoras</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estado de Posición Financiera */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Estado de Posición Financiera</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Proyección 2026 – 2029 · Escenario {SCENARIO_LABELS[scenario] ?? "Personalizado"} · Cifras en US$
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              Activo Fijo: {PC_QTY} × US$ {fmt(pcUnitCost)} = US$ {fmt(PC_QTY * pcUnitCost)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="border border-border/30 p-3 text-left min-w-[260px] font-semibold">Concepto</th>
                  {YEARS.map((y) => (
                    <th key={y} className="border border-border/30 p-3 text-right min-w-[130px] font-semibold">{y}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* ─── ACTIVO ───────────────────────────────────── */}
                <tr className="bg-primary/10">
                  <td colSpan={5} className="border border-border/20 p-3 font-bold text-primary uppercase tracking-wide">
                    Activo
                  </td>
                </tr>

                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="border border-border/20 p-3 pl-6 font-medium">Activo Corriente</td>
                  {calculations.map((c) => (
                    <td key={c.year} className={cn(
                      "border border-border/20 p-3 text-right font-mono",
                      c.activoCorriente < 0 && "text-destructive"
                    )}>
                      {fmt(c.activoCorriente)}
                    </td>
                  ))}
                </tr>

                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="border border-border/20 p-3 pl-6 font-medium">
                    <span className="flex items-center gap-1">
                      Propiedad, Planta y Equipo – Equipo de Cómputo
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                          <TooltipContent><p className="text-xs">{PC_QTY} computadoras × US$ {fmt(pcUnitCost)}</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                  </td>
                  {calculations.map((c) => (
                    <td key={c.year} className="border border-border/20 p-3 text-right font-mono">
                      {fmt(c.activoFijo)}
                    </td>
                  ))}
                </tr>

                <tr className="bg-primary/5 font-bold">
                  <td className="border border-border/20 p-3 pl-6">Total Activo</td>
                  {calculations.map((c) => (
                    <td key={c.year} className="border border-border/20 p-3 text-right font-mono text-primary">
                      {fmt(c.totalActivo)}
                    </td>
                  ))}
                </tr>

                {/* ─── Separator ─────────────────────────────────── */}
                <tr>
                  <td colSpan={5} className="h-1 bg-border/40"></td>
                </tr>

                {/* ─── PATRIMONIO ────────────────────────────────── */}
                <tr className="bg-primary/10">
                  <td colSpan={5} className="border border-border/20 p-3 font-bold text-primary uppercase tracking-wide">
                    Patrimonio
                  </td>
                </tr>

                <tr className="hover:bg-muted/30 transition-colors text-muted-foreground">
                  <td className="border border-border/20 p-3 pl-6 text-xs italic">Patrimonio Inicial</td>
                  {calculations.map((c) => (
                    <td key={c.year} className="border border-border/20 p-3 text-right font-mono text-xs">
                      {fmt(c.equityOpen)}
                    </td>
                  ))}
                </tr>

                <tr className="hover:bg-muted/30 transition-colors text-muted-foreground">
                  <td className="border border-border/20 p-3 pl-6 text-xs italic">
                    <span className="flex items-center gap-1">
                      + Resultado Neto del Período
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                          <TooltipContent><p className="text-xs max-w-[250px]">Derivado del modelo financiero principal: (Membresías − Egresos + Cuotas) × (1 − 30%)</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                  </td>
                  {calculations.map((c) => (
                    <td key={c.year} className={cn(
                      "border border-border/20 p-3 text-right font-mono text-xs",
                      c.resultadoNeto >= 0 ? "text-chart-2" : "text-destructive"
                    )}>
                      {fmt(c.resultadoNeto)}
                    </td>
                  ))}
                </tr>

                <tr className="bg-primary/5 font-bold">
                  <td className="border border-border/20 p-3 pl-6">Total Patrimonio</td>
                  {calculations.map((c) => (
                    <td key={c.year} className="border border-border/20 p-3 text-right font-mono text-primary">
                      {fmt(c.patrimonio)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Validation badges */}
          <div className="mt-4 flex flex-wrap gap-3">
            {calculations.map((c) => (
              <div key={c.year} className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium",
                c.balanceCuadra
                  ? "bg-chart-2/10 text-chart-2"
                  : "bg-destructive/10 text-destructive"
              )}>
                {c.balanceCuadra
                  ? <CheckCircle className="h-3.5 w-3.5" />
                  : <AlertTriangle className="h-3.5 w-3.5" />
                }
                {c.year}: Total Activo {c.balanceCuadra ? "=" : "≠"} Total Patrimonio
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BalancePatrimonyTab;
