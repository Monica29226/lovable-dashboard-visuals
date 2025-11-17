import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useLanguage } from "@/contexts/LanguageContext";

// Data for 2024 expenses
const expenses2024Data = [
  { category: 'personal', amount: 142573 },
  { category: 'technology', amount: 15460 },
  { category: 'representation', amount: 5224 },
  { category: 'professional', amount: 9023 },
  { category: 'communication', amount: 5831 },
  { category: 'rent', amount: 8605 },
  { category: 'taxes', amount: 2971 },
  { category: 'depreciation', amount: 2097 },
  { category: 'administrative', amount: 3500 },
  { category: 'events', amount: 2800 },
  { category: 'other', amount: 11576 }
];

// Data for 2025 expenses
const expenses2025Data = [
  { category: 'personal', amount: 166021 },
  { category: 'technology', amount: 22591 },
  { category: 'representation', amount: 21760 },
  { category: 'professional', amount: 20304 },
  { category: 'communication', amount: 20049 },
  { category: 'rent', amount: 9697 },
  { category: 'taxes', amount: 4493 },
  { category: 'depreciation', amount: 1992 },
  { category: 'administrative', amount: 1721 },
  { category: 'events', amount: 0 },
  { category: 'other', amount: 0 }
];

const chartColors = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(220, 70%, 50%)',
  'hsl(15, 80%, 55%)',
  'hsl(200, 85%, 45%)',
  'hsl(280, 65%, 60%)',
  'hsl(140, 75%, 45%)',
  'hsl(45, 85%, 55%)'
];

const formatCurrency = (value: number) => {
  return `₡${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const ExpensesByYearChart = () => {
  const { t } = useLanguage();
  
  const categoryTranslations: { [key: string]: string } = {
    personal: t('personal'),
    technology: t('technology'),
    representation: t('representation'),
    professional: t('professional'),
    communication: t('communication'),
    rent: t('rent'),
    taxes: t('taxes'),
    depreciation: t('depreciation'),
    administrative: 'Gastos Administrativos',
    events: 'Eventos',
    other: 'Otros Gastos'
  };
  
  const chartData2024 = expenses2024Data
    .map((item, index) => ({
      name: categoryTranslations[item.category] || item.category,
      amount: item.amount,
      color: chartColors[index],
      percentage: Math.round((item.amount / expenses2024Data.reduce((sum, exp) => sum + exp.amount, 0)) * 100)
    }))
    .sort((a, b) => b.amount - a.amount);

  const chartData2025 = expenses2025Data
    .filter(item => item.amount > 0) // Filter out zero amounts
    .map((item, index) => ({
      name: categoryTranslations[item.category] || item.category,
      amount: item.amount,
      color: chartColors[index],
      percentage: Math.round((item.amount / expenses2025Data.reduce((sum, exp) => sum + exp.amount, 0)) * 100)
    }))
    .sort((a, b) => b.amount - a.amount);

  const total2024 = expenses2024Data.reduce((sum, exp) => sum + exp.amount, 0);
  const total2025 = expenses2025Data.reduce((sum, exp) => sum + exp.amount, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-accent font-semibold">
            {formatCurrency(data.value)} ({data.payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* 2024 Pie Chart */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            {t('resultsTitle')} - 2024
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enero-Diciembre 2024 (Real) - Total: {formatCurrency(total2024)}
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={chartData2024}
                cx="50%"
                cy="50%"
                outerRadius={100}
                paddingAngle={2}
                dataKey="amount"
                label={({ name, percentage }) => `${percentage}%`}
              >
                {chartData2024.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom"
                height={60}
                formatter={(value, entry: any) => (
                  <span style={{ color: entry.color, fontSize: '12px' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 2025 Pie Chart */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            {t('resultsTitle')} - 2025
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Agosto 2025 (Real) - Total: {formatCurrency(total2025)}
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={chartData2025}
                cx="50%"
                cy="50%"
                outerRadius={100}
                paddingAngle={2}
                dataKey="amount"
                label={({ name, percentage }) => `${percentage}%`}
              >
                {chartData2025.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom"
                height={60}
                formatter={(value, entry: any) => (
                  <span style={{ color: entry.color, fontSize: '12px' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Comparison Summary */}
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            Comparativo de Egresos 2024 vs 2025
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Variación en principales categorías de gastos
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <div className="text-2xl font-bold text-primary">{formatCurrency(total2024)}</div>
              <div className="text-sm text-muted-foreground">Total 2024</div>
            </div>
            <div className="text-center p-4 bg-accent/10 rounded-lg">
              <div className="text-2xl font-bold text-accent">{formatCurrency(total2025)}</div>
              <div className="text-sm text-muted-foreground">Total 2025</div>
            </div>
            <div className="text-center p-4 bg-chart-4/10 rounded-lg">
              <div className="text-2xl font-bold text-chart-4">
                {formatCurrency(total2025 - total2024)}
              </div>
              <div className="text-sm text-muted-foreground">Incremento</div>
            </div>
            <div className="text-center p-4 bg-chart-5/10 rounded-lg">
              <div className="text-2xl font-bold text-chart-5">
                {Math.round(((total2025 - total2024) / total2024) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">% Crecimiento</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};