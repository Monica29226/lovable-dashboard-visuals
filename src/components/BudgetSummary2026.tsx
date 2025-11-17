import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface BudgetRow {
  category: string;
  level: number;
  january: number;
  february: number;
  march: number;
  april: number;
  may: number;
  june: number;
  july: number;
  august: number;
  september: number;
  october: number;
  november: number;
  december: number;
  total: number;
  parent_category?: string;
}

interface BudgetSummary2026Props {
  budgetData: BudgetRow[];
}

const COLORS = {
  income: 'hsl(var(--chart-1))',
  expenses: 'hsl(var(--chart-2))',
  net: 'hsl(var(--chart-3))'
};

const BudgetSummary2026 = ({ budgetData }: BudgetSummary2026Props) => {
  const { language } = useLanguage();

  const texts = {
    es: {
      title: 'Resumen del Presupuesto 2026',
      majorAccounts: 'Cuentas Mayores',
      income: 'INGRESOS',
      expenses: 'EGRESOS',
      netResult: 'Resultado Neto',
      incomeVsExpenses: 'Ingresos vs Egresos',
      distribution: 'Distribución del Presupuesto',
      category: 'Categoría',
      amount: 'Monto',
      total: 'Total'
    },
    en: {
      title: '2026 Budget Summary',
      majorAccounts: 'Major Accounts',
      income: 'INCOME',
      expenses: 'EXPENSES',
      netResult: 'Net Result',
      incomeVsExpenses: 'Income vs Expenses',
      distribution: 'Budget Distribution',
      category: 'Category',
      amount: 'Amount',
      total: 'Total'
    }
  };

  const t = texts[language];

  // Obtener totales de ingresos y egresos
  const incomeRow = budgetData.find(row => row.category.includes('INGRESO') || row.category === 'INCOME');
  const expensesRow = budgetData.find(row => row.category.includes('EGRESO') || row.category === 'EXPENSES');

  const totalIncome = incomeRow?.total || 0;
  const totalExpenses = expensesRow?.total || 0;
  const netResult = totalIncome - totalExpenses;

  // Obtener categorías de nivel 1 para cada tipo
  const incomeCategories = budgetData.filter(row => 
    row.level === 1 && row.parent_category && (row.parent_category.includes('INGRESO') || row.parent_category === 'INCOME')
  );

  const expenseCategories = budgetData.filter(row => 
    row.level === 1 && row.parent_category && (row.parent_category.includes('EGRESO') || row.parent_category === 'EXPENSES')
  );

  // Datos para el gráfico de barras
  const chartData = [
    {
      name: t.income,
      value: totalIncome,
      fill: COLORS.income
    },
    {
      name: t.expenses,
      value: totalExpenses,
      fill: COLORS.expenses
    },
    {
      name: t.netResult,
      value: netResult,
      fill: COLORS.net
    }
  ];

  // Datos para el gráfico de pastel (distribución de ingresos)
  const incomePieData = incomeCategories.map(cat => ({
    name: cat.category,
    value: cat.total
  }));

  // Datos para el gráfico de pastel (distribución de egresos)
  const expensesPieData = expenseCategories.map(cat => ({
    name: cat.category,
    value: cat.total
  }));

  const PIE_COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  const formatCurrency = (value: number) => {
    return `₡${value.toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Resumen de Cuentas Mayores */}
      <Card>
        <CardHeader>
          <CardTitle>{t.majorAccounts}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[hsl(var(--chart-1))]">{t.income}</h3>
              <p className="text-3xl font-bold">{formatCurrency(totalIncome)}</p>
              <div className="space-y-1 mt-4">
                {incomeCategories.map((cat, idx) => (
                  <div key={idx} className="flex justify-between text-sm border-b pb-1">
                    <span className="text-muted-foreground">{cat.category}</span>
                    <span className="font-medium">{formatCurrency(cat.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[hsl(var(--chart-2))]">{t.expenses}</h3>
              <p className="text-3xl font-bold">{formatCurrency(totalExpenses)}</p>
              <div className="space-y-1 mt-4">
                {expenseCategories.map((cat, idx) => (
                  <div key={idx} className="flex justify-between text-sm border-b pb-1">
                    <span className="text-muted-foreground">{cat.category}</span>
                    <span className="font-medium">{formatCurrency(cat.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[hsl(var(--chart-3))]">{t.netResult}</h3>
              <p className={`text-3xl font-bold ${netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netResult)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Barras: Ingresos vs Egresos */}
      <Card>
        <CardHeader>
          <CardTitle>{t.incomeVsExpenses}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-sm" />
              <YAxis 
                tickFormatter={(value) => `₡${(value / 1000).toFixed(0)}k`}
                className="text-sm"
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="value" fill="fill" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráficos de Pastel: Distribución */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución de Ingresos */}
        <Card>
          <CardHeader>
            <CardTitle>{t.distribution} - {t.income}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={incomePieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {incomePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución de Egresos */}
        <Card>
          <CardHeader>
            <CardTitle>{t.distribution} - {t.expenses}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expensesPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expensesPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BudgetSummary2026;
