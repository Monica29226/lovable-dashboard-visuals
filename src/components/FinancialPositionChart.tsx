
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from 'react';

const positionData = [
  { 
    name: 'Activos', 
    value: 205008, 
    color: '#3b82f6',
    details: [
      { name: 'Caja y Bancos', value: 79839 },
      { name: 'Cuentas por Cobrar', value: 92301 },
      { name: 'Impuesto de Renta Diferido', value: 29196 },
      { name: 'Anticipo de Renta', value: 3672 }
    ]
  },
  { 
    name: 'Pasivos', 
    value: 0, 
    color: '#f97316',
    details: []
  },
  { 
    name: 'Patrimonio', 
    value: 205008, 
    color: '#22c55e',
    details: [
      { name: 'Capital Social', value: 205008 }
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
    const item = positionData.find(item => item.name === data.name);
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
            Distribución de activos, pasivos y patrimonio (US$) - Abril 2025
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
                  <Bar key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {selectedItem && (
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
            {selectedItem.details.length > 0 ? (
              <div className="space-y-4">
                {selectedItem.details.map((detail: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">{detail.name}</span>
                    <span className="font-bold text-foreground">{formatCurrency(detail.value)}</span>
                  </div>
                ))}
                <div className="border-t pt-3 flex justify-between items-center font-bold text-lg">
                  <span>Total {selectedItem.name}</span>
                  <span className="text-foreground">{formatCurrency(selectedItem.value)}</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No hay pasivos registrados en este período
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
