import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────
interface BudgetRow {
  category: string;
  level: number;
  total: number;
  parent_category?: string;
  [key: string]: any;
}

interface BudgetDetailsReportProps {
  budgetData: BudgetRow[];
  language: "es" | "en";
}

// ─── Projection-aligned overrides (same as FinancialProjection2027) ──
const SALARY_POOL_MONTHLY_2026 = 15_300;
const CCSS_RATE = 0.2687;
const AGUINALDO_RATE = 0.0833;

const BASE_2026_OVERRIDES: Record<string, number> = {
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

const normalize = (s: string) => s.trim().toLowerCase().replace(/[,.\s]+/g, " ");

const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const fmt = (v: number) =>
  v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Structure template matching projection ─────────────────────────
const STRUCTURE: { category: string; parent?: string; level: number }[] = [
  { category: "INGRESOS", level: 0 },
  { category: "Cuotas de Asociados", parent: "INGRESOS", level: 1 },
  { category: "Membresías", parent: "INGRESOS", level: 1 },
  { category: "EGRESOS", level: 0 },
  { category: "Personal", parent: "EGRESOS", level: 1 },
  { category: "Salarios", parent: "Personal", level: 2 },
  { category: "CCSS + LPT + Otros 26.83%", parent: "Personal", level: 2 },
  { category: "Aguinaldo 8.33%", parent: "Personal", level: 2 },
  { category: "Beneficios Salud", parent: "Personal", level: 2 },
  { category: "Pólizas", parent: "Personal", level: 2 },
  { category: "Capacitación personal", parent: "Personal", level: 2 },
  { category: "Prestaciones Sociales", parent: "Personal", level: 2 },
  { category: "Gastos Administrativos", parent: "EGRESOS", level: 1 },
  { category: "Alquiler Oficinas y Parqueo", parent: "Gastos Administrativos", level: 2 },
  { category: "Telefonía Celular", parent: "Gastos Administrativos", level: 2 },
  { category: "Suministros de Oficina", parent: "Gastos Administrativos", level: 2 },
  { category: "Comisiones Financieras", parent: "Gastos Administrativos", level: 2 },
  { category: "Compra de equipo", parent: "Gastos Administrativos", level: 2 },
  { category: "Viáticos y Giras", parent: "EGRESOS", level: 1 },
  { category: "Viáticos", parent: "Viáticos y Giras", level: 2 },
  { category: "Comunicación y Mercadeo", parent: "EGRESOS", level: 1 },
  { category: "Pauta Redes Digitales", parent: "Comunicación y Mercadeo", level: 2 },
  { category: "Pauta Medios de Comunicación", parent: "Comunicación y Mercadeo", level: 2 },
  { category: "Eventos", parent: "Comunicación y Mercadeo", level: 2 },
  { category: "Servicios Profesionales", parent: "EGRESOS", level: 1 },
  { category: "Legal", parent: "Servicios Profesionales", level: 2 },
  { category: "Contabilidad", parent: "Servicios Profesionales", level: 2 },
  { category: "Otros servicios profesionales", parent: "Servicios Profesionales", level: 2 },
  { category: "Tecnología", parent: "EGRESOS", level: 1 },
  { category: "Soporte TI", parent: "Tecnología", level: 2 },
  { category: "Soporte y desarrollos tecnológicos", parent: "Tecnología", level: 2 },
  { category: "Seguridad de la información", parent: "Tecnología", level: 2 },
  { category: "Cuotas y Suscripciones", parent: "Tecnología", level: 2 },
  { category: "Otros Gastos", parent: "EGRESOS", level: 1 },
  { category: "Patente", parent: "Otros Gastos", level: 2 },
  { category: "IVA no soportado", parent: "Otros Gastos", level: 2 },
  { category: "Depreciación", parent: "Otros Gastos", level: 2 },
  { category: "Otros Gastos ", parent: "Otros Gastos", level: 2 },
  { category: "Impuesto de Renta Estimado", parent: "Otros Gastos", level: 2 },
];

// ─── Component ───────────────────────────────────────────────────────
const BudgetDetailsReport = ({ budgetData, language }: BudgetDetailsReportProps) => {
  const months = language === "es" ? MONTHS_ES : MONTHS_EN;

  const rows = useMemo(() => {
    // Get adjusted annual for each leaf category
    const getAdjustedAnnual = (cat: string): number => {
      for (const [key, val] of Object.entries(BASE_2026_OVERRIDES)) {
        if (normalize(key) === normalize(cat)) return val;
      }
      // Fallback to budget data
      const n = normalize(cat);
      const match = budgetData.find((r) => normalize(r.category) === n);
      return match?.total ?? 0;
    };

    // Build rows with annual and monthly (annual/12)
    const result: { category: string; level: number; annual: number; monthly: number; isHeader: boolean }[] = [];

    for (const item of STRUCTURE) {
      if (item.level === 2 || (item.level === 1 && !STRUCTURE.some(s => s.parent === item.category && s.level === 2))) {
        // Leaf: use adjusted annual
        const annual = getAdjustedAnnual(item.category);
        result.push({
          category: item.category,
          level: item.level,
          annual,
          monthly: annual / 12,
          isHeader: false,
        });
      } else if (item.level === 1) {
        // Group header: sum children
        const children = STRUCTURE.filter(s => s.parent === item.category && s.level === 2);
        const annual = children.reduce((sum, c) => sum + getAdjustedAnnual(c.category), 0);
        result.push({
          category: item.category,
          level: item.level,
          annual,
          monthly: annual / 12,
          isHeader: true,
        });
      } else {
        // Level 0 header: sum level-1 children
        const l1Children = STRUCTURE.filter(s => s.parent === item.category && s.level === 1);
        const annual = l1Children.reduce((sum, l1) => {
          const l2Children = STRUCTURE.filter(s => s.parent === l1.category && s.level === 2);
          if (l2Children.length > 0) {
            return sum + l2Children.reduce((s2, c) => s2 + getAdjustedAnnual(c.category), 0);
          }
          return sum + getAdjustedAnnual(l1.category);
        }, 0);
        result.push({
          category: item.category,
          level: item.level,
          annual,
          monthly: annual / 12,
          isHeader: true,
        });
      }
    }

    return result;
  }, [budgetData]);

  // Compute net result
  const incomeRow = rows.find(r => r.category === "INGRESOS");
  const expenseRow = rows.find(r => r.category === "EGRESOS");
  const netAnnual = (incomeRow?.annual ?? 0) - (expenseRow?.annual ?? 0);
  const netMonthly = netAnnual / 12;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">
          {language === "es" ? "Presupuesto de Operación 2026 — Detalle Mensual" : "2026 Operating Budget — Monthly Detail"}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {language === "es"
            ? "Asociación Horizonte Positivo • Valores en US$ • Mensual = Anual ÷ 12"
            : "Horizonte Positivo Association • Values in US$ • Monthly = Annual ÷ 12"}
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="border border-primary/30 p-2.5 text-left min-w-[240px] font-semibold">
                  {language === "es" ? "Categoría" : "Category"}
                </th>
                {months.map((m) => (
                  <th key={m} className="border border-primary/30 p-2.5 text-right min-w-[90px] font-semibold">{m}</th>
                ))}
                <th className="border border-primary/30 p-2.5 text-right min-w-[110px] font-bold bg-primary-foreground/10">
                  {language === "es" ? "Total Anual" : "Annual Total"}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const isL0 = row.level === 0;
                const isL1 = row.level === 1;
                const isIncome = row.category === "INGRESOS" || rows.find(r => r.category === "INGRESOS" && STRUCTURE.some(s => s.category === row.category && s.parent === "INGRESOS"));

                return (
                  <tr
                    key={idx}
                    className={cn(
                      "transition-colors",
                      isL0 && row.category.includes("INGRESO") && "bg-chart-1/10",
                      isL0 && row.category.includes("EGRESO") && "bg-chart-4/10",
                      isL1 && "bg-muted/30",
                      !isL0 && !isL1 && "hover:bg-muted/20"
                    )}
                  >
                    <td className={cn(
                      "border p-2.5",
                      isL0 && "font-bold text-base",
                      isL1 && "font-semibold",
                    )} style={{ paddingLeft: `${row.level * 20 + 10}px` }}>
                      {row.category}
                    </td>
                    {Array.from({ length: 12 }).map((_, mi) => (
                      <td
                        key={mi}
                        className={cn(
                          "border p-2.5 text-right font-mono tabular-nums",
                          isL0 && "font-bold",
                          isL1 && "font-semibold",
                          row.monthly === 0 && "text-muted-foreground"
                        )}
                      >
                        {row.monthly === 0 ? "—" : fmt(row.monthly)}
                      </td>
                    ))}
                    <td className={cn(
                      "border p-2.5 text-right font-mono tabular-nums bg-primary/5",
                      isL0 && "font-bold text-primary",
                      isL1 && "font-semibold text-primary",
                    )}>
                      {row.annual === 0 ? "—" : fmt(row.annual)}
                    </td>
                  </tr>
                );
              })}

              {/* Net Result Row */}
              <tr className="bg-primary/15 border-t-2 border-primary">
                <td className="border p-2.5 font-bold text-base text-primary" style={{ paddingLeft: "10px" }}>
                  {language === "es" ? "Ingresos menos Egresos" : "Income minus Expenses"}
                </td>
                {Array.from({ length: 12 }).map((_, mi) => (
                  <td
                    key={mi}
                    className={cn(
                      "border p-2.5 text-right font-mono tabular-nums font-bold",
                      netMonthly >= 0 ? "text-chart-2" : "text-destructive"
                    )}
                  >
                    {fmt(netMonthly)}
                  </td>
                ))}
                <td className={cn(
                  "border p-2.5 text-right font-mono tabular-nums font-bold text-base bg-primary/5",
                  netAnnual >= 0 ? "text-chart-2" : "text-destructive"
                )}>
                  {fmt(netAnnual)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetDetailsReport;
