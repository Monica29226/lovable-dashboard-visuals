import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { getBudget2025Totals, horizonteFinancials } from "@/data/horizonteFinancialModel";

interface BudgetRow {
  category: string;
  level: number;
  total: number;
  parent_category?: string;
  [key: string]: string | number | undefined;
}

interface BudgetComparison {
  category: string;
  budget2025: number;
  budget2026: number;
  variation: number;
  percentage: number;
  level: number;
  parent_category?: string;
}

interface ComparativeBudget2025vs2026Props {
  budgetData: BudgetRow[];
}

const ComparativeBudget2025vs2026 = ({ budgetData }: ComparativeBudget2025vs2026Props) => {
  const { language } = useLanguage();

  const texts = {
    es: {
      title: 'Comparativa Presupuesto 2025 vs 2026',
      budget2025: 'Presupuesto 2025',
      budget2026: 'Presupuesto 2026',
      variation: 'Variación',
      percentage: '%',
    },
    en: {
      title: 'Budget Comparison 2025 vs 2026',
      budget2025: 'Budget 2025',
      budget2026: 'Budget 2026',
      variation: 'Variation',
      percentage: '%',
    }
  };
  const t = texts[language];

  const comparisonData = useMemo(() => {
    const comparison: BudgetComparison[] = [];
    const totals2025 = getBudget2025Totals();
    const budget2025Data: Record<string, number> = {
      INGRESOS: totals2025.incomeBudget,
      EGRESOS: totals2025.expensesBudget,
      "Ingresos menos Egresos": totals2025.netBudget,
      "Cuotas de Asociados": horizonteFinancials.budget2025.income.find((item) => item.name === "Cuotas Asociados")?.budget ?? 0,
      "Membresías de Empresas": horizonteFinancials.budget2025.income.find((item) => item.name === "Membresía")?.budget ?? 0,
      "Proyectos y membresías especiales": 0,
      Personal: horizonteFinancials.budget2025.expenses.find((item) => item.name === "Personal")?.budget ?? 0,
      "Gastos Administrativos": horizonteFinancials.budget2025.expenses.find((item) => item.name === "Gastos administrativos")?.budget ?? 0,
      "Viáticos y Giras": horizonteFinancials.budget2025.expenses.find((item) => item.name === "Viáticos")?.budget ?? 0,
      "Comunicación y Mercadeo": horizonteFinancials.budget2025.expenses.find((item) => item.name === "Comunicación y Mercadeo")?.budget ?? 0,
      "Servicios Profesionales": horizonteFinancials.budget2025.expenses.find((item) => item.name === "Servicios Profesionales")?.budget ?? 0,
      Tecnología: horizonteFinancials.budget2025.expenses.find((item) => item.name === "Tecnología")?.budget ?? 0,
      Impuestos: horizonteFinancials.budget2025.expenses.find((item) => item.name === "Impuesto de Renta")?.budget ?? 0,
      "Otros Gastos": horizonteFinancials.budget2025.expenses
        .filter((item) => item.name === "Otros Gastos / Patente / IVA" || item.name === "Depreciación")
        .reduce((sum, item) => sum + item.budget, 0),
    };

    const calculateCategoryTotal = (category: string, parentCategory: string) => {
      if (budgetData.length === 0) return 0;
      const children = budgetData.filter(row =>
        row.parent_category === category ||
        (row.parent_category === parentCategory && row.category === category)
      );
      if (children.length > 0) {
        return children.reduce((sum, child) => sum + (child.total || 0), 0);
      }
      const directRow = budgetData.find(row => row.category === category);
      return directRow?.total || 0;
    };

    const incomeCategories = ['Cuotas de Asociados', 'Membresías', 'Proyectos y membresías especiales'];
    const expenseCategories = ['Personal', 'Gastos Administrativos', 'Viáticos y Giras', 'Comunicación y Mercadeo',
                               'Servicios Profesionales', 'Tecnología', 'Impuestos', 'Otros Gastos'];

    // Income total
    let totalIncome2026 = 0;
    incomeCategories.forEach(cat => {
      totalIncome2026 += calculateCategoryTotal(cat, 'INGRESOS');
    });
    const budget2025Income = budget2025Data['INGRESOS'];
    comparison.push({
      category: 'Ingresos',
      budget2025: budget2025Income,
      budget2026: totalIncome2026,
      variation: totalIncome2026 - budget2025Income,
      percentage: budget2025Income !== 0 ? ((totalIncome2026 - budget2025Income) / budget2025Income * 100) : 0,
      level: 0
    });

    // Income subcategories
    incomeCategories.forEach(cat => {
      const budget2026Value = calculateCategoryTotal(cat, 'INGRESOS');
      let cat2025Name = cat;
      let displayName = cat;
      if (cat === 'Membresías') { cat2025Name = 'Membresías de Empresas'; displayName = 'Membresías de Empresas'; }
      const budget2025Value = budget2025Data[cat2025Name] || 0;
      comparison.push({
        category: displayName,
        budget2025: budget2025Value,
        budget2026: budget2026Value,
        variation: budget2026Value - budget2025Value,
        percentage: budget2025Value !== 0 ? ((budget2026Value - budget2025Value) / budget2025Value * 100) : 0,
        level: 1,
        parent_category: 'INGRESOS'
      });
    });

    // Expenses total
    let totalExpenses2026 = 0;
    expenseCategories.forEach(cat => {
      totalExpenses2026 += calculateCategoryTotal(cat, 'EGRESOS');
    });
    const budget2025Expenses = budget2025Data['EGRESOS'];
    comparison.push({
      category: 'Egresos',
      budget2025: budget2025Expenses,
      budget2026: totalExpenses2026,
      variation: totalExpenses2026 - budget2025Expenses,
      percentage: budget2025Expenses !== 0 ? ((totalExpenses2026 - budget2025Expenses) / budget2025Expenses * 100) : 0,
      level: 0
    });

    // Expense subcategories
    expenseCategories.forEach(cat => {
      const budget2026Value = calculateCategoryTotal(cat, 'EGRESOS');
      const budget2025Value = budget2025Data[cat] || 0;
      comparison.push({
        category: cat,
        budget2025: budget2025Value,
        budget2026: budget2026Value,
        variation: budget2026Value - budget2025Value,
        percentage: budget2025Value !== 0 ? ((budget2026Value - budget2025Value) / budget2025Value * 100) : 0,
        level: 1,
        parent_category: 'EGRESOS'
      });
    });

    // Net result
    const netResult2026 = totalIncome2026 - totalExpenses2026;
    const netResult2025 = budget2025Data['Ingresos menos Egresos'];
    comparison.push({
      category: 'Ingresos menos Egresos',
      budget2025: netResult2025,
      budget2026: netResult2026,
      variation: netResult2026 - netResult2025,
      percentage: netResult2025 !== 0 ? ((netResult2026 - netResult2025) / netResult2025 * 100) : 0,
      level: 0
    });

    return comparison;
  }, [budgetData]);

  const formatNumber = (value: number) =>
    value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatPercentage = (value: number) => value.toFixed(2) + '%';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-xl">{t.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[hsl(var(--primary))] text-primary-foreground">
                <th className="border border-border p-2 text-left font-semibold"></th>
                <th className="border border-border p-2 text-right font-semibold">{t.budget2025}</th>
                <th className="border border-border p-2 text-right font-semibold">{t.budget2026}</th>
                <th className="border border-border p-2 text-right font-semibold">{t.variation}</th>
                <th className="border border-border p-2 text-right font-semibold">{t.percentage}</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, index) => {
                const isMainCategory = row.level === 0;
                const isNegative = row.variation < 0;
                return (
                  <tr key={index} className={`${isMainCategory ? 'bg-muted font-bold' : ''} hover:bg-muted/50`}>
                    <td className={`border border-border p-2 ${isMainCategory ? 'font-bold' : 'pl-6'}`}>{row.category}</td>
                    <td className="border border-border p-2 text-right">{formatNumber(row.budget2025)}</td>
                    <td className="border border-border p-2 text-right">{formatNumber(row.budget2026)}</td>
                    <td className={`border border-border p-2 text-right ${isNegative ? 'text-destructive' : 'text-green-600'}`}>{formatNumber(row.variation)}</td>
                    <td className={`border border-border p-2 text-right ${isNegative ? 'text-destructive' : 'text-green-600'}`}>{formatPercentage(row.percentage)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComparativeBudget2025vs2026;
