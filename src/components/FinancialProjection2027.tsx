import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FileSpreadsheet, TrendingUp, TrendingDown, DollarSign, Percent, Pencil, RotateCcw } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend } from "recharts";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

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

interface FinancialProjection2027Props {
  budgetData: BudgetRow[];
}

interface CategoryRow {
  category: string;
  parentCategory?: string;
  level: number;
  base2026: number;
  growthGroup: "income" | "personal" | "technology" | "operative";
}

interface GrowthAssumptions {
  income: [number, number, number];
  personal: [number, number, number];
  operative: [number, number, number];
  technology: [number, number, number];
}

type ScenarioKey = "conservative" | "moderate" | "expansive" | "custom";

// ─── Scenarios ───────────────────────────────────────────────────────
const SCENARIOS: Record<Exclude<ScenarioKey, "custom">, GrowthAssumptions> = {
  conservative: { income: [8, 8, 8], personal: [6, 6, 6], operative: [6, 6, 6], technology: [6, 6, 6] },
  moderate: { income: [12, 12, 12], personal: [8, 8, 8], operative: [8, 8, 8], technology: [8, 8, 8] },
  expansive: { income: [18, 18, 18], personal: [10, 10, 10], operative: [10, 10, 10], technology: [10, 10, 10] },
};

// ─── Category-to-growthGroup mapping ─────────────────────────────────
const GROWTH_GROUP_MAP: Record<string, "income" | "personal" | "technology" | "operative"> = {
  "Cuotas de Asociados": "income",
  "Membresías": "income",
  "Personal": "personal",
  "Salarios": "personal",
  "CCSS + LPT + Otros 26.67%": "personal",
  "Aguinaldo 8.33%": "personal",
  "Beneficios Salud": "personal",
  "Pólizas": "personal",
  "Capacitación personal": "personal",
  "Prestaciones Sociales": "personal",
  "Tecnología": "technology",
  "Soporte TI": "technology",
  "Soporte y desarrollos tecnológicos": "technology",
  "Seguridad de la información": "technology",
  "Cuotas y Suscripciones": "technology",
};

// Normalize category names for matching
const normalize = (s: string) => s.trim().toLowerCase().replace(/[,.\s]+/g, " ");

const findBudgetTotal = (budgetData: BudgetRow[], category: string): number => {
  const norm = normalize(category);
  const match = budgetData.find((r) => normalize(r.category) === norm);
  return match?.total ?? 0;
};

