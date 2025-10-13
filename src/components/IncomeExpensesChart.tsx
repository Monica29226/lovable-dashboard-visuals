import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useLanguage } from "@/contexts/LanguageContext";

const incomeExpensesData = [
  {
    category: 'Ingresos',
    categoryEn: 'Income',
    amount: 354864,
    color: 'hsl(142, 76%, 36%)', // Green for income
    details: [
      { name: 'Cuotas Asociados', amount: 209067 },
      { name: 'Proyectos', amount: 145797 },
      { name: 'Otros', amount: 0 }
    ]
  },
  {
    category: 'Egresos',
    categoryEn: 'Expenses', 
    amount: 302975,
    color: 'hsl(0, 84%, 60%)', // Red for expenses
    details: [
      { name: 'Personal', amount: 183774 },
      { name: 'Gastos Administrativos', amount: 1953 },
      { name: 'Viáticos', amount: 24018 },
      { name: 'Comunicación y Eventos', amount: 26029 },
      { name: 'Tecnología', amount: 24402 },
      { name: 'Alquiler', amount: 11468 },
      { name: 'Servicios Profesionales', amount: 24027 },
      { name: 'Impuestos', amount: 5063 },
      { name: 'Depreciación', amount: 2242 }
    ]
  }
];

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const IncomeExpensesChart = () => {
  const { t } = useLanguage();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const categoryData = incomeExpensesData.find(item => 
        t('language') === 'es' ? item.category === label : item.categoryEn === label
      );
      
      return (
        <div className="bg-card border border-border rounded-lg p-4 shadow-lg max-w-xs">
          <p className="font-medium text-foreground mb-2">{label}</p>
          <p className="text-lg font-bold text-foreground mb-2">
            {formatCurrency(data.value)}
          </p>
          {categoryData && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Detalle:</p>
              {categoryData.details.map((detail, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{detail.name}:</span>
                  <span className="font-medium">{formatCurrency(detail.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const chartData = incomeExpensesData.map(item => ({
    name: t('language') === 'es' ? item.category : item.categoryEn,
    value: item.amount,
    color: item.color
  }));

  const netResult = incomeExpensesData[0].amount - incomeExpensesData[1].amount;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">
          Estado de Resultados 2025
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ingresos vs Egresos - Septiembre 2025 (US$)
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart */}
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Table */}
          <div className="space-y-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-3">Resumen Detallado</h3>
              
              {/* Income Section */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-green-700 dark:text-green-400">Ingresos</span>
                  <span className="font-bold text-green-700 dark:text-green-400">
                    {formatCurrency(354864)}
                  </span>
                </div>
                <div className="space-y-1 text-sm ml-4">
                  <div className="flex justify-between text-muted-foreground">
                    <span>• Cuotas Asociados</span>
                    <span>{formatCurrency(209067)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>• Proyectos</span>
                    <span>{formatCurrency(145797)}</span>
                  </div>
                </div>
              </div>

              {/* Expenses Section */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-red-600 dark:text-red-400">Egresos</span>
                  <span className="font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(302975)}
                  </span>
                </div>
                <div className="space-y-1 text-sm ml-4">
                  <div className="flex justify-between text-muted-foreground">
                    <span>• Personal</span>
                    <span>{formatCurrency(183774)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>• Gastos Administrativos</span>
                    <span>{formatCurrency(1953)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>• Viáticos</span>
                    <span>{formatCurrency(24018)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>• Comunicación y Eventos</span>
                    <span>{formatCurrency(26029)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>• Tecnología</span>
                    <span>{formatCurrency(24402)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>• Alquiler</span>
                    <span>{formatCurrency(11468)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>• Servicios Profesionales</span>
                    <span>{formatCurrency(24027)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>• Impuestos</span>
                    <span>{formatCurrency(5063)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>• Depreciación</span>
                    <span>{formatCurrency(2242)}</span>
                  </div>
                </div>
              </div>

              {/* Net Result */}
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-foreground">Resultado Neto</span>
                  <span className={`font-bold text-lg ${netResult > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(netResult)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};