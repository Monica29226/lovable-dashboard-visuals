
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useState } from 'react';

// Paleta de colores Seaborn
const seabornColors = {
  blue: '#4c72b0',
  orange: '#dd8452', 
  green: '#55a868',
  red: '#c44e52',
  purple: '#8172b3',
  brown: '#937860',
  pink: '#da8bc3',
  gray: '#8c8c8c'
};

const positionData = [
  { 
    name: 'Activos', 
    value: 212521, 
    color: seabornColors.blue,
    details: [
      { name: 'Cuenta Colones Bac San José', value: 467 },
      { name: 'Cuenta Dólares Bac San José', value: 79372 },
      { name: 'Total Caja y Bancos', value: 79839, isSubtotal: true },
      { name: 'Cuentas por Cobrar', value: 92301 },
      { name: 'Cuentas por Cobrar BNCR', value: 0 },
      { name: 'Total Cuenta por cobrar', value: 92301, isSubtotal: true },
      { name: 'Impuesto de Renta Diferido', value: 29196 },
      { name: 'Anticipo de Renta', value: 3672 },
      { name: 'Total Activo Corriente', value: 205008, isSubtotal: true },
      { name: 'Mobiliario y Equipo', value: 26445 },
      { name: 'Equipo de Cómputo', value: 26445 },
      { name: 'Depreciación Acumulada', value: -18932 },
      { name: 'Total Activo Fijo', value: 7513, isSubtotal: true }
    ]
  },
  { 
    name: 'Pasivos', 
    value: 16613, 
    color: seabornColors.red,
    details: [
      { name: 'Cuentas por Pagar', value: 2720 },
      { name: 'Impuestos por Pagar (IVA)', value: 313 },
      { name: 'Impuesto de Renta', value: 0 },
      { name: 'Gastos Acumulados por Pagar', value: 13145 },
      { name: 'Otras cuentas por pagar', value: 1565 }
    ]
  },
  { 
    name: 'Patrimonio', 
    value: 195908, 
    color: seabornColors.green,
    details: [
      { name: 'Capital Social', value: 195908 }
    ]
  },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const FinancialPositionChart = () => {
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const handleBarClick = (data: any) => {
    console.log('Bar clicked:', data);
    const item = positionData.find(item => item.name === data.name);
    console.log('Found item:', item);
    setSelectedItem(item);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            Estado de Posición Financiera
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Distribución de activos, pasivos y patrimonio (US$) - Mayo 2025
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={positionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickFormatter={formatCurrency}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Monto']}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="value" 
                radius={[4, 4, 0, 0]}
                onClick={handleBarClick}
                cursor="pointer"
              >
                {positionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Haga clic en las barras para ver el detalle
          </p>
        </CardContent>
      </Card>

      {selectedItem ? (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground">
              Detalle de {selectedItem.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Composición detallada (US$)
            </p>
          </CardHeader>
          <CardContent>
            {selectedItem.details && selectedItem.details.length > 0 ? (
              <div className="space-y-3">
                {selectedItem.details.map((detail: any, index: number) => (
                  <div 
                    key={index} 
                    className={`flex justify-between items-center p-3 rounded-lg ${
                      detail.isSubtotal 
                        ? 'bg-primary/10 border-l-4 border-primary font-bold' 
                        : 'bg-muted'
                    }`}
                  >
                    <span className={`${detail.isSubtotal ? 'font-bold text-primary' : 'font-medium'}`}>
                      {detail.name}
                    </span>
                    <span className={`${detail.isSubtotal ? 'font-bold text-primary' : 'font-bold text-foreground'}`}>
                      {formatCurrency(detail.value)}
                    </span>
                  </div>
                ))}
                <div className="border-t-2 pt-4 flex justify-between items-center font-bold text-lg">
                  <span>Total {selectedItem.name}</span>
                  <span className="text-foreground">{formatCurrency(selectedItem.value)}</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No hay elementos registrados en este período
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full flex items-center justify-center">
          <CardContent className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              Seleccione una barra del gráfico para ver el detalle
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Haga clic en Activos, Pasivos o Patrimonio
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
