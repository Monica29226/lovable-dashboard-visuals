
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const budgetData = [
  {
    category: 'Ingresos',
    presupuesto: 162868198.63,
    ejecucionReal: 85420038.63,
    faltantePorEjecutar: 77448160.0,
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
          Presupuesto vs. Ejecución
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Comparativo de ingresos planificados y ejecutados (US$)
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
                name === 'presupuesto' ? 'Presupuesto' :
                name === 'ejecucionReal' ? 'Ejecución Real' : 'Faltante por Ejecutar'
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
              fill="#ef4444" 
              name="Presupuesto"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="ejecucionReal" 
              fill="#8b5cf6" 
              name="Ejecución Real"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="faltantePorEjecutar" 
              fill="#d97706" 
              name="Faltante por Ejecutar"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