// ─── Build structure from live budget data ───────────────────────────
const STRUCTURE_TEMPLATE: { category: string; parentCategory?: string; level: number; defaultGrowthGroup: "income" | "personal" | "technology" | "operative" }[] = [
  { category: "INGRESOS", level: 0, defaultGrowthGroup: "income" },
  { category: "Cuotas de Asociados", parentCategory: "INGRESOS", level: 1, defaultGrowthGroup: "income" },
  { category: "Membresías", parentCategory: "INGRESOS", level: 1, defaultGrowthGroup: "income" },
  { category: "EGRESOS", level: 0, defaultGrowthGroup: "operative" },
  { category: "Personal", parentCategory: "EGRESOS", level: 1, defaultGrowthGroup: "personal" },
  { category: "Salarios", parentCategory: "Personal", level: 2, defaultGrowthGroup: "personal" },
  { category: "CCSS + LPT + Otros 26.67%", parentCategory: "Personal", level: 2, defaultGrowthGroup: "personal" },
  { category: "Aguinaldo 8.33%", parentCategory: "Personal", level: 2, defaultGrowthGroup: "personal" },
  { category: "Beneficios Salud", parentCategory: "Personal", level: 2, defaultGrowthGroup: "personal" },
  { category: "Pólizas", parentCategory: "Personal", level: 2, defaultGrowthGroup: "personal" },
  { category: "Capacitación personal", parentCategory: "Personal", level: 2, defaultGrowthGroup: "personal" },
  { category: "Prestaciones Sociales", parentCategory: "Personal", level: 2, defaultGrowthGroup: "personal" },
  { category: "Gastos Administrativos", parentCategory: "EGRESOS", level: 1, defaultGrowthGroup: "operative" },
  { category: "Alquiler Oficinas y Parqueo", parentCategory: "Gastos Administrativos", level: 2, defaultGrowthGroup: "operative" },
  { category: "Telefonía Celular", parentCategory: "Gastos Administrativos", level: 2, defaultGrowthGroup: "operative" },
  { category: "Suministros de Oficina", parentCategory: "Gastos Administrativos", level: 2, defaultGrowthGroup: "operative" },
  { category: "Comisiones Financieras", parentCategory: "Gastos Administrativos", level: 2, defaultGrowthGroup: "operative" },
  { category: "Compra de equipo", parentCategory: "Gastos Administrativos", level: 2, defaultGrowthGroup: "operative" },
  { category: "Viáticos y Giras", parentCategory: "EGRESOS", level: 1, defaultGrowthGroup: "operative" },
  { category: "Viáticos", parentCategory: "Viáticos y Giras", level: 2, defaultGrowthGroup: "operative" },
  { category: "Comunicación y Mercadeo", parentCategory: "EGRESOS", level: 1, defaultGrowthGroup: "operative" },
  { category: "Pauta Redes Digitales", parentCategory: "Comunicación y Mercadeo", level: 2, defaultGrowthGroup: "operative" },
  { category: "Pauta Medios de Comunicación", parentCategory: "Comunicación y Mercadeo", level: 2, defaultGrowthGroup: "operative" },
  { category: "Eventos", parentCategory: "Comunicación y Mercadeo", level: 2, defaultGrowthGroup: "operative" },
  { category: "Servicios Profesionales", parentCategory: "EGRESOS", level: 1, defaultGrowthGroup: "operative" },
  { category: "Legal", parentCategory: "Servicios Profesionales", level: 2, defaultGrowthGroup: "operative" },
  { category: "Contabilidad", parentCategory: "Servicios Profesionales", level: 2, defaultGrowthGroup: "operative" },
  { category: "Otros servicios profesionales", parentCategory: "Servicios Profesionales", level: 2, defaultGrowthGroup: "operative" },
  { category: "Tecnología", parentCategory: "EGRESOS", level: 1, defaultGrowthGroup: "technology" },
  { category: "Soporte TI", parentCategory: "Tecnología", level: 2, defaultGrowthGroup: "technology" },
  { category: "Soporte y desarrollos tecnológicos", parentCategory: "Tecnología", level: 2, defaultGrowthGroup: "technology" },
  { category: "Seguridad de la información", parentCategory: "Tecnología", level: 2, defaultGrowthGroup: "technology" },
  { category: "Cuotas y Suscripciones", parentCategory: "Tecnología", level: 2, defaultGrowthGroup: "technology" },
  { category: "Otros Gastos", parentCategory: "EGRESOS", level: 1, defaultGrowthGroup: "operative" },
  { category: "Patente", parentCategory: "Otros Gastos", level: 2, defaultGrowthGroup: "operative" },
  { category: "IVA no soportado", parentCategory: "Otros Gastos", level: 2, defaultGrowthGroup: "operative" },
  { category: "Depreciación", parentCategory: "Otros Gastos", level: 2, defaultGrowthGroup: "operative" },
  { category: "Otros Gastos ", parentCategory: "Otros Gastos", level: 2, defaultGrowthGroup: "operative" },
  { category: "Impuesto de Renta Estimado", parentCategory: "Otros Gastos", level: 2, defaultGrowthGroup: "operative" },
];

const buildStructureFromBudget = (budgetData: BudgetRow[]): CategoryRow[] => {
  return STRUCTURE_TEMPLATE.map((t) => {
    // For leaf rows, scan the budget data for the matching total
    let base2026 = 0;
    if (t.level >= 1) {
      base2026 = findBudgetTotal(budgetData, t.category);
    }
    return {
      category: t.category,
      parentCategory: t.parentCategory,
      level: t.level,
      base2026,
      growthGroup: GROWTH_GROUP_MAP[t.category] ?? t.defaultGrowthGroup,
    };
  });
};

// ─── Helpers ─────────────────────────────────────────────────────────
const fmt = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtDec = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (v: number) => `${v.toFixed(1)}%`;

// ─── Editable Cell ───────────────────────────────────────────────────
interface EditableCellProps {
  value: number;
  onChange: (v: number) => void;
  isOverridden?: boolean;
  onReset?: () => void;
  disabled?: boolean;
  className?: string;
}

