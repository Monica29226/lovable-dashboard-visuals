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
      income: 'INGRESOS',
      expenses: 'EGRESOS',
      netResult: 'Ingresos menos Egresos',
      incomeVsExpenses: 'Ingresos vs Egresos',
      distribution: 'Distribución del Presupuesto',
      category: 'Categoría',
      amount: 'Monto',
      total: 'Total'
    },
    en: {
      title: '2026 Budget Summary',
      income: 'INCOME',
      expenses: 'EXPENSES',
      netResult: 'Income minus Expenses',
      incomeVsExpenses: 'Income vs Expenses',
      distribution: 'Budget Distribution',
      category: 'Category',
      amount: 'Amount',
      total: 'Total'
    }
  };

  const t = texts[language];

  // Función para calcular total de una categoría desde sus subcategorías (nivel 2)
  const calculateCategoryTotal = (categoryName: string) => {
    const subcategories = budgetData.filter(row => 
      row.level === 2 && row.parent_category === categoryName
    );
    return subcategories.reduce((sum, cat) => sum + (cat.total || 0), 0);
  };

  // Obtener totales de ingresos y egresos sumando subcategorías
  const incomeCategories = budgetData.filter(row => 
    row.level === 1 && row.parent_category && (row.parent_category.includes('INGRESO') || row.parent_category === 'INCOME')
  );

  const expenseCategories = budgetData.filter(row => 
    row.level === 1 && row.parent_category && (row.parent_category.includes('EGRESO') || row.parent_category === 'EXPENSES')
  );

  // Calcular totales reales desde subcategorías
  const totalIncome = incomeCategories.reduce((sum, cat) => sum + calculateCategoryTotal(cat.category), 0);
  const totalExpenses = expenseCategories.reduce((sum, cat) => sum + calculateCategoryTotal(cat.category), 0);
  const netResult = totalIncome - totalExpenses;

  // Datos para el gráfico de pastel (distribución de ingresos) con totales calculados
  const incomePieData = incomeCategories
    .map(cat => ({
      name: cat.category,
      value: calculateCategoryTotal(cat.category)
    }))
    .filter(item => item.value > 0); // Solo mostrar categorías con valores

  // Datos para el gráfico de pastel (distribución de egresos) con totales calculados
  const expensesPieData = expenseCategories
    .map(cat => ({
      name: cat.category,
      value: calculateCategoryTotal(cat.category)
    }))
    .filter(item => item.value > 0); // Solo mostrar categorías con valores

  const PIE_COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6">
      {/* Resumen Principal */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[hsl(var(--chart-1))]">{t.income}</h3>
              <p className="text-3xl font-bold text-right">{formatCurrency(totalIncome)}</p>
              <div className="space-y-1 mt-4">
                {incomeCategories.map((cat, idx) => {
                  const catTotal = calculateCategoryTotal(cat.category);
                  const percentage = totalIncome > 0 ? (catTotal / totalIncome * 100) : 0;
                  if (catTotal === 0) return null; // No mostrar categorías sin monto
                  return (
                    <div key={idx} className="flex justify-between text-sm border-b pb-1">
                      <span className="text-muted-foreground">{cat.category}</span>
                      <div className="flex gap-1 items-baseline justify-end">
                        <span className="font-medium text-right">{formatCurrency(catTotal)}</span>
                        <span className="text-xs text-muted-foreground">({percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  );
                })}
                <div className="flex justify-end text-sm pt-2 border-t-2 border-primary mt-2">
                  <span className="text-xs font-semibold text-primary">(100%)</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[hsl(var(--chart-2))]">{t.expenses}</h3>
              <p className="text-3xl font-bold text-right">{formatCurrency(totalExpenses)}</p>
              <div className="space-y-1 mt-4">
                {expenseCategories.map((cat, idx) => {
                  const catTotal = calculateCategoryTotal(cat.category);
                  const percentage = totalExpenses > 0 ? (catTotal / totalExpenses * 100) : 0;
                  if (catTotal === 0) return null; // No mostrar categorías sin monto
                  return (
                    <div key={idx} className="flex justify-between text-sm border-b pb-1">
                      <span className="text-muted-foreground">{cat.category}</span>
                      <div className="flex gap-1 items-baseline justify-end">
                        <span className="font-medium text-right">{formatCurrency(catTotal)}</span>
                        <span className="text-xs text-muted-foreground">({percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  );
                })}
                <div className="flex justify-end text-sm pt-2 border-t-2 border-primary mt-2">
                  <span className="text-xs font-semibold text-primary">(100%)</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[hsl(var(--chart-3))]">{t.netResult}</h3>
              <p className={`text-3xl font-bold text-right ${netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netResult)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Distribución de Ingresos */}
      <Card>
        <CardHeader>
          <CardTitle>{t.distribution} - {t.income}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={incomePieData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                outerRadius={120}
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
              <Legend 
                verticalAlign="bottom" 
                height={80}
                wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetSummary2026;
