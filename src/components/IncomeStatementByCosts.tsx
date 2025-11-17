import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

// Data for 2024 (Jan-Aug actual)
const expenses2024Data = [
  { category: 'personal', amount: 142573 },
  { category: 'technology', amount: 15450 },
  { category: 'representation', amount: 15214 },
  { category: 'communication', amount: 11158 },
  { category: 'professional', amount: 9023 },
  { category: 'rent', amount: 8605 },
  { category: 'taxes', amount: 2971 },
  { category: 'administrative', amount: 2570 },
  { category: 'depreciation', amount: 2097 }
];

// Data for 2025 (Aug actual)
const expenses2025Data = [
  { category: 'personal', amount: 166021 },
  { category: 'technology', amount: 22591 },
  { category: 'representation', amount: 21760 },
  { category: 'professional', amount: 20304 },
  { category: 'communication', amount: 20049 },
  { category: 'rent', amount: 9697 },
  { category: 'taxes', amount: 4493 },
  { category: 'depreciation', amount: 1992 }
];

const chartColors = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--secondary))',
  'hsl(220, 70%, 50%)',
  'hsl(15, 80%, 55%)',
  'hsl(200, 85%, 45%)'
];

const formatCurrency = (value: number) => {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatCurrencyShort = (value: number) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return formatCurrency(value);
};

export const IncomeStatementByCosts = () => {
  const { t } = useLanguage();
  
  const chartData2024 = expenses2024Data
    .map((item, index) => ({
      name: t(item.category),
      amount: item.amount,
      color: chartColors[index],
      percentage: Math.round((item.amount / expenses2024Data.reduce((sum, exp) => sum + exp.amount, 0)) * 100)
    }))
    .sort((a, b) => b.amount - a.amount);

  const chartData2025 = expenses2025Data
    .map((item, index) => ({
      name: t(item.category),
      amount: item.amount,
      color: chartColors[index],
      percentage: Math.round((item.amount / expenses2025Data.reduce((sum, exp) => sum + exp.amount, 0)) * 100)
    }))
    .sort((a, b) => b.amount - a.amount);

  const total2024 = expenses2024Data.reduce((sum, exp) => sum + exp.amount, 0);
  const total2025 = expenses2025Data.reduce((sum, exp) => sum + exp.amount, 0);


  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* 2024 Statement */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            {t('resultsTitle')} - 2024
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enero-Agosto 2024 (Real)
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {chartData2024.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm font-medium text-foreground">{item.name}</span>
                <span className="text-sm font-semibold text-primary">{formatCurrency(item.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-3 mt-4 border-t-2 border-primary bg-primary/5 px-3 rounded">
              <span className="text-base font-bold text-foreground">Total</span>
              <span className="text-base font-bold text-primary">{formatCurrency(total2024)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2025 Statement */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            {t('resultsTitle')} - 2025
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Agosto 2025 (Real)
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {chartData2025.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm font-medium text-foreground">{item.name}</span>
                <span className="text-sm font-semibold text-primary">{formatCurrency(item.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-3 mt-4 border-t-2 border-primary bg-primary/5 px-3 rounded">
              <span className="text-base font-bold text-foreground">Total</span>
              <span className="text-base font-bold text-primary">{formatCurrency(total2025)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Summary */}
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            Comparativo de Crecimiento 2024 vs 2025
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Variación en principales categorías de gastos
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <div className="text-2xl font-bold text-primary">{formatCurrencyShort(total2024)}</div>
              <div className="text-sm text-muted-foreground">Total 2024</div>
            </div>
            <div className="text-center p-4 bg-accent/10 rounded-lg">
              <div className="text-2xl font-bold text-accent">{formatCurrencyShort(total2025)}</div>
              <div className="text-sm text-muted-foreground">Total 2025</div>
            </div>
            <div className="text-center p-4 bg-chart-4/10 rounded-lg">
              <div className="text-2xl font-bold text-chart-4">
                {formatCurrencyShort(total2025 - total2024)}
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