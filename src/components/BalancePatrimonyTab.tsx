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
import { Info, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────
interface BudgetRow {
  category: string;
  total: number;
  level: number;
}

interface BalancePatrimonyTabProps {
  budgetData: BudgetRow[];
}

// ─── Shared constants (same as FinancialProjection2027) ──────────────
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
  "Comisiones Financieras", "Compra de equipo", "Viáticos",
  "Pauta Redes Digitales", "Pauta Medios de Comunicación", "Eventos",
  "Legal", "Contabilidad", "Otros servicios profesionales",
  "Soporte TI", "Soporte y desarrollos tecnológicos", "Seguridad de la información", "Cuotas y Suscripciones",
  "Patente", "IVA no soportado", "Depreciación", "Otros Gastos ", "Impuesto de Renta Estimado",
];

const TECH_CATS = ["Soporte TI", "Soporte y desarrollos tecnológicos", "Seguridad de la información", "Cuotas y Suscripciones"];
const PERSONAL_CATS = ["Beneficios Salud", "Pólizas", "Capacitación personal", "Prestaciones Sociales"];

type ScenarioKey = "conservative" | "moderate" | "expansive";

interface ScenarioConfig {
  newCompanies: [number, number, number];
  pricePerCompany: number;
  pricingIncrease: [number, number, number];
  growthRates: { operative: number; technology: number; personal: number };
  headcount: [number, number, number];
}

