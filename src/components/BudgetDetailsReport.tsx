import { useMemo, useState, useCallback, useRef, useEffect } from "react";
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

const MONTHS_KEY = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
] as const;

const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const fmt = (v: number) =>
  v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Structure template ─────────────────────────────────────────────
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

const normalize = (s: string) => s.trim().toLowerCase().replace(/[,.\s]+/g, " ");

// ─── Editable Cell ──────────────────────────────────────────────────
const EditableCell = ({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
}) => {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = () => {
    setRaw(value === 0 ? "" : value.toString());
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    const clean = raw.replace(/,/g, "").trim();
    const num = parseFloat(clean);
    if (!isNaN(num) && num !== value) {
      onChange(num);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full bg-background border border-primary rounded px-1.5 py-0.5 text-right font-mono text-sm outline-none ring-2 ring-primary/30",
          className
        )}
      />
    );
  }

  return (
    <span
      onClick={startEdit}
      className="cursor-text hover:bg-primary/10 rounded px-1 py-0.5 transition-colors block text-right"
      title="Clic para editar"
    >
      {value === 0 ? "—" : fmt(value)}
    </span>
  );
};

// ─── Helper: check if item is a leaf in STRUCTURE ───────────────────
const isLeaf = (item: typeof STRUCTURE[number]) => {
  if (item.level === 2) return true;
  if (item.level === 1) return !STRUCTURE.some((s) => s.parent === item.category && s.level === 2);
  return false;
};

// ─── Component ───────────────────────────────────────────────────────
const BudgetDetailsReport = ({ budgetData, language }: BudgetDetailsReportProps) => {
  const monthLabels = language === "es" ? MONTHS_ES : MONTHS_EN;

  // Build initial monthly data from budgetData (annual / 12 as defaults)
  const buildInitialMonthly = useCallback(() => {
    const map: Record<string, number[]> = {};
    for (const item of STRUCTURE) {
      if (!isLeaf(item)) continue;
      const n = normalize(item.category);
      const match = budgetData.find((r) => normalize(r.category) === n);

      // Try to get per-month data from budgetData
      const months: number[] = [];
      let hasMonthly = false;
      for (const mk of MONTHS_KEY) {
        const v = match?.[mk];
        if (v !== undefined && v !== null) {
          months.push(Number(v) || 0);
          hasMonthly = true;
        } else {
          months.push(0);
        }
      }

      if (!hasMonthly && match?.total) {
        // Fallback: distribute evenly
        const m = (match.total || 0) / 12;
        for (let i = 0; i < 12; i++) months[i] = m;
      }

      map[item.category] = months;
    }
    return map;
  }, [budgetData]);

  const [monthlyData, setMonthlyData] = useState<Record<string, number[]>>(() => buildInitialMonthly());

  // Re-sync when budgetData changes externally
  useEffect(() => {
    setMonthlyData(buildInitialMonthly());
  }, [buildInitialMonthly]);

  const handleCellChange = useCallback((category: string, monthIdx: number, value: number) => {
    setMonthlyData((prev) => {
      const updated = { ...prev };
      const arr = [...(updated[category] || new Array(12).fill(0))];
      arr[monthIdx] = value;
      updated[category] = arr;
      return updated;
    });
  }, []);

  // Computed rows with aggregation
  const { rows, netMonthly, netAnnual } = useMemo(() => {
    const getLeafMonthly = (cat: string): number[] => monthlyData[cat] || new Array(12).fill(0);

    const computeGroupMonthly = (parentCat: string, parentLevel: number): number[] => {
      const children = STRUCTURE.filter((s) => s.parent === parentCat);
      const result = new Array(12).fill(0);
      for (const child of children) {
        const childMonths = isLeaf(child)
          ? getLeafMonthly(child.category)
          : computeGroupMonthly(child.category, child.level);
        for (let i = 0; i < 12; i++) result[i] += childMonths[i];
      }
      return result;
    };

    const result: { category: string; level: number; months: number[]; annual: number; isLeaf: boolean }[] = [];

    for (const item of STRUCTURE) {
      const months = isLeaf(item)
        ? getLeafMonthly(item.category)
        : computeGroupMonthly(item.category, item.level);
      const annual = months.reduce((s, v) => s + v, 0);
      result.push({ category: item.category, level: item.level, months, annual, isLeaf: isLeaf(item) });
    }

    const incomeRow = result.find((r) => r.category === "INGRESOS");
    const expenseRow = result.find((r) => r.category === "EGRESOS");
    const netM = new Array(12).fill(0).map((_, i) => (incomeRow?.months[i] ?? 0) - (expenseRow?.months[i] ?? 0));
    const netA = netM.reduce((s, v) => s + v, 0);

    return { rows: result, netMonthly: netM, netAnnual: netA };
  }, [monthlyData]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">
          {language === "es" ? "Presupuesto de Operación 2026 — Detalle Mensual" : "2026 Operating Budget — Monthly Detail"}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {language === "es"
            ? "Asociación Horizonte Positivo • Valores en US$ • Celdas editables con recálculo automático"
            : "Horizonte Positivo Association • Values in US$ • Editable cells with auto-recalculation"}
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
                {monthLabels.map((m) => (
                  <th key={m} className="border border-primary/30 p-2.5 text-right min-w-[100px] font-semibold">{m}</th>
                ))}
                <th className="border border-primary/30 p-2.5 text-right min-w-[120px] font-bold bg-primary-foreground/10">
                  {language === "es" ? "Total Anual" : "Annual Total"}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const isL0 = row.level === 0;
                const isL1 = row.level === 1;

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
                    <td
                      className={cn(
                        "border p-2.5",
                        isL0 && "font-bold text-base",
                        isL1 && "font-semibold",
                      )}
                      style={{ paddingLeft: `${row.level * 20 + 10}px` }}
                    >
                      {row.category}
                    </td>
                    {row.months.map((val, mi) => (
                      <td
                        key={mi}
                        className={cn(
                          "border p-1 text-right font-mono tabular-nums",
                          isL0 && "font-bold",
                          isL1 && "font-semibold",
                        )}
                      >
                        {row.isLeaf ? (
                          <EditableCell
                            value={val}
                            onChange={(v) => handleCellChange(row.category, mi, v)}
                          />
                        ) : (
                          <span className={cn(val === 0 && "text-muted-foreground")}>
                            {val === 0 ? "—" : fmt(val)}
                          </span>
                        )}
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

              {/* Net Result Row — KPI style */}
              <tr
                className={cn(
                  "border-t-[3px] border-b-[3px]",
                  netAnnual >= 0
                    ? "bg-[hsl(130,40%,25%)] border-[hsl(130,40%,20%)]"
                    : "bg-[hsl(0,60%,30%)] border-[hsl(0,60%,25%)]"
                )}
              >
                <td
                  className="border p-3 font-bold text-lg text-white"
                  style={{ paddingLeft: "10px" }}
                >
                  {language === "es" ? "Ingresos menos Egresos" : "Income minus Expenses"}
                </td>
                {netMonthly.map((val, mi) => (
                  <td
                    key={mi}
                    className="border border-white/20 p-2.5 text-right font-mono tabular-nums font-bold text-white text-base"
                  >
                    {fmt(val)}
                  </td>
                ))}
                <td
                  className={cn(
                    "border border-white/20 p-3 text-right font-mono tabular-nums font-bold text-white text-lg",
                    netAnnual >= 0 ? "bg-[hsl(130,40%,20%)]" : "bg-[hsl(0,60%,25%)]"
                  )}
                >
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
