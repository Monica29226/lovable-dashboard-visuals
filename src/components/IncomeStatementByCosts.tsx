import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from "@/contexts/LanguageContext";

const expensesData = [
  { category: 'personal', amount: 166021 },
  { category: 'technology', amount: 22591 },
  { category: 'representation', amount: 21760 },
  { category: 'professional', amount: 20304 },
  { category: 'communication', amount: 20049 },
  { category: 'rent', amount: 9697 },
  { category: 'taxes', amount: 4493 },
  { category: 'depreciation', amount: 1992 }
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const IncomeStatementByCosts = () => {
  const { t } = useLanguage();
  
  const chartData = expensesData
    .map(item => ({
      name: t(item.category),
      amount: item.amount
    }))
    .sort((a, b) => b.amount - a.amount);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">
          {t('resultsTitle')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('resultsSubtitle')}
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart 
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="name"
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickFormatter={formatCurrency}
            />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), t('expenses')]}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Bar 
              dataKey="amount" 
              fill="hsl(var(--destructive))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};