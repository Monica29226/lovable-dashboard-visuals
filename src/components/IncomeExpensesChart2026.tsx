import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { financialData2026 } from "@/data/financialData2026";

type DisplayValue = number | null;

interface BudgetRow {
  label: string;
  section: "income" | "expense" | "net";
  index?: string;
  annual: DisplayValue;
  juneBudget: DisplayValue;
  juneActual: DisplayValue;
  variance: DisplayValue;
  pending: DisplayValue;
  advance: string;
  total?: boolean;
  spacerBefore?: boolean;
  forcePositiveVariance?: boolean;
}

const budgetRows: BudgetRow[] = [
  { section: "income", label: "Ingresos", annual: null, juneBudget: null, juneActual: null, variance: null, pending: null, advance: "", total: true },
  { section: "income", label: "Membresia", annual: 258633, juneBudget: 175650, juneActual: 71311, variance: -104339, pending: 179339, advance: "28%" },
  { section: "income", label: "Cuotas Asociados", annual: 250650, juneBudget: 114785, juneActual: 115000, variance: 215, pending: 143633, advance: "44%" },
  { section: "income", label: "Otros", annual: null, juneBudget: null, juneActual: null, variance: null, pending: null, advance: "n/a" },
  { section: "income", label: "Total ingresos", annual: 509283, juneBudget: 290435, juneActual: 186311, variance: -104124, pending: 322972, advance: "37%", total: true },

  { section: "expense", label: "Egresos", annual: null, juneBudget: null, juneActual: null, variance: null, pending: null, advance: "", total: true, spacerBefore: true },
  { section: "expense", index: "1", label: "Personal", annual: 223079, juneBudget: 111540, juneActual: 114603, variance: -3064, pending: 108476, advance: "51%" },
  { section: "expense", index: "2", label: "Gastos administrativos", annual: 20493, juneBudget: 10247, juneActual: 11784, variance: -1537, pending: 8709, advance: "58%" },
  { section: "expense", index: "3", label: "Viaticos", annual: 24000, juneBudget: 12000, juneActual: 17142, variance: -5142, pending: 6858, advance: "71%" },
  { section: "expense", index: "4", label: "Comunicación y Mercadeo", annual: 6885, juneBudget: 2595, juneActual: 14533, variance: -11938, pending: -7648, advance: "211%" },
  { section: "expense", index: "5", label: "Eventos", annual: 8750, juneBudget: 3650, juneActual: null, variance: 3650, pending: null, advance: "" },
  { section: "expense", index: "6", label: "Servicios Profesionales", annual: 24048, juneBudget: 12024, juneActual: 27601, variance: -15577, pending: -3553, advance: "115%" },
  { section: "expense", index: "7", label: "Tecnología", annual: 21840, juneBudget: 12670, juneActual: 18324, variance: -5654, pending: 3516, advance: "84%" },
  { section: "expense", index: "8", label: "Impuestos", annual: 8000, juneBudget: 4000, juneActual: 5999, variance: -1999, pending: 2001, advance: "75%" },
  { section: "expense", index: "9", label: "Otros Gastos", annual: 400, juneBudget: 200, juneActual: null, variance: 200, pending: 400, advance: "0%" },
  { section: "expense", index: "10", label: "Depreciación", annual: 3000, juneBudget: 1500, juneActual: 1493, variance: 7, pending: 1507, advance: "n/a" },
  { section: "expense", index: "11", label: "Impuesto de Renta", annual: null, juneBudget: null, juneActual: null, variance: null, pending: null, advance: "n/a" },
  { section: "expense", label: "Total egresos", annual: 340495, juneBudget: 170425, juneActual: 211480, variance: -41055, pending: 120265, advance: "62%", total: true },

  { section: "net", label: "Ingresos menos Gastos", annual: 168787, juneBudget: 120010, juneActual: -25169, variance: 145179, pending: 202706, advance: "-15%", total: true, spacerBefore: true, forcePositiveVariance: true },
];

const formatNumber = (value: DisplayValue, options?: { positiveVariance?: boolean }) => {
  if (value === null) return "-";
  const abs = Math.abs(value);
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(abs);

  if (value < 0 && !options?.positiveVariance) {
    return `(${formatted})`;
  }

  return formatted;
};

const headerClass = "px-4 py-3 text-right align-bottom text-base font-bold text-foreground";
const cellClass = "px-4 py-1.5 text-right align-middle tabular-nums";

export const IncomeExpensesChart2026 = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">
          Presupuesto vs Real · Junio 2026
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Información estática acumulada a junio 2026. Valores en US$ redondeados, con referencia del TC venta final BCCR {financialData2026.exchangeRate.date}: {financialData2026.exchangeRate.sale}.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-separate border-spacing-0 text-[15px]">
            <thead>
              <tr>
                <th className="w-10 px-1 py-3" />
                <th className="px-4 py-3 text-left align-bottom text-base font-bold text-foreground" />
                <th className={headerClass}>Presupuesto<br />Total Anual</th>
                <th className={headerClass}>Presupuesto<br />Junio</th>
                <th className={headerClass}>Acumulado<br />Junio</th>
                <th className={headerClass}>Variacion</th>
                <th className={headerClass}>Pendiente<br />Ejecución</th>
                <th className={headerClass}>%<br />Avance</th>
              </tr>
            </thead>
            <tbody>
              {budgetRows.map((row, index) => {
                const isSectionHeader = row.total && row.annual === null;
                const rowKey = `${row.section}-${row.label}-${index}`;
                const textWeight = row.total ? "font-bold" : "font-normal";
                const spacer = row.spacerBefore ? "pt-8" : "";

                return (
                  <tr key={rowKey}>
                    <td className={`px-1 py-1.5 text-center text-muted-foreground ${spacer}`}>
                      {row.index ?? ""}
                    </td>
                    <td className={`px-4 py-1.5 text-left ${textWeight} ${spacer}`}>
                      {row.label}
                    </td>
                    {isSectionHeader ? (
                      <>
                        <td className={cellClass} />
                        <td className={cellClass} />
                        <td className={cellClass} />
                        <td className={cellClass} />
                        <td className={cellClass} />
                        <td className={cellClass} />
                      </>
                    ) : (
                      <>
                        <td className={`${cellClass} ${textWeight} ${spacer}`}>{formatNumber(row.annual)}</td>
                        <td className={`${cellClass} ${textWeight} ${spacer}`}>{formatNumber(row.juneBudget)}</td>
                        <td className={`${cellClass} ${textWeight} ${spacer}`}>{formatNumber(row.juneActual)}</td>
                        <td className={`${cellClass} ${textWeight} ${spacer}`}>
                          {formatNumber(row.variance, { positiveVariance: row.forcePositiveVariance })}
                        </td>
                        <td className={`${cellClass} ${textWeight} ${spacer}`}>{formatNumber(row.pending)}</td>
                        <td className={`${cellClass} ${textWeight} ${spacer}`}>{row.advance}</td>
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
  );
};
