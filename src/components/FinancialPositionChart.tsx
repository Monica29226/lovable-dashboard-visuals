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
    value: 202413,
    color: financialPositionColors[0],
    details: [
      { label: 'Cuenta Colones Bac San José', amount: 6513 },
      { label: 'Cuenta Dólares Bac San José', amount: 81669 },
      { label: 'Total Caja y Bancos', amount: 88182 },
      { label: 'Cuentas por Cobrar', amount: 73076 },
      { label: 'Total Cuenta por cobrar', amount: 73076 },
      { label: 'Impuesto de Renta Diferido', amount: 29424 },
      { label: 'Anticipo de Renta', amount: 6460 },
      { label: 'Total Activo Corriente', amount: 197142 },
      { label: 'Equipo de Cómputo', amount: 26445 },
      { label: 'Depreciación Acumulada', amount: -21174 },
      { label: 'Total Activo Fijo', amount: 5271 }
    ]
  },
  {
    name: 'Pasivos',
    nameEn: 'Liabilities', 
    value: 17638,
    color: financialPositionColors[1],
    details: [
      { label: 'Cuentas por Pagar', amount: 747 },
      { label: 'Impuestos por Pagar (IVA)', amount: 257 },
      { label: 'Gastos Acumulados por Pagar', amount: 14597 },
      { label: 'Otras cuentas por pagar', amount: 2037 },
      { label: 'Total Pasivo Corriente', amount: 17638 }
    ]
  },
  {
    name: 'Patrimonio',
    nameEn: 'Equity',
    value: 184775,
    color: financialPositionColors[2],
    details: [
      { label: 'Resultados Acumulados', amount: 135001 },
      { label: 'Ajuste por traducción', amount: -2115 },
      { label: 'Ingresos menos Gastos del año', amount: 51889 },
      { label: 'Total Patrimonio Neto', amount: 184775 }
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
          {t('financialPosition')} - Septiembre 2025
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