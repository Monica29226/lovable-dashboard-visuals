
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const topIncomeData = [
  { name: 'IPME EMPRESARIAL', amount: 48118691.93, color: '#3b82f6' },
  { name: 'Cuota afiliación 2025 - Rodrigo Uribe', amount: 15091200.0, color: '#f97316' },
  { name: 'Cuota afiliación 2025 - Wilhelm Steinvorth', amount: 15058800.0, color: '#22c55e' },
  { name: 'Proyecto Horizonte Positivo - Industrias Kerns', amount: 11294100.0, color: '#ef4444' },
  { name: 'Membresía 2025', amount: 8167110.0, color: '#8b5cf6' },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const TopIncomeChart = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">
          Top 5 Fuentes de Ingresos
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Principales fuentes de ingresos por descripción (US$)
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart 
            data={topIncomeData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            layout="horizontal"
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              type="number"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickFormatter={formatCurrency}
            />
            <YAxis 
              type="category"
              dataKey="name"
              tick={{ fontSize: 10 }}
              className="text-muted-foreground"
              width={200}
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
              dataKey="amount" 
              fill="#3b82f6"
              radius={[0, 4, 4, 0]}
            >
              {topIncomeData.map((entry, index) => (
                <Bar key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
