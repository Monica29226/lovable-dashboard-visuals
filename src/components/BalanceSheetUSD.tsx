import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { balanceSheetData, formatCurrency } from "@/data/balanceSheetData";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BalanceRow {
  label: string;
  dec2024: number | null;
  dec2025: number | null;
  isTotal?: boolean;
  isSection?: boolean;
  indent?: number;
}

export const BalanceSheetUSD = () => {
  const { t } = useLanguage();
  
  const assets = balanceSheetData.assets;
  const liabilities = balanceSheetData.liabilities;
  const equity = balanceSheetData.equity;

  // Build the rows structure matching the user's image
  const rows: BalanceRow[] = [
    // ACTIVOS
    { label: "ACTIVOS", dec2024: null, dec2025: null, isSection: true },
    { label: "Cuenta Colones Bac San Jose", dec2024: assets.current.dec2024.cashColones, dec2025: assets.current.dec2025.cashColones, indent: 1 },
    { label: "Cuenta Dólares Bac San Jose", dec2024: assets.current.dec2024.cashDollars, dec2025: assets.current.dec2025.cashDollars, indent: 1 },
    { label: "Total Caja y Bancos", dec2024: assets.current.dec2024.totalCash, dec2025: assets.current.dec2025.totalCash, isTotal: true, indent: 1 },
    { label: "", dec2024: null, dec2025: null }, // Separator
    { label: "Cuentas por Cobrar", dec2024: assets.current.dec2024.accountsReceivable, dec2025: assets.current.dec2025.accountsReceivable, indent: 1 },
    { label: "Cuenta por Cobrar BNCR", dec2024: assets.current.dec2024.accountsReceivableBNCR || null, dec2025: assets.current.dec2025.accountsReceivableBNCR || null, indent: 1 },
    { label: "Total Cuenta por cobrar", dec2024: assets.current.dec2024.accountsReceivable, dec2025: assets.current.dec2025.accountsReceivable, isTotal: true, indent: 1 },
    { label: "", dec2024: null, dec2025: null }, // Separator
    { label: "Impuesto de Renta Diferido", dec2024: assets.current.dec2024.deferredTax, dec2025: assets.current.dec2025.deferredTax, indent: 1 },
    { label: "", dec2024: null, dec2025: null }, // Separator
    { label: "Anticipo de Renta", dec2024: assets.current.dec2024.anticipatedRent, dec2025: assets.current.dec2025.anticipatedRent, indent: 1 },
    { label: "", dec2024: null, dec2025: null }, // Separator
    { label: "Total Activo Corriente", dec2024: assets.current.dec2024.totalCurrent, dec2025: assets.current.dec2025.totalCurrent, isTotal: true },
    { label: "", dec2024: null, dec2025: null }, // Separator
    { label: "Mobiliario y Equipo", dec2024: null, dec2025: null, indent: 1 },
    { label: "Equipo de Cómputo", dec2024: assets.nonCurrent.dec2024.computerEquipment, dec2025: assets.nonCurrent.dec2025.computerEquipment, indent: 2 },
    { label: "Depreciación Acumulada", dec2024: assets.nonCurrent.dec2024.accumulatedDepreciation, dec2025: assets.nonCurrent.dec2025.accumulatedDepreciation, indent: 2 },
    { label: "Total Activo Fijo", dec2024: assets.nonCurrent.dec2024.totalNonCurrent, dec2025: assets.nonCurrent.dec2025.totalNonCurrent, isTotal: true, indent: 1 },
    { label: "", dec2024: null, dec2025: null }, // Separator
    { label: "TOTAL ACTIVOS", dec2024: assets.nonCurrent.dec2024.totalAssets, dec2025: assets.nonCurrent.dec2025.totalAssets, isTotal: true, isSection: true },
    
    // Separator between sections
    { label: "", dec2024: null, dec2025: null },
    
    // PASIVOS
    { label: "PASIVOS", dec2024: null, dec2025: null, isSection: true },
    { label: "Cuentas por Pagar", dec2024: liabilities.current.dec2024.accountsPayable, dec2025: liabilities.current.dec2025.accountsPayable, indent: 1 },
    { label: "Impuestos por Pagar (IVA)", dec2024: liabilities.current.dec2024.taxesPayable, dec2025: liabilities.current.dec2025.taxesPayable, indent: 1 },
    { label: "Impuesto de Renta", dec2024: liabilities.current.dec2024.incomeTaxPayable || null, dec2025: liabilities.current.dec2025.incomeTaxPayable || null, indent: 1 },
    { label: "Gastos Acumulados por Pagar", dec2024: liabilities.current.dec2024.accumulatedExpenses, dec2025: liabilities.current.dec2025.accumulatedExpenses, indent: 1 },
    { label: "Otras cuentas por pagar", dec2024: liabilities.current.dec2024.otherPayables || null, dec2025: liabilities.current.dec2025.otherPayables, indent: 1 },
    { label: "Total Pasivo Corriente", dec2024: liabilities.current.dec2024.totalCurrent, dec2025: liabilities.current.dec2025.totalCurrent, isTotal: true, indent: 1 },
    { label: "", dec2024: null, dec2025: null }, // Separator
    { label: "Total Pasivo", dec2024: liabilities.current.dec2024.totalLiabilities, dec2025: liabilities.current.dec2025.totalLiabilities, isTotal: true },
    
    // Separator between sections
    { label: "", dec2024: null, dec2025: null },
    
    // PATRIMONIO
    { label: "Patrimonio Neto", dec2024: null, dec2025: null, isSection: true },
    { label: "Resultados Acumulados", dec2024: equity.dec2024.retainedEarnings, dec2025: equity.dec2025.retainedEarnings, indent: 1 },
    { label: "Ajuste por traducción", dec2024: equity.dec2024.translationAdjustment, dec2025: equity.dec2025.translationAdjustment, indent: 1 },
    { label: "Ingresos menos Gastos, del año", dec2024: equity.dec2024.currentYearResult, dec2025: equity.dec2025.currentYearResult, indent: 1 },
    { label: "Total Patrimonio Neto", dec2024: equity.dec2024.totalEquity, dec2025: equity.dec2025.totalEquity, isTotal: true },
    
    // Separator
    { label: "", dec2024: null, dec2025: null },
    
    // TOTAL
    { label: "TOTAL PASIVO Y PATRIMONIO", dec2024: assets.nonCurrent.dec2024.totalAssets, dec2025: assets.nonCurrent.dec2025.totalAssets, isTotal: true, isSection: true },
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
          Valores en US$ • Comparativo Diciembre 2024 vs Diciembre 2025
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-bold text-foreground">Valores en US$</TableHead>
              <TableHead className="text-right font-bold text-foreground w-[120px]">Diciembre 2024</TableHead>
              <TableHead className="text-right font-bold text-foreground w-[120px]">Diciembre 2025</TableHead>
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
                    {row.dec2024 !== null ? formatValue(row.dec2024) : ""}
                  </TableCell>
                  <TableCell className={`text-right font-mono ${row.isSection ? "font-bold" : ""} ${row.isTotal ? "font-semibold" : ""}`}>
                    {row.dec2025 !== null ? formatValue(row.dec2025) : ""}
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
