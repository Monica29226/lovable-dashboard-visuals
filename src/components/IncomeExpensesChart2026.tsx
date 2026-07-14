import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { financialData2026, formatCurrency2026, getIncomeExpensesChartData2026 } from "@/data/financialData2026";

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{ value: number }>;
}

export const IncomeExpensesChart2026 = () => {
  const { incomeStatement, period } = financialData2026;
  const incomeExpensesData = getIncomeExpensesChartData2026();
  const incomeDetails = incomeExpensesData[0]?.details ?? [];
  const expenseDetails = incomeExpensesData[1]?.details ?? [];

  const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const categoryData = incomeExpensesData.find(item => item.category === label);

      return (
        <div className="bg-card border border-border rounded-lg p-4 shadow-lg max-w-xs">
          <p className="font-medium text-foreground mb-2">{label}</p>
          <p className="text-lg font-bold text-foreground mb-2">
            {formatCurrency2026(data.value)}
          </p>
          {categoryData && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Detalle:</p>
              {categoryData.details.map((detail, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{detail.name}:</span>
                  <span className="font-medium">{formatCurrency2026(detail.amount)}</span>
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
    name: item.category,
    value: item.amount,
    color: item.color,
  }));

  const netResult = incomeStatement.netResult;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">
          Estado de Resultados 2026
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ingresos vs Egresos - {period} (US$)
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
                    {formatCurrency2026(incomeStatement.income.total)}
                  </span>
                </div>
                <div className="space-y-1 text-sm ml-4">
                  {incomeDetails.map((detail, index) => (
                    <div key={index} className="flex justify-between text-muted-foreground">
                      <span>• {detail.name}</span>
                      <span>{formatCurrency2026(detail.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expenses Section */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-accent">Egresos</span>
                  <span className="font-bold text-accent">
                    {formatCurrency2026(incomeStatement.expenses.total)}
                  </span>
                </div>
                <div className="space-y-1 text-sm ml-4">
                  {expenseDetails.map((detail, index) => (
                    <div key={index} className="flex justify-between text-muted-foreground">
                      <span>• {detail.name}</span>
                      <span>{formatCurrency2026(detail.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Net Result */}
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-foreground">Resultado Neto</span>
                  <span className={`font-bold text-lg ${netResult > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {formatCurrency2026(netResult)}
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
