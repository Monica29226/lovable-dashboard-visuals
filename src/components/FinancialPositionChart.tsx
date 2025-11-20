import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useLanguage } from "@/contexts/LanguageContext";

const financialPositionColors = [
  'hsl(220, 90%, 25%)',  // Dark blue for Assets
  'hsl(220, 80%, 45%)',  // Medium blue for Liabilities
  'hsl(15, 85%, 65%)'    // Orange for Equity
];

const positionData = [
  {
    name: 'Activos',
    nameEn: 'Assets',
    value: 231243,
    color: financialPositionColors[0],
    details: [
      { label: 'Cuenta Colones Bac San José', amount: 6214 },
      { label: 'Cuenta Dólares Bac San José', amount: 113940 },
      { label: 'Total Caja y Bancos', amount: 120154 },
      { label: 'Cuentas por Cobrar', amount: 62072 },
      { label: 'Total Cuenta por cobrar', amount: 62072 },
      { label: 'Impuesto de Renta Diferido', amount: 29515 },
      { label: 'Anticipo de Renta', amount: 6460 },
      { label: 'Total Activo Corriente', amount: 218201 },
      { label: 'Equipo de Cómputo', amount: 26445 },
      { label: 'Depreciación Acumulada', amount: -21624 },
      { label: 'Total Activo Fijo', amount: 13042 }
    ]
  },
  {
    name: 'Pasivos',
    nameEn: 'Liabilities', 
    value: 16826,
    color: financialPositionColors[1],
    details: [
      { label: 'Cuentas por Pagar', amount: 608 },
      { label: 'Impuestos por Pagar (IVA)', amount: 1655 },
      { label: 'Gastos Acumulados por Pagar', amount: 11422 },
      { label: 'Otras cuentas por pagar', amount: 3140 },
      { label: 'Total Pasivo Corriente', amount: 16826 }
    ]
  },
  {
    name: 'Patrimonio',
    nameEn: 'Equity',
    value: 214417,
    color: financialPositionColors[2],
    details: [
      { label: 'Ganancias Retenidas', amount: 135001 },
      { label: 'Ajuste por traducción', amount: -2091 },
      { label: 'Ingresos menos Gastos del año', amount: 81507 },
      { label: 'Total Patrimonio Neto', amount: 214417 }
    ]
  }
];

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
          {t('financialPosition')} - Octubre 2025
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