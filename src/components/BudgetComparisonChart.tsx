
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Paleta de colores Seaborn
const seabornColors = {
  red: '#c44e52',
  purple: '#8172b3',
  brown: '#937860'
};

const budgetData = [
  {
    category: 'Ingresos 2025',
    presupuesto: 562709,
    ejecucionReal: 227717,
    pendienteEjecutar: 334992,
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

export const BudgetComparisonChart = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">
          Estado de Resultados - Presupuesto vs. Ejecución
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Comparativo de ingresos planificados y ejecutados (US$) - Enero-Mayo 2025
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={budgetData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                name === 'presupuesto' ? 'Presupuesto Anual' :
                name === 'ejecucionReal' ? 'Ejecución Real (Mayo)' : 'Pendiente por Ejecutar'
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
              dataKey="presupuesto" 
              fill={seabornColors.red}
              name="Presupuesto Anual"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="ejecucionReal" 
              fill={seabornColors.purple}
              name="Ejecución Real (Mayo)"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="pendienteEjecutar" 
              fill={seabornColors.brown}
              name="Pendiente por Ejecutar"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
