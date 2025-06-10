
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Paleta de colores Seaborn
const seabornColors = {
  blue: '#4c72b0',
  green: '#55a868'
};

const incomeData = [
  {
    category: 'Mayo 2025',
    ingresosAsociados: 154050, // Ingresos Asociados (antes H+)
    ingresosComunidad: 73667, // Ingresos Comunidad (antes IPME)
  }
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const IncomeBySourceChart = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">
          Ingresos por Fuente - Mayo 2025
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Comparativo de ingresos Asociados vs Comunidad (US$)
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={incomeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="category" 
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickFormatter={formatCurrency}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                formatCurrency(value), 
                name === 'ingresosAsociados' ? 'Ingresos Asociados' : 'Ingresos Comunidad'
              ]}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar 
              dataKey="ingresosAsociados" 
              fill={seabornColors.blue}
              name="Ingresos Asociados"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="ingresosComunidad" 
              fill={seabornColors.green}
              name="Ingresos Comunidad"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
