
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Paleta de colores Seaborn
const seabornColors = ['#4c72b0', '#dd8452', '#55a868', '#c44e52', '#8172b3', '#937860', '#da8bc3', '#8c8c8c'];

const topIncomeData = [
  { name: 'Cuotas Asociados', amount: 250650, percentage: '45%' },
  { name: 'Proyectos', amount: 262059, percentage: '47%' },
  { name: 'Otros Ingresos', amount: 50000, percentage: '8%' },
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
          Composición del Presupuesto de Ingresos 2025
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Distribución por categorías principales (US$)
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart 
            data={topIncomeData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="name"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickFormatter={formatCurrency}
            />
            <Tooltip 
              formatter={(value: number, name: string, props: any) => [
                formatCurrency(value), 
                `${props.payload.percentage} del total`
              ]}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
              {topIncomeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={seabornColors[index % seabornColors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
