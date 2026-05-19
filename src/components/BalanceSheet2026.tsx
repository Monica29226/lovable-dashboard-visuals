import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { financialData2026, formatCurrency2026 } from "@/data/financialData2026";
import { balanceSheetData, formatCurrency } from "@/data/balanceSheetData";

interface BalanceRow {
  label: string;
  dec2025: number | null;
  feb2026: number | null;
  isTotal?: boolean;
  isSection?: boolean;
  indent?: number;
}

export const BalanceSheet2026 = () => {
  const bs = financialData2026.balanceSheet;
  const a2025 = balanceSheetData.assets;
  const l2025 = balanceSheetData.liabilities;
  const e2025 = balanceSheetData.equity;

  const rows: BalanceRow[] = [
    { label: "ACTIVOS", dec2025: null, feb2026: null, isSection: true },
    { label: "Cuenta Colones Bac San Jose", dec2025: a2025.current.dec2025.cashColones, feb2026: bs.assets.current.cashColones, indent: 1 },
    { label: "Cuenta Dólares Bac San Jose", dec2025: a2025.current.dec2025.cashDollars, feb2026: bs.assets.current.cashDollars, indent: 1 },
    { label: "Total Caja y Bancos", dec2025: a2025.current.dec2025.totalCash, feb2026: bs.assets.current.totalCash, isTotal: true, indent: 1 },
    { label: "", dec2025: null, feb2026: null },
    { label: "Cuentas por Cobrar", dec2025: a2025.current.dec2025.accountsReceivable, feb2026: bs.assets.current.accountsReceivable, indent: 1 },
    { label: "Cuenta por Cobrar BNCR", dec2025: a2025.current.dec2025.accountsReceivableBNCR || null, feb2026: bs.assets.current.accountsReceivableBNCR || null, indent: 1 },
    { label: "Otras Cuentas por Cobrar", dec2025: null, feb2026: bs.assets.current.otherAccountsReceivable || null, indent: 1 },
    { label: "Total Cuenta por cobrar", dec2025: a2025.current.dec2025.accountsReceivable, feb2026: bs.assets.current.totalAccountsReceivable, isTotal: true, indent: 1 },
    { label: "", dec2025: null, feb2026: null },
    { label: "Impuesto de Renta Diferido", dec2025: a2025.current.dec2025.deferredTax, feb2026: bs.assets.current.deferredTax, indent: 1 },
    { label: "", dec2025: null, feb2026: null },
    { label: "Anticipo de Renta", dec2025: a2025.current.dec2025.anticipatedRent || null, feb2026: bs.assets.current.anticipatedRent || null, indent: 1 },
    { label: "", dec2025: null, feb2026: null },
    { label: "Total Activo Corriente", dec2025: a2025.current.dec2025.totalCurrent, feb2026: bs.assets.current.totalCurrent, isTotal: true },
    { label: "", dec2025: null, feb2026: null },
    { label: "Mobiliario y Equipo", dec2025: null, feb2026: bs.assets.nonCurrent.furnitureEquipment || null, indent: 1 },
    { label: "Equipo de Cómputo", dec2025: a2025.nonCurrent.dec2025.computerEquipment, feb2026: bs.assets.nonCurrent.computerEquipment, indent: 2 },
    { label: "Depreciación Acumulada", dec2025: a2025.nonCurrent.dec2025.accumulatedDepreciation, feb2026: bs.assets.nonCurrent.accumulatedDepreciation, indent: 2 },
    { label: "Total Activo Fijo", dec2025: a2025.nonCurrent.dec2025.totalNonCurrent, feb2026: bs.assets.nonCurrent.totalNonCurrent, isTotal: true, indent: 1 },
    { label: "", dec2025: null, feb2026: null },
    { label: "TOTAL ACTIVOS", dec2025: a2025.nonCurrent.dec2025.totalAssets, feb2026: bs.assets.totalAssets, isTotal: true, isSection: true },
    { label: "", dec2025: null, feb2026: null },
    { label: "PASIVOS", dec2025: null, feb2026: null, isSection: true },
    { label: "Cuentas por Pagar", dec2025: l2025.current.dec2025.accountsPayable, feb2026: bs.liabilities.accountsPayable, indent: 1 },
    { label: "Impuestos por Pagar (IVA)", dec2025: l2025.current.dec2025.taxesPayable, feb2026: bs.liabilities.taxesPayable, indent: 1 },
    { label: "Impuesto de Renta", dec2025: l2025.current.dec2025.incomeTaxPayable || null, feb2026: bs.liabilities.incomeTaxPayable, indent: 1 },
    { label: "Gastos Acumulados por Pagar", dec2025: l2025.current.dec2025.accumulatedExpenses, feb2026: bs.liabilities.accumulatedExpenses, indent: 1 },
    { label: "Otras cuentas por pagar", dec2025: l2025.current.dec2025.otherPayables || null, feb2026: bs.liabilities.otherPayables || null, indent: 1 },
    { label: "Total Pasivo Corriente", dec2025: l2025.current.dec2025.totalCurrent, feb2026: bs.liabilities.totalCurrent, isTotal: true, indent: 1 },
    { label: "", dec2025: null, feb2026: null },
    { label: "Total Pasivo", dec2025: l2025.current.dec2025.totalLiabilities, feb2026: bs.liabilities.totalLiabilities, isTotal: true },
    { label: "", dec2025: null, feb2026: null },
    { label: "Patrimonio Neto", dec2025: null, feb2026: null, isSection: true },
    { label: "Resultados Acumulados", dec2025: e2025.dec2025.retainedEarnings, feb2026: bs.equity.retainedEarnings, indent: 1 },
    { label: "Ajuste por traducción", dec2025: e2025.dec2025.translationAdjustment, feb2026: bs.equity.translationAdjustment, indent: 1 },
    { label: "Ingresos menos Gastos, del año", dec2025: e2025.dec2025.currentYearResult, feb2026: bs.equity.currentYearResult, indent: 1 },
    { label: "Total Patrimonio Neto", dec2025: e2025.dec2025.totalEquity, feb2026: bs.equity.totalEquity, isTotal: true },
    { label: "", dec2025: null, feb2026: null },
    { label: "TOTAL PASIVO Y PATRIMONIO", dec2025: a2025.nonCurrent.dec2025.totalAssets, feb2026: bs.totalLiabilitiesAndEquity, isTotal: true, isSection: true },
  ];

  const formatValue = (value: number | null): string => {
    if (value === null || value === 0) return "-";
    if (value < 0) {
      return `(${formatCurrency(Math.abs(value)).replace('$', '')})`;
    }
    return formatCurrency(value).replace('$', '');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">
          Estado de Posición Financiera
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Valores en US$ • Comparativo Diciembre 2025 vs Abril 2026
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-bold text-foreground">Valores en US$</TableHead>
              <TableHead className="text-right font-bold text-foreground w-[130px]">Diciembre 2025</TableHead>
              <TableHead className="text-right font-bold text-foreground w-[130px]">Abril 2026</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => {
              if (row.label === "") {
                return <TableRow key={index} className="h-2"><TableCell colSpan={3}></TableCell></TableRow>;
              }
              const indentClass = row.indent === 1 ? "pl-4" : row.indent === 2 ? "pl-8" : "";
              return (
                <TableRow
                  key={index}
                  className={
                    row.isSection
                      ? "bg-primary/10 font-bold"
                      : row.isTotal
                        ? "bg-muted/30 font-semibold border-t"
                        : "hover:bg-accent/30"
                  }
                >
                  <TableCell className={`${indentClass} ${row.isSection ? "text-primary font-bold" : ""} ${row.isTotal ? "font-semibold" : ""}`}>
                    {row.label}
                  </TableCell>
                  <TableCell className={`text-right font-mono ${row.isSection ? "font-bold" : ""} ${row.isTotal ? "font-semibold" : ""}`}>
                    {row.dec2025 !== null ? formatValue(row.dec2025) : ""}
                  </TableCell>
                  <TableCell className={`text-right font-mono ${row.isSection ? "font-bold" : ""} ${row.isTotal ? "font-semibold" : ""}`}>
                    {row.feb2026 !== null ? formatValue(row.feb2026) : ""}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
