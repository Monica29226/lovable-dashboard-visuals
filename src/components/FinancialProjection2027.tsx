import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileSpreadsheet, TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, ResponsiveContainer, Legend } from "recharts";
import * as XLSX from "xlsx";

// ─── Types ───────────────────────────────────────────────────────────
interface CategoryRow {
  category: string;
  parentCategory?: string;
  level: number; // 0=header, 1=group, 2=leaf
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

// ─── Preset scenarios ───────────────────────────────────────────────
const SCENARIOS: Record<Exclude<ScenarioKey, "custom">, GrowthAssumptions> = {
  conservative: {
    income: [8, 8, 8],
    personal: [6, 6, 6],
    operative: [6, 6, 6],
    technology: [6, 6, 6],
  },
  moderate: {
    income: [12, 12, 12],
    personal: [8, 8, 8],
    operative: [8, 8, 8],
    technology: [8, 8, 8],
  },
  expansive: {
    income: [18, 18, 18],
    personal: [10, 10, 10],
    operative: [10, 10, 10],
    technology: [10, 10, 10],
  },
};

// ─── Budget structure (base 2026 totals) ─────────────────────────────
const buildStructure = (): CategoryRow[] => [
  // INGRESOS header
  { category: "INGRESOS", level: 0, base2026: 0, growthGroup: "income" },
  { category: "Cuotas de Asociados", parentCategory: "INGRESOS", level: 1, base2026: 250650, growthGroup: "income" },
  { category: "Membresías", parentCategory: "INGRESOS", level: 1, base2026: 222900, growthGroup: "income" },

  // EGRESOS header
  { category: "EGRESOS", level: 0, base2026: 0, growthGroup: "operative" },

  // Personal
  { category: "Personal", parentCategory: "EGRESOS", level: 1, base2026: 0, growthGroup: "personal" },
  { category: "Salarios", parentCategory: "Personal", level: 2, base2026: 156000, growthGroup: "personal" },
  { category: "CCSS + LPT + Otros 26.67%", parentCategory: "Personal", level: 2, base2026: 41605.20, growthGroup: "personal" },
  { category: "Aguinaldo 8.33%", parentCategory: "Personal", level: 2, base2026: 13000, growthGroup: "personal" },
  { category: "Beneficios Salud", parentCategory: "Personal", level: 2, base2026: 976.32, growthGroup: "personal" },
  { category: "Pólizas", parentCategory: "Personal", level: 2, base2026: 1497.60, growthGroup: "personal" },
  { category: "Capacitación personal", parentCategory: "Personal", level: 2, base2026: 10000, growthGroup: "personal" },
  { category: "Prestaciones Sociales", parentCategory: "Personal", level: 2, base2026: 0, growthGroup: "personal" },

  // Gastos Administrativos
  { category: "Gastos Administrativos", parentCategory: "EGRESOS", level: 1, base2026: 0, growthGroup: "operative" },
  { category: "Alquiler Oficinas y Parqueo", parentCategory: "Gastos Administrativos", level: 2, base2026: 18000, growthGroup: "operative" },
  { category: "Telefonía Celular", parentCategory: "Gastos Administrativos", level: 2, base2026: 1173.02, growthGroup: "operative" },
  { category: "Suministros de Oficina", parentCategory: "Gastos Administrativos", level: 2, base2026: 1200, growthGroup: "operative" },
  { category: "Comisiones Financieras", parentCategory: "Gastos Administrativos", level: 2, base2026: 120, growthGroup: "operative" },
  { category: "Compra de equipo", parentCategory: "Gastos Administrativos", level: 2, base2026: 0, growthGroup: "operative" },

  // Viáticos y Giras
  { category: "Viáticos y Giras", parentCategory: "EGRESOS", level: 1, base2026: 0, growthGroup: "operative" },
  { category: "Viáticos", parentCategory: "Viáticos y Giras", level: 2, base2026: 26400, growthGroup: "operative" },

  // Comunicación y Mercadeo
  { category: "Comunicación y Mercadeo", parentCategory: "EGRESOS", level: 1, base2026: 0, growthGroup: "operative" },
  { category: "Pauta Redes Digitales", parentCategory: "Comunicación y Mercadeo", level: 2, base2026: 1800, growthGroup: "operative" },
  { category: "Pauta Medios de Comunicación", parentCategory: "Comunicación y Mercadeo", level: 2, base2026: 5085, growthGroup: "operative" },
  { category: "Eventos", parentCategory: "Comunicación y Mercadeo", level: 2, base2026: 8750, growthGroup: "operative" },

  // Servicios Profesionales
  { category: "Servicios Profesionales", parentCategory: "EGRESOS", level: 1, base2026: 0, growthGroup: "operative" },
  { category: "Legal", parentCategory: "Servicios Profesionales", level: 2, base2026: 6000, growthGroup: "operative" },
  { category: "Contabilidad", parentCategory: "Servicios Profesionales", level: 2, base2026: 10848, growthGroup: "operative" },
  { category: "Otros servicios profesionales", parentCategory: "Servicios Profesionales", level: 2, base2026: 7200, growthGroup: "operative" },

  // Tecnología
  { category: "Tecnología", parentCategory: "EGRESOS", level: 1, base2026: 0, growthGroup: "technology" },
  { category: "Soporte TI", parentCategory: "Tecnología", level: 2, base2026: 840, growthGroup: "technology" },
  { category: "Soporte y desarrollos tecnológicos", parentCategory: "Tecnología", level: 2, base2026: 17000, growthGroup: "technology" },
  { category: "Seguridad de la información", parentCategory: "Tecnología", level: 2, base2026: 2500, growthGroup: "technology" },
  { category: "Cuotas y Suscripciones", parentCategory: "Tecnología", level: 2, base2026: 1500, growthGroup: "technology" },

  // Impuestos (inside Otros Gastos per structure)
  { category: "Otros Gastos", parentCategory: "EGRESOS", level: 1, base2026: 0, growthGroup: "operative" },
  { category: "Patente", parentCategory: "Otros Gastos", level: 2, base2026: 3200, growthGroup: "operative" },
  { category: "IVA no soportado", parentCategory: "Otros Gastos", level: 2, base2026: 4800, growthGroup: "operative" },
  { category: "Depreciación", parentCategory: "Otros Gastos", level: 2, base2026: 3000, growthGroup: "operative" },
  { category: "Otros Gastos ", parentCategory: "Otros Gastos", level: 2, base2026: 400, growthGroup: "operative" },
  { category: "Impuesto de Renta Estimado", parentCategory: "Otros Gastos", level: 2, base2026: 0, growthGroup: "operative" },
];

// ─── Helpers ─────────────────────────────────────────────────────────
const fmt = (v: number) =>
  v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtDec = (v: number) =>
  v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const pct = (v: number) => `${v.toFixed(1)}%`;

// ─── Component ───────────────────────────────────────────────────────
const FinancialProjection2027 = () => {
  const structure = useMemo(() => buildStructure(), []);

  const [scenario, setScenario] = useState<ScenarioKey>("moderate");
  const [assumptions, setAssumptions] = useState<GrowthAssumptions>(SCENARIOS.moderate);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const handleScenarioChange = useCallback((key: ScenarioKey) => {
    setScenario(key);
    if (key !== "custom") {
      setAssumptions(SCENARIOS[key]);
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

  // ── Compute projected values ──────────────────────────────────────
  const projected = useMemo(() => {
    const years = [0, 1, 2]; // index into assumptions arrays
    const result: { category: string; level: number; parentCategory?: string; values: number[] }[] = [];

    for (const row of structure) {
      if (row.level === 2) {
        const vals: number[] = [];
        let prev = row.base2026;
        for (const yi of years) {
          const rate = assumptions[row.growthGroup][yi] / 100;
          const next = prev * (1 + rate);
          vals.push(next);
          prev = next;
        }
        result.push({ category: row.category, level: row.level, parentCategory: row.parentCategory, values: vals });
      } else {
        result.push({ category: row.category, level: row.level, parentCategory: row.parentCategory, values: [0, 0, 0] });
      }
    }

    // Aggregate level-1 groups
    for (let i = 0; i < result.length; i++) {
      if (result[i].level === 1) {
        const groupName = result[i].category;
        const sums = [0, 0, 0];
        for (const child of result) {
          if (child.parentCategory === groupName && child.level === 2) {
            for (let y = 0; y < 3; y++) sums[y] += child.values[y];
          }
        }
        result[i].values = sums;
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
  }, [structure, assumptions]);

  // Summary metrics
  const totals = useMemo(() => {
    const incomeRow = projected.find((r) => r.category === "INGRESOS");
    const expenseRow = projected.find((r) => r.category === "EGRESOS");
    const base2026Income = 512709;
    const base2026Expenses = 353078;
    const base2026Net = base2026Income - base2026Expenses;
    const base2026Margin = (base2026Net / base2026Income) * 100;

    const years = ["2026", "2027", "2028", "2029"];
    return years.map((yr, idx) => {
      const income = idx === 0 ? base2026Income : incomeRow!.values[idx - 1];
      const expenses = idx === 0 ? base2026Expenses : expenseRow!.values[idx - 1];
      const net = income - expenses;
      const margin = income > 0 ? (net / income) * 100 : 0;
      return { year: yr, income, expenses, net, margin };
    });
  }, [projected]);

  // Chart data
  const chartData = totals.map((t) => ({
    year: t.year,
    Ingresos: Math.round(t.income),
    Egresos: Math.round(t.expenses),
    "Resultado Neto": Math.round(t.net),
    "Margen %": parseFloat(t.margin.toFixed(1)),
  }));

  const personalTotal2026 = 223079.12;
  const personalRow = projected.find((r) => r.category === "Personal");
  const personalOverIncome = totals.map((t, i) => {
    const personalVal = i === 0 ? personalTotal2026 : personalRow?.values[i - 1] ?? 0;
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
    // level 2: check parent group AND grandparent
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
      rows.push([
        prefix + r.category,
        s.base2026,
        Math.round(r.values[0]),
        Math.round(r.values[1]),
        Math.round(r.values[2]),
      ]);
    }

    // Net result
    rows.push(["Resultado Neto", totals[0].net, Math.round(totals[1].net), Math.round(totals[2].net), Math.round(totals[3].net)]);
    rows.push(["Margen %", parseFloat(totals[0].margin.toFixed(1)), parseFloat(totals[1].margin.toFixed(1)), parseFloat(totals[2].margin.toFixed(1)), parseFloat(totals[3].margin.toFixed(1))]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Proyección 2027-2029");
    XLSX.writeFile(wb, "Proyeccion_Financiera_2027_2029.xlsx");
  };

  const chartConfig = {
    Ingresos: { label: "Ingresos", color: "hsl(142, 71%, 45%)" },
    Egresos: { label: "Egresos", color: "hsl(0, 84%, 60%)" },
    "Resultado Neto": { label: "Resultado Neto", color: "hsl(217, 91%, 60%)" },
  };

  const marginConfig = {
    "Margen %": { label: "Margen %", color: "hsl(262, 83%, 58%)" },
  };

  const personalConfig = {
    "% Personal / Ingresos": { label: "% Personal / Ingresos", color: "hsl(25, 95%, 53%)" },
  };

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Scenario Selector + Assumptions ─────────────────────────── */}
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
        </CardContent>
      </Card>

      {/* ── KPI Summary Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {totals.map((t) => (
          <Card key={t.year} className="relative overflow-hidden">
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs font-semibold text-muted-foreground">{t.year}</p>
              <div className="mt-1 space-y-1">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-muted-foreground">Ingresos</span>
                  <span className="ml-auto text-sm font-bold">${fmt(Math.round(t.income))}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-muted-foreground">Egresos</span>
                  <span className="ml-auto text-sm font-bold">${fmt(Math.round(t.expenses))}</span>
                </div>
                <Separator className="my-1" />
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-primary" />
                  <span className="text-xs font-semibold">Resultado</span>
                  <span className={`ml-auto text-sm font-bold ${t.net >= 0 ? "text-green-600" : "text-destructive"}`}>
                    ${fmt(Math.round(t.net))}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Percent className="h-3 w-3 text-violet-500" />
                  <span className="text-xs text-muted-foreground">Margen</span>
                  <Badge variant="secondary" className="ml-auto text-xs">{pct(t.margin)}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Projection Table ───────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Proyección Financiera 2027–2029</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left p-3 min-w-[280px]">Categoría</th>
                  <th className="text-right p-3 w-32">2026 (Base)</th>
                  <th className="text-right p-3 w-32">2027</th>
                  <th className="text-right p-3 w-32">2028</th>
                  <th className="text-right p-3 w-32">2029</th>
                </tr>
              </thead>
              <tbody>
                {projected.map((row, idx) => {
                  if (!isRowVisible(row)) return null;
                  const s = structure[idx];
                  const isHeader = row.level === 0;
                  const isGroup = row.level === 1;
                  const hasChildren = structure.some((c) => c.parentCategory === row.category);
                  const isCollapsed = collapsed.has(row.category);

                  return (
                    <tr
                      key={idx}
                      className={`border-b transition-colors ${
                        isHeader
                          ? "bg-primary/10 font-bold text-primary"
                          : isGroup
                          ? "bg-muted/30 font-semibold"
                          : "hover:bg-muted/20"
                      }`}
                    >
                      <td className="p-2 pl-3">
                        <div
                          className="flex items-center gap-1 cursor-pointer"
                          style={{ paddingLeft: row.level * 16 }}
                          onClick={() => hasChildren && toggleCollapse(row.category)}
                        >
                          {hasChildren && (
                            <span className="text-xs text-muted-foreground w-4 flex-shrink-0">
                              {isCollapsed ? "▸" : "▾"}
                            </span>
                          )}
                          <span>{row.category}</span>
                        </div>
                      </td>
                      <td className="p-2 text-right font-mono">{fmtDec(s.base2026)}</td>
                      {row.values.map((v, yi) => (
                        <td key={yi} className="p-2 text-right font-mono">
                          {fmtDec(v)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {/* Net Result row */}
                <tr className="bg-primary/10 border-t-2 border-primary font-bold">
                  <td className="p-2 pl-3 text-primary">Resultado Neto</td>
                  {totals.map((t) => (
                    <td key={t.year} className={`p-2 text-right font-mono ${t.net >= 0 ? "text-green-600" : "text-destructive"}`}>
                      {fmtDec(t.net)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-muted/20 font-semibold">
                  <td className="p-2 pl-3">Margen %</td>
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
        {/* Income/Expenses/Net bar chart */}
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

        {/* Margin line chart */}
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

        {/* Personal over income */}
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
