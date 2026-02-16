import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';

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

// Shared chart colors — same tokens used in FinancialProjection2027
const chartConfig = {
  Ingresos: { label: "Ingresos", color: "hsl(142, 71%, 45%)" },
  Egresos: { label: "Egresos", color: "hsl(45, 93%, 47%)" },
  "Resultado Neto": { label: "Resultado Neto", color: "hsl(217, 91%, 60%)" },
};

const PIE_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

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
      incomeDistribution: 'Distribución de Ingresos',
      expenseDistribution: 'Distribución de Egresos',
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
      incomeDistribution: 'Income Distribution',
      expenseDistribution: 'Expense Distribution',
      category: 'Category',
      amount: 'Amount',
      total: 'Total'
    }
  };

  const t = texts[language];

  const calculateCategoryTotal = (categoryName: string, categoryRow: BudgetRow) => {
    const subcategories = budgetData.filter(row => 
      row.level === 2 && row.parent_category === categoryName
    );
    if (subcategories.length > 0) {
      return subcategories.reduce((sum, cat) => sum + (cat.total || 0), 0);
    } else {
      return categoryRow.total || 0;
    }
  };

  const incomeCategories = budgetData.filter(row => 
    row.level === 1 && row.parent_category && (row.parent_category.includes('INGRESO') || row.parent_category === 'INCOME')
  );

  const expenseCategories = budgetData.filter(row => 
    row.level === 1 && row.parent_category && (row.parent_category.includes('EGRESO') || row.parent_category === 'EXPENSES')
  );

  const totalIncome = incomeCategories.reduce((sum, cat) => sum + calculateCategoryTotal(cat.category, cat), 0);
  const totalExpenses = expenseCategories.reduce((sum, cat) => sum + calculateCategoryTotal(cat.category, cat), 0);
  const netResult = totalIncome - totalExpenses;

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Bar chart data — same structure as projection tab
  const barData = [
    {
      year: "2026",
      Ingresos: Math.round(totalIncome),
      Egresos: Math.round(totalExpenses),
      "Resultado Neto": Math.round(netResult),
    },
  ];

  // Pie data
  const incomePieData = incomeCategories
    .map(cat => ({ name: cat.category, value: calculateCategoryTotal(cat.category, cat) }))
    .filter(item => item.value > 0);

  const expensesPieData = expenseCategories
    .map(cat => ({ name: cat.category, value: calculateCategoryTotal(cat.category, cat) }))
    .filter(item => item.value > 0);

  const pieConfig = Object.fromEntries(
    [...incomePieData, ...expensesPieData].map((d, i) => [
      d.name, { label: d.name, color: PIE_COLORS[i % PIE_COLORS.length] }
    ])
  );

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
                  const catTotal = calculateCategoryTotal(cat.category, cat);
                  const percentage = totalIncome > 0 ? (catTotal / totalIncome * 100) : 0;
                  if (catTotal === 0) return null;
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
                  const catTotal = calculateCategoryTotal(cat.category, cat);
                  const percentage = totalExpenses > 0 ? (catTotal / totalExpenses * 100) : 0;
                  if (catTotal === 0) return null;
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

      {/* Bar Chart — same style as Projection tab */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t.incomeVsExpenses} — 2026</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px]">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="Ingresos" fill="var(--color-Ingresos)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Egresos" fill="var(--color-Egresos)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Resultado Neto" fill="var(--color-Resultado Neto)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Pie Charts — distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t.incomeDistribution}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={pieConfig} className="h-[300px]">
              <PieChart>
                <Pie
                  data={incomePieData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {incomePieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t.expenseDistribution}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={pieConfig} className="h-[300px]">
              <PieChart>
                <Pie
                  data={expensesPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {expensesPieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BudgetSummary2026;
