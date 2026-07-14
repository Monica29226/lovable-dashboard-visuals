import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useLanguage } from "@/contexts/LanguageContext";
import { formatUsd, getStatementChartData, horizonteFinancials } from "@/data/horizonteFinancialModel";

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{ value: number }>;
}

export const IncomeExpensesChart = () => {
  const { t } = useLanguage();
  const statement = horizonteFinancials.statements["2025"];
  const incomeExpensesData = getStatementChartData("2025");
  const incomeDetails = incomeExpensesData[0]?.details ?? [];
  const expenseDetails = incomeExpensesData[1]?.details ?? [];

  const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const categoryData = incomeExpensesData.find(item => 
        t('language') === 'es' ? item.category === label : item.categoryEn === label
      );
      
      return (
        <div className="bg-card border border-border rounded-lg p-4 shadow-lg max-w-xs">
          <p className="font-medium text-foreground mb-2">{label}</p>
          <p className="text-lg font-bold text-foreground mb-2">
            {formatUsd(data.value)}
          </p>
          {categoryData && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Detalle:</p>
              {categoryData.details.map((detail, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{detail.name}:</span>
                  <span className="font-medium">{formatUsd(detail.amount)}</span>
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

  const netResult = statement.netResult;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">
          Estado de Resultados 2025
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ingresos vs Egresos - {statement.period} (US$)
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart */}
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Table */}
          <div className="space-y-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-3">Resumen Detallado</h3>
              
              {/* Income Section */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-primary">Ingresos</span>
                  <span className="font-bold text-primary">
                    {formatUsd(statement.income)}
                  </span>
                </div>
                  <div className="space-y-1 text-sm ml-4">
                    <div className="flex justify-between text-muted-foreground">
                      <span>• {incomeDetails[0]?.name}</span>
                      <span>{formatUsd(incomeDetails[0]?.amount ?? 0)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>• {incomeDetails[1]?.name}</span>
                      <span>{formatUsd(incomeDetails[1]?.amount ?? 0)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>• {incomeDetails[2]?.name}</span>
                      <span>{formatUsd(incomeDetails[2]?.amount ?? 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Expenses Section */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-accent">Egresos</span>
                    <span className="font-bold text-accent">
                      {formatUsd(statement.expenses)}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm ml-4">
                    <div className="flex justify-between text-muted-foreground">
                      <span>• {expenseDetails[0]?.name}</span>
                      <span>{formatUsd(expenseDetails[0]?.amount ?? 0)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>• {expenseDetails[1]?.name}</span>
                      <span>{formatUsd(expenseDetails[1]?.amount ?? 0)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>• {expenseDetails[2]?.name}</span>
                      <span>{formatUsd(expenseDetails[2]?.amount ?? 0)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>• {expenseDetails[3]?.name}</span>
                      <span>{formatUsd(expenseDetails[3]?.amount ?? 0)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>• {expenseDetails[4]?.name}</span>
                      <span>{formatUsd(expenseDetails[4]?.amount ?? 0)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>• {expenseDetails[5]?.name}</span>
                      <span>{formatUsd(expenseDetails[5]?.amount ?? 0)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>• {expenseDetails[6]?.name}</span>
                      <span>{formatUsd(expenseDetails[6]?.amount ?? 0)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>• {expenseDetails[7]?.name}</span>
                      <span>{formatUsd(expenseDetails[7]?.amount ?? 0)}</span>
                    </div>
                  </div>
                </div>

              {/* Net Result */}
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-foreground">Resultado Neto</span>
                  <span className={`font-bold text-lg ${netResult > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {formatUsd(netResult)}
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
