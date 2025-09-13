import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";

const seabornColors = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))', 
  'hsl(var(--accent))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))'
];

const positionData = [
  {
    name: 'Activos',
    nameEn: 'Assets',
    value: 163538,
    color: seabornColors[0],
    details: [
      { label: 'Cuentas Colonos-Banco San José', amount: 433 },
      { label: 'Cuenta Corriente-Banco San José', amount: 74563 },
      { label: 'Total Caja y Bancos', amount: 75003 },
      { label: 'Cuentas por Cobrar', amount: 47353 },
      { label: 'Total Cuenta por cobrar', amount: 47353 },
      { label: 'Impuesto de Renta Diferido', amount: 29236 },
      { label: 'Anticipo de Renta', amount: 6419 },
      { label: 'Total Activo Corriente', amount: 158017 },
      { label: 'Mobiliario y Equipo', amount: 26445 },
      { label: 'Depreciación Acumulada', amount: -20924 },
      { label: 'Total Activo Fijo', amount: 5521 }
    ]
  },
  {
    name: 'Pasivos',
    nameEn: 'Liabilities', 
    value: 15211,
    color: seabornColors[1],
    details: [
      { label: 'Cuentas por Pagar', amount: 1831 },
      { label: 'Impuestos por Pagar (IVA)', amount: 2508 },
      { label: 'Gastos Acumulados por Pagar', amount: 8870 },
      { label: 'Otras cuentas por pagar', amount: 2003 },
      { label: 'Total Pasivo Corriente', amount: 15211 }
    ]
  },
  {
    name: 'Patrimonio',
    nameEn: 'Equity',
    value: 148327,
    color: seabornColors[2],
    details: [
      { label: 'Resultados Acumulados', amount: 135001 },
      { label: 'Ajuste por Reexpresión', amount: 1519 },
      { label: 'Ingresos menos Gastos del año', amount: 14838 },
      { label: 'Total Patrimonio Neto', amount: 148327 }
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
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const handlePieClick = (data: any) => {
    const item = positionData.find(p => p.value === data.value);
    setSelectedItem(item);
  };

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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            {t('financialPosition')} - Agosto 2025
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
                onClick={handlePieClick}
                className="cursor-pointer"
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

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            {selectedItem ? `Detalle: ${selectedItem.name}` : 'Detalle de Categorías'}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {selectedItem ? 'Componentes principales' : 'Haz clic en el gráfico para ver detalles'}
          </p>
        </CardHeader>
        <CardContent>
          {selectedItem ? (
            <div className="space-y-3">
              <div className="text-lg font-semibold text-primary mb-4">
                Total: {formatCurrency(selectedItem.value)}
              </div>
              {selectedItem.details.map((detail: any, index: number) => (
                <div 
                  key={index} 
                  className={`flex justify-between items-center p-2 rounded ${
                    detail.label.includes('Total') ? 'bg-primary/10 font-semibold' : 'bg-muted/50'
                  }`}
                >
                  <span className="text-sm">{detail.label}</span>
                  <span className={`text-sm font-medium ${
                    detail.amount < 0 ? 'text-destructive' : 'text-foreground'
                  }`}>
                    {formatCurrency(detail.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <p className="text-lg mb-2">📊</p>
                <p>Selecciona una sección del gráfico</p>
                <p className="text-sm">para ver su desglose detallado</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};