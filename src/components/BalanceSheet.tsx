import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

// Datos detallados del Balance General
const balanceSheetData = {
  assets: {
    current: {
      dec2024: {
        cashColones: 1621,
        cashDollars: 79893,
        totalCash: 81520,
        accountsReceivable: 32961,
        totalCurrent: 147171
      },
      aug2025: {
        cashColones: 433,
        cashDollars: 74563,
        totalCash: 75003,
        accountsReceivable: 47359,
        totalCurrent: 158017
      }
    },
    nonCurrent: {
      dec2024: {
        deferredTax: 29038,
        anticipatedRent: 3652,
        equipment: 26445,
        computerEquipment: 26445,
        accumulatedDepreciation: -18332,
        totalNonCurrent: 7513,
        totalAssets: 154684
      },
      aug2025: {
        deferredTax: 29236,
        anticipatedRent: 6419,
        equipment: 26445,
        computerEquipment: 26445,
        accumulatedDepreciation: -20324,
        totalNonCurrent: 5521,
        totalAssets: 163538
      }
    }
  },
  liabilities: {
    current: {
      dec2024: {
        accountsPayable: 72,
        taxesPayable: 3334,
        vatPayable: 0,
        accumulatedExpenses: 16277,
        otherPayables: 0,
        totalCurrent: 19683,
        totalLiabilities: 19683
      },
      aug2025: {
        accountsPayable: 1831,
        taxesPayable: 2508,
        vatPayable: 0,
        accumulatedExpenses: 8870,
        otherPayables: 2003,
        totalCurrent: 15211,
        totalLiabilities: 15211
      }
    }
  },
  equity: {
    dec2024: {
      retainedEarnings: 51232,
      translationAdjustment: 33151,
      currentYearResult: 50618,
      totalEquity: 135001
    },
    aug2025: {
      retainedEarnings: 135001,
      translationAdjustment: -1513,
      currentYearResult: 14839,
      totalEquity: 148327
    }
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const BalanceSheet = () => {
  const { t } = useLanguage();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-foreground text-center">
          Asociación Horizonte Positivo
        </CardTitle>
        <div className="text-center">
          <h3 className="text-xl font-semibold text-foreground">
            Estado de Posición Financiera Comparativo
          </h3>
          <p className="text-sm text-muted-foreground">Valores en US$</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 border border-border font-semibold"></th>
                <th className="text-center p-3 border border-border font-semibold text-primary">
                  Diciembre 2024
                </th>
                <th className="text-center p-3 border border-border font-semibold text-secondary">
                  Agosto 2025
                </th>
              </tr>
            </thead>
            <tbody>
              {/* ACTIVOS */}
              <tr>
                <td className="p-3 border border-border font-bold text-primary text-lg">ACTIVOS</td>
                <td className="p-3 border border-border"></td>
                <td className="p-3 border border-border"></td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Cuenta Colones Bac San José</td>
                <td className="p-3 border border-border text-right">{formatCurrency(balanceSheetData.assets.current.dec2024.cashColones)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(balanceSheetData.assets.current.aug2025.cashColones)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Cuenta Dólares Bac San José</td>
                <td className="p-3 border border-border text-right">{formatCurrency(balanceSheetData.assets.current.dec2024.cashDollars)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(balanceSheetData.assets.current.aug2025.cashDollars)}</td>
              </tr>
              
              <tr className="bg-primary/5">
                <td className="p-3 border border-border pl-6 font-semibold">Total Caja y Bancos</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(balanceSheetData.assets.current.dec2024.totalCash)}</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(balanceSheetData.assets.current.aug2025.totalCash)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Cuentas por Cobrar</td>
                <td className="p-3 border border-border text-right">{formatCurrency(balanceSheetData.assets.current.dec2024.accountsReceivable)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(balanceSheetData.assets.current.aug2025.accountsReceivable)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Cuenta por Cobrar NCR</td>
                <td className="p-3 border border-border text-right">-</td>
                <td className="p-3 border border-border text-right">-</td>
              </tr>
              
              <tr className="bg-primary/5">
                <td className="p-3 border border-border pl-6 font-semibold">Total Cuenta por cobrar</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(balanceSheetData.assets.current.dec2024.accountsReceivable)}</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(balanceSheetData.assets.current.aug2025.accountsReceivable)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Impuesto de Renta Diferido</td>
                <td className="p-3 border border-border text-right">{formatCurrency(balanceSheetData.assets.nonCurrent.dec2024.deferredTax)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(balanceSheetData.assets.nonCurrent.aug2025.deferredTax)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Anticipo de Renta</td>
                <td className="p-3 border border-border text-right">{formatCurrency(balanceSheetData.assets.nonCurrent.dec2024.anticipatedRent)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(balanceSheetData.assets.nonCurrent.aug2025.anticipatedRent)}</td>
              </tr>
              
              <tr className="bg-primary/10">
                <td className="p-3 border border-border font-bold text-primary">Total Activo Corriente</td>
                <td className="p-3 border border-border text-right font-bold text-primary">{formatCurrency(balanceSheetData.assets.current.dec2024.totalCurrent)}</td>
                <td className="p-3 border border-border text-right font-bold text-primary">{formatCurrency(balanceSheetData.assets.current.aug2025.totalCurrent)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Mobiliario y Equipo</td>
                <td className="p-3 border border-border text-right">-</td>
                <td className="p-3 border border-border text-right">-</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Equipo de Cómputo</td>
                <td className="p-3 border border-border text-right">{formatCurrency(balanceSheetData.assets.nonCurrent.dec2024.equipment)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(balanceSheetData.assets.nonCurrent.aug2025.equipment)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Depreciación Acumulada</td>
                <td className="p-3 border border-border text-right">{formatCurrency(balanceSheetData.assets.nonCurrent.dec2024.accumulatedDepreciation)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(balanceSheetData.assets.nonCurrent.aug2025.accumulatedDepreciation)}</td>
              </tr>
              
              <tr className="bg-primary/5">
                <td className="p-3 border border-border font-semibold text-primary">Total Activo Fijo</td>
                <td className="p-3 border border-border text-right font-semibold text-primary">{formatCurrency(balanceSheetData.assets.nonCurrent.dec2024.totalNonCurrent)}</td>
                <td className="p-3 border border-border text-right font-semibold text-primary">{formatCurrency(balanceSheetData.assets.nonCurrent.aug2025.totalNonCurrent)}</td>
              </tr>
              
              <tr className="bg-primary/20">
                <td className="p-3 border border-border font-bold text-primary text-lg">TOTAL ACTIVOS</td>
                <td className="p-3 border border-border text-right font-bold text-primary text-lg">{formatCurrency(balanceSheetData.assets.nonCurrent.dec2024.totalAssets)}</td>
                <td className="p-3 border border-border text-right font-bold text-primary text-lg">{formatCurrency(balanceSheetData.assets.nonCurrent.aug2025.totalAssets)}</td>
              </tr>

              {/* PASIVOS */}
              <tr>
                <td className="p-3 border border-border font-bold text-secondary text-lg pt-6">PASIVOS</td>
                <td className="p-3 border border-border"></td>
                <td className="p-3 border border-border"></td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Cuentas por Pagar</td>
                <td className="p-3 border border-border text-right">{formatCurrency(balanceSheetData.liabilities.current.dec2024.accountsPayable)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(balanceSheetData.liabilities.current.aug2025.accountsPayable)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Impuestos por Pagar (IVA)</td>
                <td className="p-3 border border-border text-right">{formatCurrency(balanceSheetData.liabilities.current.dec2024.taxesPayable)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(balanceSheetData.liabilities.current.aug2025.taxesPayable)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Impuesto de Renta</td>
                <td className="p-3 border border-border text-right">-</td>
                <td className="p-3 border border-border text-right">-</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Gastos Acumulados por Pagar</td>
                <td className="p-3 border border-border text-right">{formatCurrency(balanceSheetData.liabilities.current.dec2024.accumulatedExpenses)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(balanceSheetData.liabilities.current.aug2025.accumulatedExpenses)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Otras cuentas por pagar</td>
                <td className="p-3 border border-border text-right">-</td>
                <td className="p-3 border border-border text-right">{formatCurrency(balanceSheetData.liabilities.current.aug2025.otherPayables)}</td>
              </tr>
              
              <tr className="bg-secondary/10">
                <td className="p-3 border border-border font-bold text-secondary">Total Pasivo Corriente</td>
                <td className="p-3 border border-border text-right font-bold text-secondary">{formatCurrency(balanceSheetData.liabilities.current.dec2024.totalCurrent)}</td>
                <td className="p-3 border border-border text-right font-bold text-secondary">{formatCurrency(balanceSheetData.liabilities.current.aug2025.totalCurrent)}</td>
              </tr>
              
              <tr className="bg-secondary/20">
                <td className="p-3 border border-border font-bold text-secondary text-lg">Total Pasivo</td>
                <td className="p-3 border border-border text-right font-bold text-secondary text-lg">{formatCurrency(balanceSheetData.liabilities.current.dec2024.totalLiabilities)}</td>
                <td className="p-3 border border-border text-right font-bold text-secondary text-lg">{formatCurrency(balanceSheetData.liabilities.current.aug2025.totalLiabilities)}</td>
              </tr>

              {/* PATRIMONIO */}
              <tr>
                <td className="p-3 border border-border font-bold text-chart-4 text-lg pt-6">Patrimonio Neto</td>
                <td className="p-3 border border-border"></td>
                <td className="p-3 border border-border"></td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Resultados Acumulados</td>
                <td className="p-3 border border-border text-right">{formatCurrency(balanceSheetData.equity.dec2024.retainedEarnings)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(balanceSheetData.equity.aug2025.retainedEarnings)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Ajuste por traducción</td>
                <td className="p-3 border border-border text-right">{formatCurrency(balanceSheetData.equity.dec2024.translationAdjustment)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(balanceSheetData.equity.aug2025.translationAdjustment)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Excedente ejercicio corriente del año</td>
                <td className="p-3 border border-border text-right">{formatCurrency(balanceSheetData.equity.dec2024.currentYearResult)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(balanceSheetData.equity.aug2025.currentYearResult)}</td>
              </tr>
              
              <tr className="bg-chart-4/20">
                <td className="p-3 border border-border font-bold text-chart-4 text-lg">Total Patrimonio Neto</td>
                <td className="p-3 border border-border text-right font-bold text-chart-4 text-lg">{formatCurrency(balanceSheetData.equity.dec2024.totalEquity)}</td>
                <td className="p-3 border border-border text-right font-bold text-chart-4 text-lg">{formatCurrency(balanceSheetData.equity.aug2025.totalEquity)}</td>
              </tr>

              <tr className="bg-foreground/5">
                <td className="p-3 border border-border font-bold text-foreground text-xl">TOTAL PASIVO Y PATRIMONIO</td>
                <td className="p-3 border border-border text-right font-bold text-foreground text-xl">{formatCurrency(balanceSheetData.assets.nonCurrent.dec2024.totalAssets)}</td>
                <td className="p-3 border border-border text-right font-bold text-foreground text-xl">{formatCurrency(balanceSheetData.assets.nonCurrent.aug2025.totalAssets)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};