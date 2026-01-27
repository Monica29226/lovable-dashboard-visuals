import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from "@/contexts/LanguageContext";
import { incomeStatementData } from "@/data/incomeStatementData";

const incomeData2024 = [
  {
    source: 'Cuotas Asociados',
    sourceEn: 'Membership Fees',
    amount: 225650,
    color: 'hsl(var(--primary))'
  },
  {
    source: 'Membresía',
    sourceEn: 'Membership',
    amount: 212097,
    color: 'hsl(var(--secondary))'
  }
];

// Dynamic data from centralized income statement
const getIncomeData2025 = () => [
  {
    source: 'Cuotas de Asociados',
    sourceEn: 'Membership Fees',
    amount: incomeStatementData.income.cuotasAsociados,
    color: 'hsl(var(--primary))'
  },
  {
    source: 'Membresía',
    sourceEn: 'Membership',
    amount: incomeStatementData.income.membresia,
    color: 'hsl(var(--secondary))'
  }
];

const communityBreakdown = [
  { label: 'Ingresos Comunidad', value: 148465, color: 'hsl(var(--secondary))' },
  { label: 'Egresos Comunidad', value: 109004, color: 'hsl(var(--destructive))' }
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const IncomeBySourceChart = () => {
  const { t } = useLanguage();
  
  // Get dynamic 2025 data from centralized source
  const incomeData2025 = getIncomeData2025();

  const chartData2024 = incomeData2024.map(item => ({
    name: t('language') === 'es' ? item.source : item.sourceEn,
    value: item.amount,
    color: item.color
  }));

  const chartData2025 = incomeData2025.map(item => ({
    name: t('language') === 'es' ? item.source : item.sourceEn,
    value: item.amount,
    color: item.color
  }));

  const total2024 = incomeData2024.reduce((sum, item) => sum + item.amount, 0);
  const total2025 = incomeStatementData.income.total;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 2024 Income Chart */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            Fuentes de {t('income')} - 2024
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enero-Diciembre 2024 - Total: {formatCurrency(total2024)}
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData2024}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData2024.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry: any) => (
                  <span style={{ color: entry.color }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center p-3 bg-primary/10 rounded-lg">
              <div className="text-lg font-bold text-primary">{formatCurrency(225650)}</div>
              <div className="text-xs text-muted-foreground">Cuotas Asociados</div>
            </div>
            <div className="text-center p-3 bg-secondary/10 rounded-lg">
              <div className="text-lg font-bold text-secondary">{formatCurrency(212097)}</div>
              <div className="text-xs text-muted-foreground">Membresía</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2025 Income Chart */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            Fuentes de {t('income')} - 2025
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {incomeStatementData.period} - Total: {formatCurrency(total2025)}
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData2025}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData2025.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry: any) => (
                  <span style={{ color: entry.color }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center p-3 bg-primary/10 rounded-lg">
              <div className="text-lg font-bold text-primary">{formatCurrency(incomeStatementData.income.cuotasAsociados)}</div>
              <div className="text-xs text-muted-foreground">Cuotas Asociados</div>
            </div>
            <div className="text-center p-3 bg-secondary/10 rounded-lg">
              <div className="text-lg font-bold text-secondary">{formatCurrency(incomeStatementData.income.membresia)}</div>
              <div className="text-xs text-muted-foreground">Membresía</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

};