const EditableCell = ({ value, onChange, isOverridden, onReset, disabled, className }: EditableCellProps) => {
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState("");

  const handleDoubleClick = () => {
    if (disabled) return;
    setEditing(true);
    setTempValue(value.toFixed(2));
  };

  const commit = () => {
    setEditing(false);
    const parsed = parseFloat(tempValue.replace(/,/g, ""));
    if (!isNaN(parsed)) onChange(parsed);
  };

  if (editing) {
    return (
      <Input
        autoFocus
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className="h-7 text-right font-mono text-sm px-1 w-full"
      />
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "relative group cursor-pointer select-none text-right font-mono px-2 py-1 rounded transition-colors",
          !disabled && "hover:bg-accent/40",
          isOverridden && "bg-amber-50 dark:bg-amber-950/20",
          className
        )}
        onDoubleClick={handleDoubleClick}
      >
        {fmtDec(value)}
        {!disabled && !isOverridden && (
          <Pencil className="absolute right-0.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity" />
        )}
        {isOverridden && onReset && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => { e.stopPropagation(); onReset(); }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <RotateCcw className="h-2.5 w-2.5 text-white" />
              </button>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs">Restaurar valor calculado</p></TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};

// ─── Main Component ──────────────────────────────────────────────────
const FinancialProjection2027 = ({ budgetData }: FinancialProjection2027Props) => {
  const structure = useMemo(() => buildStructureFromBudget(budgetData), [budgetData]);

  const [scenario, setScenario] = useState<ScenarioKey>("moderate");
  const [assumptions, setAssumptions] = useState<GrowthAssumptions>(SCENARIOS.moderate);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [drillDown, setDrillDown] = useState<{ year: string; yearIdx: number } | null>(null);

  const handleScenarioChange = useCallback((key: ScenarioKey) => {
    setScenario(key);
    if (key !== "custom") {
      setAssumptions(SCENARIOS[key]);
      setOverrides({}); // reset overrides on scenario change
    }
  }, []);

  const updateAssumption = useCallback(
    (group: keyof GrowthAssumptions, yearIdx: number, value: number) => {
      setScenario("custom");
      setAssumptions((prev) => {
        const arr = [...prev[group]] as [number, number, number];
        arr[yearIdx] = value;
        return { ...prev, [group]: arr };
      });
    },
    []
  );

  const setOverride = useCallback((rowIdx: number, yearIdx: number, value: number) => {
    const key = `${rowIdx}-${yearIdx}`;
    setOverrides((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearOverride = useCallback((rowIdx: number, yearIdx: number) => {
    const key = `${rowIdx}-${yearIdx}`;
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  // ── Compute projected values with overrides ───────────────────────
  const projected = useMemo(() => {
    const result: { category: string; level: number; parentCategory?: string; values: number[] }[] = [];

    for (let ri = 0; ri < structure.length; ri++) {
      const row = structure[ri];
      if (row.level === 2) {
        const vals: number[] = [];
        let prev = row.base2026;
        for (let yi = 0; yi < 3; yi++) {
          const overrideKey = `${ri}-${yi}`;
          if (overrides[overrideKey] !== undefined) {
            vals.push(overrides[overrideKey]);
            prev = overrides[overrideKey]; // chain from override
          } else {
            const rate = assumptions[row.growthGroup][yi] / 100;
            const next = prev * (1 + rate);
            vals.push(next);
            prev = next;
          }
        }
        result.push({ category: row.category, level: row.level, parentCategory: row.parentCategory, values: vals });
      } else if (row.level === 1 && !structure.some((c) => c.parentCategory === row.category && c.level === 2)) {
        // Level 1 leaf (income items like Cuotas, Membresías)
        const vals: number[] = [];
        let prev = row.base2026;
        for (let yi = 0; yi < 3; yi++) {
          const overrideKey = `${ri}-${yi}`;
          if (overrides[overrideKey] !== undefined) {
            vals.push(overrides[overrideKey]);
            prev = overrides[overrideKey];
          } else {
            const rate = assumptions[row.growthGroup][yi] / 100;
            const next = prev * (1 + rate);
            vals.push(next);
            prev = next;
          }
        }
        result.push({ category: row.category, level: row.level, parentCategory: row.parentCategory, values: vals });
      } else {
        result.push({ category: row.category, level: row.level, parentCategory: row.parentCategory, values: [0, 0, 0] });
      }
    }

    // Aggregate level-1 groups (only those with children)
    for (let i = 0; i < result.length; i++) {
      if (result[i].level === 1) {
        const groupName = result[i].category;
        const hasLeafChildren = result.some((c) => c.parentCategory === groupName && c.level === 2);
        if (hasLeafChildren) {
          const sums = [0, 0, 0];
          for (const child of result) {
            if (child.parentCategory === groupName && child.level === 2) {
              for (let y = 0; y < 3; y++) sums[y] += child.values[y];
            }
          }
          result[i].values = sums;
        }
      }
    }

    // Aggregate level-0 headers
    for (let i = 0; i < result.length; i++) {
      if (result[i].level === 0) {
        const headerName = result[i].category;
        const sums = [0, 0, 0];
        for (const child of result) {
          if (child.parentCategory === headerName && child.level === 1) {
            for (let y = 0; y < 3; y++) sums[y] += child.values[y];
          }
        }
        result[i].values = sums;
      }
    }

    return result;
  }, [structure, assumptions, overrides]);

  // Is a row editable? (leaf nodes only)
  const isEditable = useCallback((idx: number) => {
    const row = structure[idx];
    if (row.level === 2) return true;
    if (row.level === 1 && !structure.some((c) => c.parentCategory === row.category && c.level === 2)) return true;
    return false;
  }, [structure]);

  // Summary metrics — auto-scan 2026 from structure
  const base2026Income = useMemo(() => {
    // Sum all level-1 income items
    return structure.filter((s) => s.parentCategory === "INGRESOS" && s.level === 1).reduce((sum, s) => sum + s.base2026, 0);
  }, [structure]);

  const base2026Expenses = useMemo(() => {
    // Sum all level-1 expense groups; for groups with children, sum their children
    return structure.filter((s) => s.parentCategory === "EGRESOS" && s.level === 1).reduce((sum, group) => {
      const children = structure.filter((c) => c.parentCategory === group.category && c.level === 2);
      if (children.length > 0) {
        return sum + children.reduce((cs, c) => cs + c.base2026, 0);
      }
      return sum + group.base2026;
    }, 0);
  }, [structure]);

  const base2026Personal = useMemo(() => {
    return structure.filter((s) => s.parentCategory === "Personal" && s.level === 2).reduce((sum, s) => sum + s.base2026, 0);
  }, [structure]);

  const totals = useMemo(() => {
    const incomeRow = projected.find((r) => r.category === "INGRESOS");
    const expenseRow = projected.find((r) => r.category === "EGRESOS");

    const years = ["2026", "2027", "2028", "2029"];
    return years.map((yr, idx) => {
      const income = idx === 0 ? base2026Income : incomeRow!.values[idx - 1];
      const expenses = idx === 0 ? base2026Expenses : expenseRow!.values[idx - 1];
      const net = income - expenses;
      const margin = income > 0 ? (net / income) * 100 : 0;
      return { year: yr, income, expenses, net, margin };
    });
  }, [projected, base2026Income, base2026Expenses]);

  const chartData = totals.map((t) => ({
    year: t.year,
    Ingresos: Math.round(t.income),
    Egresos: Math.round(t.expenses),
    "Resultado Neto": Math.round(t.net),
    "Margen %": parseFloat(t.margin.toFixed(1)),
  }));

  const personalRow = projected.find((r) => r.category === "Personal");
  const personalOverIncome = totals.map((t, i) => {
    const personalVal = i === 0 ? base2026Personal : personalRow?.values[i - 1] ?? 0;
    return {
      year: t.year,
      "% Personal / Ingresos": t.income > 0 ? parseFloat(((personalVal / t.income) * 100).toFixed(1)) : 0,
    };
  });

  const toggleCollapse = (cat: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const isRowVisible = (row: typeof projected[0]) => {
    if (row.level === 0) return true;
    if (row.level === 1) {
      if (row.parentCategory && collapsed.has(row.parentCategory)) return false;
      return true;
    }
    if (row.parentCategory && collapsed.has(row.parentCategory)) return false;
    const parentRow = structure.find((s) => s.category === row.parentCategory);
    if (parentRow?.parentCategory && collapsed.has(parentRow.parentCategory)) return false;
    return true;
  };

  const exportToExcel = () => {
    const headers = ["Categoría", "2026", "2027", "2028", "2029"];
    const rows: (string | number)[][] = [];
    for (let i = 0; i < projected.length; i++) {
      const r = projected[i];
      const s = structure[i];
      const prefix = r.level === 2 ? "    " : r.level === 1 ? "  " : "";
      rows.push([prefix + r.category, s.base2026, Math.round(r.values[0]), Math.round(r.values[1]), Math.round(r.values[2])]);
    }
    rows.push(["Resultado Neto", totals[0].net, Math.round(totals[1].net), Math.round(totals[2].net), Math.round(totals[3].net)]);
    rows.push(["Margen %", parseFloat(totals[0].margin.toFixed(1)), parseFloat(totals[1].margin.toFixed(1)), parseFloat(totals[2].margin.toFixed(1)), parseFloat(totals[3].margin.toFixed(1))]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Proyección 2027-2029");
    XLSX.writeFile(wb, "Proyeccion_Financiera_2027_2029.xlsx");
  };

  const hasOverrides = Object.keys(overrides).length > 0;

  const chartConfig = {
    Ingresos: { label: "Ingresos", color: "hsl(142, 71%, 45%)" },
    Egresos: { label: "Egresos", color: "hsl(0, 84%, 60%)" },
    "Resultado Neto": { label: "Resultado Neto", color: "hsl(217, 91%, 60%)" },
  };
  const marginConfig = { "Margen %": { label: "Margen %", color: "hsl(262, 83%, 58%)" } };
  const personalConfig = { "% Personal / Ingresos": { label: "% Personal / Ingresos", color: "hsl(25, 95%, 53%)" } };

  return (
    <div className="space-y-6">
      {/* ── Scenario + Assumptions ─────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg">Supuestos de Crecimiento Anual (%)</CardTitle>
            <div className="flex items-center gap-3">
              <Select value={scenario} onValueChange={(v) => handleScenarioChange(v as ScenarioKey)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">🔹 Conservador</SelectItem>
                  <SelectItem value="moderate">🔹 Moderado</SelectItem>
                  <SelectItem value="expansive">🔹 Expansivo</SelectItem>
                  <SelectItem value="custom">🔧 Personalizado</SelectItem>
                </SelectContent>
              </Select>
              {hasOverrides && (
                <Button variant="ghost" size="sm" onClick={() => setOverrides({})}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Reset
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={exportToExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(["income", "personal", "operative", "technology"] as const).map((group) => {
              const labels: Record<string, string> = {
                income: "Crecimiento Ingresos",
                personal: "Personal",
                operative: "Operativos",
                technology: "Tecnología",
              };
              return (
                <div key={group} className="border rounded-lg p-3 bg-muted/20">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">{labels[group]}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[2027, 2028, 2029].map((yr, yi) => (
                      <div key={yr} className="text-center">
                        <p className="text-[10px] text-muted-foreground">{yr}</p>
                        <Input
                          type="number"
                          value={assumptions[group][yi]}
                          onChange={(e) => updateAssumption(group, yi, parseFloat(e.target.value) || 0)}
                          className="h-8 text-center text-sm font-mono"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            💡 Doble clic en cualquier celda de la tabla para editar manualmente. Los totales se recalculan automáticamente.
          </p>
        </CardContent>
      </Card>

      {/* ── KPI Cards (clickable for drill-down) ─────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {totals.map((t, tIdx) => {
          const isActive = drillDown?.year === t.year;
          return (
            <Card
              key={t.year}
              className={cn(
                "relative overflow-hidden cursor-pointer transition-all",
                isActive ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"
              )}
              onClick={() => setDrillDown(isActive ? null : { year: t.year, yearIdx: tIdx })}
            >
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-xs font-semibold text-muted-foreground">{t.year}</p>
                <div className="mt-1 space-y-1">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-muted-foreground">Ingresos</span>
                    <span className="ml-auto text-sm font-bold">${fmt(Math.round(t.income))}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingDown className="h-3 w-3 text-destructive" />
                    <span className="text-xs text-muted-foreground">Egresos</span>
                    <span className="ml-auto text-sm font-bold">${fmt(Math.round(t.expenses))}</span>
                  </div>
                  <Separator className="my-1" />
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-primary" />
                    <span className="text-xs font-semibold">Resultado</span>
                    <span className={cn("ml-auto text-sm font-bold", t.net >= 0 ? "text-green-600" : "text-destructive")}>
                      ${fmt(Math.round(t.net))}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Percent className="h-3 w-3 text-primary" />
                    <span className="text-xs text-muted-foreground">Margen</span>
                    <Badge variant="secondary" className="ml-auto text-xs">{pct(t.margin)}</Badge>
                  </div>
                </div>
                {isActive && (
                  <div className="absolute top-1 right-1">
                    <Badge className="text-[9px] px-1.5 py-0">Detalle ▼</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Drill-Down Panel ───────────────────────────────────────── */}
      {drillDown && (() => {
        const yi = drillDown.yearIdx;
        // Get level-1 groups for income
        const incomeGroups = projected.filter(
          (r) => r.parentCategory === "INGRESOS" && r.level === 1
        );
        // Get level-1 groups for expenses
        const expenseGroups = projected.filter(
          (r) => r.parentCategory === "EGRESOS" && r.level === 1
        );

        const getVal = (row: typeof projected[0]) =>
          yi === 0 ? structure[projected.indexOf(row)].base2026 : row.values[yi - 1];

        const selectedTotal = totals[yi];

        // For each expense group, get its children
        const getChildren = (groupCat: string) =>
          projected.filter((r) => r.parentCategory === groupCat && r.level === 2);

        return (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">
                  Desglose {drillDown.year}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setDrillDown(null)}>✕</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Income breakdown */}
                <div>
                  <h4 className="text-sm font-semibold text-green-600 mb-2 flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" /> Ingresos — ${fmt(Math.round(selectedTotal.income))}
                  </h4>
                  <div className="space-y-1.5">
                    {incomeGroups.map((g) => {
                      const val = getVal(g);
                      const pctOfTotal = selectedTotal.income > 0 ? (val / selectedTotal.income) * 100 : 0;
                      return (
                        <div key={g.category} className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="flex justify-between text-sm">
                              <span>{g.category}</span>
                              <span className="font-mono font-semibold">${fmt(Math.round(val))}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5 mt-0.5">
                              <div
                                className="bg-green-500 h-1.5 rounded-full transition-all"
                                style={{ width: `${Math.min(pctOfTotal, 100)}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground w-10 text-right">{pctOfTotal.toFixed(0)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Expense breakdown */}
                <div>
                  <h4 className="text-sm font-semibold text-destructive mb-2 flex items-center gap-1">
                    <TrendingDown className="h-4 w-4" /> Egresos — ${fmt(Math.round(selectedTotal.expenses))}
                  </h4>
                  <div className="space-y-1.5">
                    {expenseGroups.map((g) => {
                      const val = getVal(g);
                      const pctOfTotal = selectedTotal.expenses > 0 ? (val / selectedTotal.expenses) * 100 : 0;
                      const children = getChildren(g.category);
                      return (
                        <div key={g.category}>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">{g.category}</span>
                                <span className="font-mono font-semibold">${fmt(Math.round(val))}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-1.5 mt-0.5">
                                <div
                                  className="bg-destructive/70 h-1.5 rounded-full transition-all"
                                  style={{ width: `${Math.min(pctOfTotal, 100)}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground w-10 text-right">{pctOfTotal.toFixed(0)}%</span>
                          </div>
                          {children.length > 0 && (
                            <div className="ml-4 mt-1 space-y-0.5">
                              {children.map((c) => {
                                const cVal = yi === 0 ? structure[projected.indexOf(c)].base2026 : c.values[yi - 1];
                                return (
                                  <div key={c.category} className="flex justify-between text-xs text-muted-foreground">
                                    <span>{c.category}</span>
                                    <span className="font-mono">${fmt(Math.round(cVal))}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Year-over-year change */}
              {yi > 0 && (
                <div className="mt-4 pt-3 border-t">
                  <h4 className="text-sm font-semibold mb-2">Variación vs {totals[yi - 1].year}</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    {[
                      { label: "Ingresos", curr: selectedTotal.income, prev: totals[yi - 1].income },
                      { label: "Egresos", curr: selectedTotal.expenses, prev: totals[yi - 1].expenses },
                      { label: "Resultado", curr: selectedTotal.net, prev: totals[yi - 1].net },
                    ].map((item) => {
                      const change = item.prev !== 0 ? ((item.curr - item.prev) / Math.abs(item.prev)) * 100 : 0;
                      return (
                        <div key={item.label}>
                          <p className="text-xs text-muted-foreground">{item.label}</p>
                          <p className={cn("text-sm font-bold", change >= 0 ? "text-green-600" : "text-destructive")}>
                            {change >= 0 ? "+" : ""}{change.toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {change >= 0 ? "+" : ""}${fmt(Math.round(item.curr - item.prev))}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* ── Editable Projection Table ──────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Proyección Financiera 2027–2029</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left p-3 min-w-[280px] sticky left-0 bg-muted/50 z-10">Categoría</th>
                  <th className="text-right p-3 w-36 bg-primary/5">2026 (Base)</th>
                  <th className="text-right p-3 w-36">2027</th>
                  <th className="text-right p-3 w-36">2028</th>
                  <th className="text-right p-3 w-36">2029</th>
                </tr>
              </thead>
              <tbody>
                {projected.map((row, idx) => {
                  if (!isRowVisible(row)) return null;
                  const s = structure[idx];
                  const isHeader = row.level === 0;
                  const isGroup = row.level === 1 && structure.some((c) => c.parentCategory === row.category && c.level === 2);
                  const editable = isEditable(idx);
                  const hasChildren = structure.some((c) => c.parentCategory === row.category);
                  const isCollapsedRow = collapsed.has(row.category);

                  return (
                    <tr
                      key={idx}
                      className={cn(
                        "border-b transition-colors",
                        isHeader && "bg-primary/10 font-bold text-primary",
                        isGroup && "bg-muted/30 font-semibold",
                        !isHeader && !isGroup && "hover:bg-muted/10"
                      )}
                    >
                      <td className="p-2 pl-3 sticky left-0 bg-inherit z-10">
                        <div
                          className="flex items-center gap-1 cursor-pointer"
                          style={{ paddingLeft: row.level * 16 }}
                          onClick={() => hasChildren && toggleCollapse(row.category)}
                        >
                          {hasChildren && (
                            <span className="text-xs text-muted-foreground w-4 flex-shrink-0">
                              {isCollapsedRow ? "▸" : "▾"}
                            </span>
                          )}
                          <span className="truncate">{row.category}</span>
                        </div>
                      </td>
                      <td className="p-2 text-right font-mono bg-primary/5">{fmtDec(s.base2026)}</td>
                      {row.values.map((v, yi) => {
                        const overrideKey = `${idx}-${yi}`;
                        const hasOverride = overrides[overrideKey] !== undefined;

                        return (
                          <td key={yi} className="p-1 border-l">
                            {editable ? (
                              <EditableCell
                                value={v}
                                onChange={(val) => setOverride(idx, yi, val)}
                                isOverridden={hasOverride}
                                onReset={() => clearOverride(idx, yi)}
                              />
                            ) : (
                              <div className="text-right font-mono px-2 py-1">
                                {fmtDec(v)}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                {/* Net Result */}
                <tr className="bg-primary/10 border-t-2 border-primary font-bold">
                  <td className="p-2 pl-3 text-primary sticky left-0 bg-primary/10 z-10">Resultado Neto</td>
                  {totals.map((t) => (
                    <td key={t.year} className={cn("p-2 text-right font-mono", t.net >= 0 ? "text-green-600" : "text-destructive")}>
                      {fmtDec(t.net)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-muted/20 font-semibold">
                  <td className="p-2 pl-3 sticky left-0 bg-muted/20 z-10">Margen %</td>
                  {totals.map((t) => (
                    <td key={t.year} className="p-2 text-right font-mono">{pct(t.margin)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Charts ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ingresos, Egresos y Resultado Neto</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px]">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="Ingresos" fill="var(--color-Ingresos)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Egresos" fill="var(--color-Egresos)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Resultado Neto" fill="var(--color-Resultado Neto)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Evolución del Margen %</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={marginConfig} className="h-[280px]">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis domain={[0, 60]} tickFormatter={(v) => `${v}%`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="Margen %" stroke="var(--color-Margen %)" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">% Gasto en Personal sobre Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={personalConfig} className="h-[250px]">
              <BarChart data={personalOverIncome}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis domain={[0, 60]} tickFormatter={(v) => `${v}%`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="% Personal / Ingresos" fill="var(--color-% Personal / Ingresos)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinancialProjection2027;