const SCENARIOS: Record<ScenarioKey, ScenarioConfig> = {
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

const SCENARIO_LABELS: Record<ScenarioKey, string> = {
  conservative: "Conservador",
  moderate: "Moderado",
  expansive: "Expansivo",
};

const normalize = (s: string) => s.trim().toLowerCase().replace(/[,.\s]+/g, " ");
const YEARS = [2026, 2027, 2028, 2029];
const fmt = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const PC_INITIAL_COST = 10_000; // inversión inicial 2026
const PC_ANNUAL_ADD = 1_500; // 1 computadora nueva por año

// ─── Component ───────────────────────────────────────────────────────
const BalancePatrimonyTab = ({ budgetData }: BalancePatrimonyTabProps) => {
  const [scenario, setScenario] = useState<ScenarioKey>("moderate");
  const [equityOpening2026, setEquityOpening2026] = useState(120_000);
  const [pcInitialCost, setPcInitialCost] = useState(PC_INITIAL_COST);
  const [pcAnnualAdd, setPcAnnualAdd] = useState(PC_ANNUAL_ADD);

  const config = SCENARIOS[scenario];

  // ── Resultado Neto por año (derivado del modelo financiero principal) ──
  const resultadoNetoByYear = useMemo(() => {
    const findTotal = (cat: string) => {
      const n = normalize(cat);
      return budgetData.find((r) => normalize(r.category) === n)?.total ?? 0;
    };
    const getBase = (cat: string) => BASE_OVERRIDES[cat] !== undefined ? BASE_OVERRIDES[cat] : findTotal(cat);

    const membresiasBase = findTotal("Membresías");
    const cuotasBase = findTotal("Cuotas de Asociados");
    const base2026Expenses = EXPENSE_CATEGORIES.reduce((sum, cat) => sum + getBase(cat), 0);

    const bruto2026 = (membresiasBase - base2026Expenses) + cuotasBase;
    const results = [bruto2026 - (bruto2026 > 0 ? bruto2026 * 0.30 : 0)];

    let prevExpenses: Record<string, number> = {};
    EXPENSE_CATEGORIES.forEach(cat => { prevExpenses[cat] = getBase(cat); });
    let cumulativeNewCompanies = 0;

    for (let yi = 0; yi < 3; yi++) {
      cumulativeNewCompanies += config.newCompanies[yi];
      const pricingFactor = config.pricingIncrease.slice(0, yi + 1).reduce((acc, p) => acc * (1 + p / 100), 1);
      const membresias = membresiasBase * pricingFactor + cumulativeNewCompanies * config.pricePerCompany;

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
          const rate = TECH_CATS.includes(cat) ? config.growthRates.technology
            : PERSONAL_CATS.includes(cat) ? config.growthRates.personal
            : config.growthRates.operative;
          val = prevExpenses[cat] * (1 + rate);
        }
        prevExpenses[cat] = val;
        totalExp += val;
      });

      const bruto = (membresias - totalExp) + cuotasBase;
      results.push(bruto - (bruto > 0 ? bruto * 0.30 : 0));
    }
    return results;
  }, [budgetData, config]);

  // ── Estado de Posición Financiera ─────────────────────────────────
  const rows = useMemo(() => {
    let equityOpen = equityOpening2026;

    return YEARS.map((year, idx) => {
      // Activo Fijo: inversión inicial + 1 computadora nueva por año adicional
      const activoFijo = pcInitialCost + idx * pcAnnualAdd;
      const resultadoNeto = resultadoNetoByYear[idx] ?? 0;
      const patrimonio = equityOpen + resultadoNeto;
      const activoCorriente = patrimonio - activoFijo;
      const totalActivo = activoCorriente + activoFijo;
      const balanceCuadra = Math.abs(totalActivo - patrimonio) < 0.01;

      const row = { year, resultadoNeto, equityOpen, patrimonio, activoFijo, activoCorriente, totalActivo, balanceCuadra };
      equityOpen = patrimonio;
      return row;
    });
  }, [equityOpening2026, pcInitialCost, pcAnnualAdd, resultadoNetoByYear]);

  return (
    <div className="space-y-6">
      {/* ── Supuestos ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Supuestos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Escenario</Label>
              <Select value={scenario} onValueChange={(v) => setScenario(v as ScenarioKey)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(SCENARIOS) as ScenarioKey[]).map(k => (
                    <SelectItem key={k} value={k}>{SCENARIO_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                Patrimonio Inicial 2026 (US$)
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent><p className="text-xs">Saldo de patrimonio neto al inicio del período</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input type="number" value={equityOpening2026} onChange={(e) => setEquityOpening2026(parseFloat(e.target.value) || 0)} className="h-9 font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Inversión Inicial Equipo de Cómputo 2026 (US$)</Label>
              <Input type="number" value={pcInitialCost} onChange={(e) => setPcInitialCost(parseFloat(e.target.value) || 0)} className="h-9 font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Costo Computadora Nueva / Año (US$)</Label>
              <Input type="number" value={pcAnnualAdd} onChange={(e) => setPcAnnualAdd(parseFloat(e.target.value) || 0)} className="h-9 font-mono text-sm" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Estado de Posición Financiera ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-lg font-bold">Estado de Posición Financiera</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Proyección 2026 – 2029 · Escenario {SCENARIO_LABELS[scenario]} · Cifras en US$
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono">
              2026: ${fmt(pcInitialCost)} · +${fmt(pcAnnualAdd)}/año
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="border border-border/20 px-4 py-2.5 text-left min-w-[280px] font-semibold text-xs uppercase tracking-wider">Concepto</th>
                  {YEARS.map(y => (
                    <th key={y} className="border border-border/20 px-4 py-2.5 text-right min-w-[120px] font-semibold">{y}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* ACTIVO */}
                <tr className="bg-primary/10">
                  <td colSpan={5} className="px-4 py-2 font-bold text-primary text-xs uppercase tracking-widest">Activo</td>
                </tr>
                <tr className="hover:bg-muted/30">
                  <td className="border-x border-border/10 px-4 py-2 pl-8">Activo Corriente</td>
                  {rows.map(r => (
                    <td key={r.year} className={cn("border-x border-border/10 px-4 py-2 text-right font-mono", r.activoCorriente < 0 && "text-destructive")}>
                      {fmt(r.activoCorriente)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-muted/30">
                  <td className="border-x border-border/10 px-4 py-2 pl-8">
                    <span className="flex items-center gap-1">
                      Propiedad, Planta y Equipo – Equipo de Cómputo
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                          <TooltipContent><p className="text-xs">Inversión inicial ${fmt(pcInitialCost)} + ${fmt(pcAnnualAdd)}/año</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                  </td>
                  {rows.map(r => (
                    <td key={r.year} className="border-x border-border/10 px-4 py-2 text-right font-mono">{fmt(r.activoFijo)}</td>
                  ))}
                </tr>
                <tr className="bg-primary/5 font-semibold border-t border-border/30">
                  <td className="px-4 py-2.5 pl-8">Total Activo</td>
                  {rows.map(r => (
                    <td key={r.year} className="px-4 py-2.5 text-right font-mono text-primary">{fmt(r.totalActivo)}</td>
                  ))}
                </tr>

                {/* Separator */}
                <tr><td colSpan={5} className="h-px bg-border/50" /></tr>

                {/* PATRIMONIO */}
                <tr className="bg-primary/10">
                  <td colSpan={5} className="px-4 py-2 font-bold text-primary text-xs uppercase tracking-widest">Patrimonio</td>
                </tr>
                <tr className="hover:bg-muted/30 text-muted-foreground">
                  <td className="border-x border-border/10 px-4 py-1.5 pl-8 text-xs italic">Patrimonio Inicial</td>
                  {rows.map(r => (
                    <td key={r.year} className="border-x border-border/10 px-4 py-1.5 text-right font-mono text-xs">{fmt(r.equityOpen)}</td>
                  ))}
                </tr>
                <tr className="hover:bg-muted/30 text-muted-foreground">
                  <td className="border-x border-border/10 px-4 py-1.5 pl-8 text-xs italic">
                    <span className="flex items-center gap-1">
                      + Resultado Neto del Período
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                          <TooltipContent><p className="text-xs max-w-[220px]">Derivado del modelo financiero: (Membresías − Egresos + Cuotas) × (1 − 30%)</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                  </td>
                  {rows.map(r => (
                    <td key={r.year} className={cn("border-x border-border/10 px-4 py-1.5 text-right font-mono text-xs", r.resultadoNeto >= 0 ? "text-chart-2" : "text-destructive")}>
                      {fmt(r.resultadoNeto)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-primary/5 font-semibold border-t border-border/30">
                  <td className="px-4 py-2.5 pl-8">Total Patrimonio</td>
                  {rows.map(r => (
                    <td key={r.year} className="px-4 py-2.5 text-right font-mono text-primary">{fmt(r.patrimonio)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Validation */}
          <div className="px-4 py-3 flex flex-wrap gap-2 border-t border-border/20">
            {rows.map(r => (
              <div key={r.year} className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium",
                r.balanceCuadra ? "bg-chart-2/10 text-chart-2" : "bg-destructive/10 text-destructive"
              )}>
                {r.balanceCuadra ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                {r.year}: Activo {r.balanceCuadra ? "=" : "≠"} Patrimonio
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BalancePatrimonyTab;
