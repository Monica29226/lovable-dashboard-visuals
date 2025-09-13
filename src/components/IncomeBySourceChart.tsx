import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useLanguage } from "@/contexts/LanguageContext";

const incomeData = [
  {
    source: 'Cuotas de Asociados',
    sourceEn: 'Membership Fees',
    annualized: 135000,
    community: 0,
    total: 135000,
    color: 'hsl(var(--primary))'
  },
  {
    source: 'Proyectos/Comunidad',
    sourceEn: 'Projects/Community',
    annualized: 0,
    community: 148465,
    total: 148465,
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

  const chartData = incomeData.map(item => ({
    name: t('language') === 'es' ? item.source : item.sourceEn,
    value: item.total,
    color: item.color
  }));

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
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            Fuentes de {t('income')} - Agosto 2025
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Distribución por origen (US$)
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
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
              <div className="text-lg font-bold text-primary">{formatCurrency(135000)}</div>
              <div className="text-xs text-muted-foreground">Cuotas Asociados</div>
            </div>
            <div className="text-center p-3 bg-secondary/10 rounded-lg">
              <div className="text-lg font-bold text-secondary">{formatCurrency(148465)}</div>
              <div className="text-xs text-muted-foreground">Proyectos/Comunidad</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            Resultados {t('community')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Ingresos vs Egresos Comunidad - Agosto 2025
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={communityBreakdown} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="label"
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickFormatter={formatCurrency}
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
              <Bar 
                dataKey="value" 
                radius={[4, 4, 0, 0]}
              >
                {communityBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          
          <div className="text-center mt-4 p-3 bg-accent/10 rounded-lg">
            <div className="text-lg font-bold text-accent">
              {formatCurrency(148465 - 109004)} Resultado Neto
            </div>
            <div className="text-xs text-muted-foreground">
              Comunidad genera superávit de {formatCurrency(39461)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};