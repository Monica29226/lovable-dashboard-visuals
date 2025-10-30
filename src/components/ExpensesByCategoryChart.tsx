import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useLanguage } from "@/contexts/LanguageContext";

const expensesData = [
  {
    category: 'Prestaciones Legales',
    amount: 0,
  },
  {
    category: 'Viáticos',
    amount: 0,
  },
  {
    category: 'Comunicación y Mercado',
    amount: 0,
  },
  {
    category: 'Tecnología',
    amount: 0,
  },
  {
    category: 'Legal',
    amount: 0,
  },
];

export const ExpensesByCategoryChart = () => {
  const { t } = useLanguage();
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{payload[0].payload.category}</p>
          <p className="text-sm text-primary font-semibold">
            ${payload[0].value.toLocaleString()}
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
          Gastos por Categoría
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Distribución de gastos operativos
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={expensesData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="category" 
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--foreground))' }}
              label={{ 
                value: 'Monto ($)', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: 'hsl(var(--foreground))' }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={() => 'Gastos'}
            />
            <Bar 
              dataKey="amount" 
              fill="hsl(var(--destructive))"
              radius={[8, 8, 0, 0]}
              name="Gastos"
            />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {expensesData.map((expense, index) => (
            <div key={index} className="p-3 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">{expense.category}</div>
              <div className="text-lg font-bold text-foreground">
                ${expense.amount.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
