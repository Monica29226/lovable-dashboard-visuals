import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useBudget, BudgetRow } from "@/contexts/BudgetContext";

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const EXPENSE_COLORS = [
  'hsl(220, 70%, 50%)', 'hsl(15, 80%, 55%)', 'hsl(45, 90%, 50%)',
  'hsl(150, 60%, 40%)', 'hsl(280, 60%, 55%)', 'hsl(340, 70%, 50%)',
  'hsl(200, 80%, 45%)', 'hsl(30, 80%, 50%)',
];

export const IncomeExpensesChart2026 = () => {
  const { budgetData, derived } = useBudget();

  // Get level 1 income categories
  const incomeCategories = budgetData.filter(r => r.level === 1 && r.parent_category?.includes('INGRESO'));
  const expenseCategories = budgetData.filter(r => r.level === 1 && r.parent_category?.includes('EGRESO'));

  const incomeChartData = incomeCategories
    .filter(r => r.total > 0)
    .map((r, i) => ({
      name: r.category,
      value: r.total,
      color: i === 0 ? 'hsl(207, 100%, 28%)' : i === 1 ? 'hsl(207, 80%, 45%)' : 'hsl(207, 60%, 60%)',
    }));

  const expenseChartData = expenseCategories
    .filter(r => r.total > 0)
    .map((r, i) => ({
      name: r.category,
      value: r.total,
      color: EXPENSE_COLORS[i % EXPENSE_COLORS.length],
    }));

  const netResult = derived.netResult;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Income Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            Ingresos 2026
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Total: {formatCurrency(derived.totalIncome)}
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={incomeChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={100} paddingAngle={3} dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {incomeChartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-4">
            {incomeCategories.map((r, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">• {r.category}</span>
                <span className="font-medium">{formatCurrency(r.total)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expenses Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            Egresos 2026
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Total: {formatCurrency(derived.totalExpenses)}
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={expenseChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={100} paddingAngle={2} dataKey="value"
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {expenseChartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-4">
            {expenseCategories.map((r, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">• {r.category}</span>
                <span className="font-medium">{formatCurrency(r.total)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Net Result Summary */}
      <Card className="lg:col-span-2">
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total Ingresos</div>
              <div className="text-2xl font-bold text-primary">{formatCurrency(derived.totalIncome)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total Egresos</div>
              <div className="text-2xl font-bold text-secondary">{formatCurrency(derived.totalExpenses)}</div>
            </div>
            <div className={`p-4 rounded-lg ${netResult >= 0 ? 'bg-[#1B5E20]/10' : 'bg-[#B71C1C]/10'}`}>
              <div className="text-sm text-muted-foreground mb-1">Ingresos menos Gastos</div>
              <div className={`text-2xl font-bold ${netResult >= 0 ? 'text-[#1B5E20]' : 'text-[#B71C1C]'}`}>
                {formatCurrency(netResult)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
