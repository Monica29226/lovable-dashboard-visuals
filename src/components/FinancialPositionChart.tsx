import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useLanguage } from "@/contexts/LanguageContext";
import { balanceSheetData } from "@/data/balanceSheetData";

const financialPositionColors = [
  'hsl(220, 90%, 25%)',  // Dark blue for Assets
  'hsl(220, 80%, 45%)',  // Medium blue for Liabilities
  'hsl(15, 85%, 65%)'    // Orange for Equity
];

// Datos dinámicos basados en balanceSheetData (Diciembre 2025)
const getPositionData = () => {
  const assets = balanceSheetData.assets;
  const liabilities = balanceSheetData.liabilities;
  const equity = balanceSheetData.equity;

  return [
    {
      name: 'Activos',
      nameEn: 'Assets',
      value: assets.nonCurrent.dec2025.totalAssets,
      color: financialPositionColors[0],
      details: [
        { label: 'Cuenta Colones Bac San José', amount: assets.current.dec2025.cashColones },
        { label: 'Cuenta Dólares Bac San José', amount: assets.current.dec2025.cashDollars },
        { label: 'Total Caja y Bancos', amount: assets.current.dec2025.totalCash },
        { label: 'Cuentas por Cobrar', amount: assets.current.dec2025.accountsReceivable },
        { label: 'Impuesto de Renta Diferido', amount: assets.current.dec2025.deferredTax },
        { label: 'Anticipo de Renta', amount: assets.current.dec2025.anticipatedRent },
        { label: 'Total Activo Corriente', amount: assets.current.dec2025.totalCurrent },
        { label: 'Equipo de Cómputo', amount: assets.nonCurrent.dec2025.computerEquipment },
        { label: 'Depreciación Acumulada', amount: assets.nonCurrent.dec2025.accumulatedDepreciation },
        { label: 'Total Activo Fijo', amount: assets.nonCurrent.dec2025.totalNonCurrent }
      ]
    },
    {
      name: 'Pasivos',
      nameEn: 'Liabilities', 
      value: liabilities.current.dec2025.totalLiabilities,
      color: financialPositionColors[1],
      details: [
        { label: 'Cuentas por Pagar', amount: liabilities.current.dec2025.accountsPayable },
        { label: 'Impuestos por Pagar (IVA)', amount: liabilities.current.dec2025.taxesPayable },
        { label: 'Gastos Acumulados por Pagar', amount: liabilities.current.dec2025.accumulatedExpenses },
        { label: 'Otras cuentas por pagar', amount: liabilities.current.dec2025.otherPayables },
        { label: 'Total Pasivo Corriente', amount: liabilities.current.dec2025.totalCurrent }
      ]
    },
    {
      name: 'Patrimonio',
      nameEn: 'Equity',
      value: equity.dec2025.totalEquity,
      color: financialPositionColors[2],
      details: [
        { label: 'Ganancias Retenidas', amount: equity.dec2025.retainedEarnings },
        { label: 'Ajuste por traducción', amount: equity.dec2025.translationAdjustment },
        { label: 'Ingresos menos Gastos del año', amount: equity.dec2025.currentYearResult },
        { label: 'Total Patrimonio Neto', amount: equity.dec2025.totalEquity }
      ]
    }
  ];
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const FinancialPositionChart = () => {
  const { t } = useLanguage();
  const positionData = getPositionData();

  const chartData = positionData.map(item => ({
    name: t('language') === 'es' ? item.name : item.nameEn,
    value: item.value,
    color: item.color
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">
          {t('financialPosition')} - Diciembre 2025
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Distribución por categorías principales (US$)
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => (
                <span style={{ color: entry.color }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};