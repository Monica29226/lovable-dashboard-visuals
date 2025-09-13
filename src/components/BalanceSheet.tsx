import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useLanguage } from "@/contexts/LanguageContext";

const balanceData = [
  {
    category: 'assets',
    dec2024: 154684,
    aug2025: 163538
  },
  {
    category: 'liabilities', 
    dec2024: 19683,
    aug2025: 15211
  },
  {
    category: 'equity',
    dec2024: 135001,
    aug2025: 148327
  }
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const BalanceSheet = () => {
  const { t } = useLanguage();
  
  const chartData = balanceData.map(item => ({
    name: t(item.category),
    [t('dec2024')]: item.dec2024,
    [t('aug2025')]: item.aug2025
  }));
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">
          {t('balance')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('balanceSubtitle')}
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart 
            data={chartData} 
            layout="horizontal"
            margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
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
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              width={70}
            />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), '']}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar 
              dataKey={t('dec2024')} 
              fill="hsl(var(--primary))"
              radius={[0, 4, 4, 0]}
            />
            <Bar 
              dataKey={t('aug2025')} 
              fill="hsl(var(--secondary))"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};