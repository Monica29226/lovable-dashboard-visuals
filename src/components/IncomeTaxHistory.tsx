import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const fmt = (v: number) =>
  v === 0 ? "-" : "₡" + new Intl.NumberFormat("en-US").format(v);

const historicalData = [
  { label: "Ingresos Totales", values: [439395530, 150519161, 228250297, 224106297] },
  { label: "Total Costos y Gastos", values: [393957697, 170413269, 217827446, 204086196] },
  { label: "Utilidad Neta", values: [45437833, 0, 10422850, 20020100] },
  { label: "Impuesto sobre la Renta del período", values: [13631350, 0, 3126855, 6006030] },
  { label: "Impuesto Neto por Pagar", values: [8920075, 0, 280983, 3219190], highlight: true },
];

const years = ["2022", "2023", "2024", "2025"];

const conciliacionData = [
  { label: "Utilidad Contable", value: 16234575 },
  { label: "Más Ingresos Gravables IPME 2025", value: 52130598, indent: true },
  { label: "Total Renta Gravable", value: 68365172, bold: true },
  { label: "Menos Ingresos no gravables IPME 2024", value: -48118692, indent: true },
  { label: "Utilidad Fiscal antes de ISR", value: 20020100, bold: true, highlightAlt: true },
  { label: "Impuesto sobre la Renta", value: 6006030 },
  { label: "Menos pagos parciales realizados", value: -2793034, indent: true },
  { label: "Intereses", value: 6194, indent: true },
  { label: "Impuesto Neto por Pagar estimado 2025", value: 3219190, highlight: true },
];

export const IncomeTaxHistory = () => {
  return (
    <div className="space-y-6">
      {/* SECCIÓN 1 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            Resumen Ejecutivo – Impuesto sobre la Renta (2022–2025)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold w-[280px]">Concepto</TableHead>
                {years.map((y) => (
                  <TableHead key={y} className="text-right font-bold">{y}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {historicalData.map((row) => (
                <TableRow
                  key={row.label}
                  className={row.highlight ? "bg-primary/10 font-bold" : ""}
                >
                  <TableCell className={row.highlight ? "font-bold text-primary" : "font-medium"}>
                    {row.label}
                  </TableCell>
                  {row.values.map((v, i) => (
                    <TableCell
                      key={i}
                      className={`text-right ${row.highlight ? "font-bold text-primary" : ""}`}
                    >
                      {fmt(v)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* SECCIÓN 2 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            Conciliación Fiscal 2025
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Concepto</TableHead>
                <TableHead className="text-right font-bold">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conciliacionData.map((row) => (
                <TableRow
                  key={row.label}
                  className={row.highlight ? "bg-primary/10" : row.highlightAlt ? "bg-muted" : ""}
                >
                  <TableCell
                    className={`${row.indent ? "pl-8" : ""} ${row.bold || row.highlight ? "font-bold" : "font-medium"} ${row.highlight ? "text-primary" : ""}`}
                  >
                    {row.label}
                  </TableCell>
                  <TableCell
                    className={`text-right ${row.bold || row.highlight ? "font-bold" : ""} ${row.highlight ? "text-primary" : ""}`}
                  >
                    {row.value < 0 ? `(${fmt(Math.abs(row.value))})` : fmt(row.value)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
