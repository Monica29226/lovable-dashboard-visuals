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
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Diciembre 2024 */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            {t('balance')} - {t('dec2024')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* ACTIVOS */}
            <div>
              <h3 className="text-lg font-bold text-primary mb-3">ACTIVOS</h3>
              
              {/* Activos Corrientes */}
              <div className="ml-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Cuenta Colones Bac San José</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.assets.current.dec2024.cashColones)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Cuenta Dólares Bac San José</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.assets.current.dec2024.cashDollars)}</span>
                </div>
                <div className="flex justify-between font-semibold border-b border-gray-300 pb-1">
                  <span className="text-sm">Total Caja y Bancos</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.assets.current.dec2024.totalCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Cuentas por Cobrar</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.assets.current.dec2024.accountsReceivable)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Cuenta por Cobrar NCR</span>
                  <span className="text-sm">-</span>
                </div>
                <div className="flex justify-between font-bold border-t border-gray-600 pt-1">
                  <span className="text-sm">Total Cuenta por cobrar</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.assets.current.dec2024.accountsReceivable)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Impuesto de Renta Diferido</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.assets.nonCurrent.dec2024.deferredTax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Anticipo de Renta</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.assets.nonCurrent.dec2024.anticipatedRent)}</span>
                </div>
                <div className="flex justify-between font-bold text-primary border-t-2 border-primary pt-2">
                  <span className="text-sm">Total Activo Corriente</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.assets.current.dec2024.totalCurrent)}</span>
                </div>
              </div>

              {/* Activos No Corrientes */}
              <div className="ml-4 space-y-2 mt-4">
                <div className="flex justify-between">
                  <span className="text-sm">Mobiliario y Equipo</span>
                  <span className="text-sm">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Equipo de Cómputo</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.assets.nonCurrent.dec2024.equipment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Depreciación Acumulada</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.assets.nonCurrent.dec2024.accumulatedDepreciation)}</span>
                </div>
                <div className="flex justify-between font-bold text-primary border-t border-gray-300 pt-1">
                  <span className="text-sm">Total Activo Fijo</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.assets.nonCurrent.dec2024.totalNonCurrent)}</span>
                </div>
              </div>

              <div className="flex justify-between font-bold text-lg text-primary border-t-2 border-primary pt-3 mt-4">
                <span>TOTAL ACTIVOS</span>
                <span>{formatCurrency(balanceSheetData.assets.nonCurrent.dec2024.totalAssets)}</span>
              </div>
            </div>

            {/* PASIVOS */}
            <div className="mt-6">
              <h3 className="text-lg font-bold text-secondary mb-3">PASIVOS</h3>
              <div className="ml-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Cuentas por Pagar</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.liabilities.current.dec2024.accountsPayable)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Impuestos por Pagar (IVA)</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.liabilities.current.dec2024.taxesPayable)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Impuesto de Renta</span>
                  <span className="text-sm">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Gastos Acumulados por Pagar</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.liabilities.current.dec2024.accumulatedExpenses)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Otras cuentas por pagar</span>
                  <span className="text-sm">-</span>
                </div>
                <div className="flex justify-between font-bold text-secondary border-t-2 border-secondary pt-2">
                  <span className="text-sm">Total Pasivo Corriente</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.liabilities.current.dec2024.totalCurrent)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-secondary border-t-2 border-secondary pt-2">
                  <span>Total Pasivo</span>
                  <span>{formatCurrency(balanceSheetData.liabilities.current.dec2024.totalLiabilities)}</span>
                </div>
              </div>
            </div>

            {/* PATRIMONIO */}
            <div className="mt-6">
              <h3 className="text-lg font-bold text-chart-4 mb-3">Patrimonio Neto</h3>
              <div className="ml-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Resultados Acumulados</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.equity.dec2024.retainedEarnings)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Ajuste por traducción</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.equity.dec2024.translationAdjustment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Excedente ejercicio corriente del año</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.equity.dec2024.currentYearResult)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-chart-4 border-t-2 border-chart-4 pt-2">
                  <span>Total Patrimonio Neto</span>
                  <span>{formatCurrency(balanceSheetData.equity.dec2024.totalEquity)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between font-bold text-xl text-foreground border-t-4 border-foreground pt-3 mt-4">
              <span>TOTAL PASIVO Y PATRIMONIO</span>
              <span>{formatCurrency(balanceSheetData.assets.nonCurrent.dec2024.totalAssets)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agosto 2025 */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            {t('balance')} - {t('aug2025')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* ACTIVOS */}
            <div>
              <h3 className="text-lg font-bold text-primary mb-3">ACTIVOS</h3>
              
              {/* Activos Corrientes */}
              <div className="ml-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Cuenta Colones Bac San José</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.assets.current.aug2025.cashColones)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Cuenta Dólares Bac San José</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.assets.current.aug2025.cashDollars)}</span>
                </div>
                <div className="flex justify-between font-semibold border-b border-gray-300 pb-1">
                  <span className="text-sm">Total Caja y Bancos</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.assets.current.aug2025.totalCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Cuentas por Cobrar</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.assets.current.aug2025.accountsReceivable)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Cuenta por Cobrar NCR</span>
                  <span className="text-sm">-</span>
                </div>
                <div className="flex justify-between font-bold border-t border-gray-600 pt-1">
                  <span className="text-sm">Total Cuenta por cobrar</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.assets.current.aug2025.accountsReceivable)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Impuesto de Renta Diferido</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.assets.nonCurrent.aug2025.deferredTax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Anticipo de Renta</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.assets.nonCurrent.aug2025.anticipatedRent)}</span>
                </div>
                <div className="flex justify-between font-bold text-primary border-t-2 border-primary pt-2">
                  <span className="text-sm">Total Activo Corriente</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.assets.current.aug2025.totalCurrent)}</span>
                </div>
              </div>

              {/* Activos No Corrientes */}
              <div className="ml-4 space-y-2 mt-4">
                <div className="flex justify-between">
                  <span className="text-sm">Mobiliario y Equipo</span>
                  <span className="text-sm">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Equipo de Cómputo</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.assets.nonCurrent.aug2025.equipment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Depreciación Acumulada</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.assets.nonCurrent.aug2025.accumulatedDepreciation)}</span>
                </div>
                <div className="flex justify-between font-bold text-primary border-t border-gray-300 pt-1">
                  <span className="text-sm">Total Activo Fijo</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.assets.nonCurrent.aug2025.totalNonCurrent)}</span>
                </div>
              </div>

              <div className="flex justify-between font-bold text-lg text-primary border-t-2 border-primary pt-3 mt-4">
                <span>TOTAL ACTIVOS</span>
                <span>{formatCurrency(balanceSheetData.assets.nonCurrent.aug2025.totalAssets)}</span>
              </div>
            </div>

            {/* PASIVOS */}
            <div className="mt-6">
              <h3 className="text-lg font-bold text-secondary mb-3">PASIVOS</h3>
              <div className="ml-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Cuentas por Pagar</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.liabilities.current.aug2025.accountsPayable)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Impuestos por Pagar (IVA)</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.liabilities.current.aug2025.taxesPayable)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Impuesto de Renta</span>
                  <span className="text-sm">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Gastos Acumulados por Pagar</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.liabilities.current.aug2025.accumulatedExpenses)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Otras cuentas por pagar</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.liabilities.current.aug2025.otherPayables)}</span>
                </div>
                <div className="flex justify-between font-bold text-secondary border-t-2 border-secondary pt-2">
                  <span className="text-sm">Total Pasivo Corriente</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.liabilities.current.aug2025.totalCurrent)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-secondary border-t-2 border-secondary pt-2">
                  <span>Total Pasivo</span>
                  <span>{formatCurrency(balanceSheetData.liabilities.current.aug2025.totalLiabilities)}</span>
                </div>
              </div>
            </div>

            {/* PATRIMONIO */}
            <div className="mt-6">
              <h3 className="text-lg font-bold text-chart-4 mb-3">Patrimonio Neto</h3>
              <div className="ml-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Resultados Acumulados</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.equity.aug2025.retainedEarnings)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Ajuste por traducción</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.equity.aug2025.translationAdjustment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Excedente ejercicio corriente del año</span>
                  <span className="text-sm">{formatCurrency(balanceSheetData.equity.aug2025.currentYearResult)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-chart-4 border-t-2 border-chart-4 pt-2">
                  <span>Total Patrimonio Neto</span>
                  <span>{formatCurrency(balanceSheetData.equity.aug2025.totalEquity)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between font-bold text-xl text-foreground border-t-4 border-foreground pt-3 mt-4">
              <span>TOTAL PASIVO Y PATRIMONIO</span>
              <span>{formatCurrency(balanceSheetData.assets.nonCurrent.aug2025.totalAssets)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};