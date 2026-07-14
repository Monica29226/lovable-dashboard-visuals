import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

type Cell = number | null; // null = "-"

interface Row {
  name: string;
  kind: "section" | "category" | "total" | "net";
  anual: Cell;
  junio: Cell;
  real: Cell;
  variacion: Cell;
  pendiente: Cell;
  avance: string; // texto tal cual (ej. "28%", "n/a")
}

const ROWS: Row[] = [
  { name: "INGRESOS", kind: "section", anual: null, junio: null, real: null, variacion: null, pendiente: null, avance: "" },
  { name: "Membresía", kind: "category", anual: 258633, junio: 175650, real: 71311, variacion: -104339, pendiente: 179339, avance: "28%" },
  { name: "Cuotas Asociados", kind: "category", anual: 250650, junio: 114785, real: 115000, variacion: 215, pendiente: 143633, avance: "44%" },
  { name: "Otros", kind: "category", anual: null, junio: null, real: null, variacion: null, pendiente: null, avance: "n/a" },
  { name: "Total ingresos", kind: "total", anual: 509283, junio: 290435, real: 186311, variacion: -104124, pendiente: 322972, avance: "37%" },

  { name: "EGRESOS", kind: "section", anual: null, junio: null, real: null, variacion: null, pendiente: null, avance: "" },
  { name: "Personal", kind: "category", anual: 223079, junio: 111540, real: 114603, variacion: -3064, pendiente: 108476, avance: "51%" },
  { name: "Gastos administrativos", kind: "category", anual: 20493, junio: 10247, real: 11784, variacion: -1537, pendiente: 8709, avance: "58%" },
  { name: "Viáticos", kind: "category", anual: 24000, junio: 12000, real: 17142, variacion: -5142, pendiente: 6858, avance: "71%" },
  { name: "Comunicación y Mercadeo", kind: "category", anual: 6885, junio: 2595, real: 14533, variacion: -11938, pendiente: -7648, avance: "211%" },
  { name: "Eventos", kind: "category", anual: 8750, junio: 3650, real: null, variacion: 3650, pendiente: null, avance: "n/a" },
  { name: "Servicios Profesionales", kind: "category", anual: 24048, junio: 12024, real: 27601, variacion: -15577, pendiente: -3553, avance: "115%" },
  { name: "Tecnología", kind: "category", anual: 21840, junio: 12670, real: 18324, variacion: -5654, pendiente: 3516, avance: "84%" },
  { name: "Impuestos", kind: "category", anual: 8000, junio: 4000, real: 5999, variacion: -1999, pendiente: 2001, avance: "75%" },
  { name: "Otros Gastos", kind: "category", anual: 400, junio: 200, real: null, variacion: 200, pendiente: 400, avance: "0%" },
  { name: "Depreciación", kind: "category", anual: 3000, junio: 1500, real: 1493, variacion: 7, pendiente: 1507, avance: "n/a" },
  { name: "Impuesto de Renta", kind: "category", anual: null, junio: null, real: null, variacion: null, pendiente: null, avance: "n/a" },
  { name: "Total egresos", kind: "total", anual: 340495, junio: 170425, real: 211480, variacion: -41055, pendiente: 120265, avance: "62%" },

  { name: "Ingresos menos Gastos", kind: "net", anual: 168787, junio: 120010, real: -25169, variacion: 145179, pendiente: 202706, avance: "-15%" },
];

const fmt = (v: Cell): string => {
  if (v === null) return "-";
  const abs = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.abs(v));
  return v < 0 ? `(${abs})` : abs;
};

const SUMMARY = {
  incomeReal: 186311,
  incomeMes: 290435,
  expenseReal: 211480,
  expenseMes: 170425,
  netReal: -25169,
  netMes: 120010,
};

export function BudgetVsRealStatic2026() {
  return (
    <div className="space-y-6">
      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Ingresos</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{fmt(SUMMARY.incomeReal)}</p>
            <p className="text-xs text-muted-foreground mt-1">Presupuesto a Junio: {fmt(SUMMARY.incomeMes)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Gastos</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{fmt(SUMMARY.expenseReal)}</p>
            <p className="text-xs text-muted-foreground mt-1">Presupuesto a Junio: {fmt(SUMMARY.expenseMes)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Ingresos menos Egresos</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${SUMMARY.netReal >= 0 ? "text-green-600" : "text-red-600"}`}>
              {fmt(SUMMARY.netReal)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Presupuesto a Junio: {fmt(SUMMARY.netMes)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              PRESUPUESTO VS. REAL - 2026
            </span>
            <Badge variant="secondary">USD</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">Valores en US$ · Acumulado a Junio 2026</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-primary/10">
                  <th className="border border-border px-4 py-3 text-left font-bold">Cuenta</th>
                  <th className="border border-border px-4 py-3 text-right font-bold whitespace-nowrap">Presupuesto Total Anual</th>
                  <th className="border border-border px-4 py-3 text-right font-bold whitespace-nowrap">Presupuesto Junio</th>
                  <th className="border border-border px-4 py-3 text-right font-bold whitespace-nowrap">Acumulado Junio</th>
                  <th className="border border-border px-4 py-3 text-right font-bold whitespace-nowrap">Variación</th>
                  <th className="border border-border px-4 py-3 text-right font-bold whitespace-nowrap">Pendiente Ejecución</th>
                  <th className="border border-border px-4 py-3 text-right font-bold whitespace-nowrap">% Avance</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row, idx) => {
                  const rowClass =
                    row.kind === "section"
                      ? "bg-muted/50 font-bold border-t-2 border-t-primary"
                      : row.kind === "total"
                      ? "font-semibold bg-muted/20"
                      : row.kind === "net"
                      ? "bg-primary/15 font-bold text-base border-t-2 border-t-primary"
                      : "hover:bg-muted/10";
                  const paddingLeft = row.kind === "category" ? "1.5rem" : undefined;
                  const isHeader = row.kind === "section";
                  const varClass =
                    row.variacion === null ? "" : row.variacion < 0 ? "text-red-600" : "text-green-700";

                  return (
                    <tr key={idx} className={rowClass}>
                      <td className="border border-border px-4 py-2 whitespace-nowrap" style={{ paddingLeft }}>
                        {row.name}
                      </td>
                      {isHeader ? (
                        <>
                          <td className="border border-border px-4 py-2" />
                          <td className="border border-border px-4 py-2" />
                          <td className="border border-border px-4 py-2" />
                          <td className="border border-border px-4 py-2" />
                          <td className="border border-border px-4 py-2" />
                          <td className="border border-border px-4 py-2" />
                        </>
                      ) : (
                        <>
                          <td className="border border-border px-4 py-2 text-right whitespace-nowrap min-w-[120px]">{fmt(row.anual)}</td>
                          <td className="border border-border px-4 py-2 text-right whitespace-nowrap min-w-[120px]">{fmt(row.junio)}</td>
                          <td className="border border-border px-4 py-2 text-right whitespace-nowrap min-w-[140px] bg-muted/10">
                            <span className="font-medium">{fmt(row.real)}</span>
                          </td>
                          <td className={`border border-border px-4 py-2 text-right whitespace-nowrap min-w-[120px] ${varClass}`}>
                            {fmt(row.variacion)}
                          </td>
                          <td className="border border-border px-4 py-2 text-right whitespace-nowrap min-w-[120px] text-muted-foreground">
                            {fmt(row.pendiente)}
                          </td>
                          <td className="border border-border px-4 py-2 text-right whitespace-nowrap min-w-[90px]">
                            {row.avance || "—"}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BudgetVsRealStatic2026;
