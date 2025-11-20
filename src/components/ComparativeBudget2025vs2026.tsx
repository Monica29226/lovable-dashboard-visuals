import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface BudgetComparison {
  category: string;
  budget2025: number;
  budget2026: number;
  variation: number;
  percentage: number;
  level: number;
  parent_category?: string;
}

const ComparativeBudget2025vs2026 = () => {
  const { language } = useLanguage();
  const { selectedCompanyId } = useCompany();
  const [loading, setLoading] = useState(true);
  const [comparisonData, setComparisonData] = useState<BudgetComparison[]>([]);

  const texts = {
    es: {
      title: 'Comparativa Presupuesto 2025 vs 2026',
      budget2025: 'Presupuesto 2025',
      budget2026: 'Presupuesto 2026',
      variation: 'Variación',
      percentage: '%',
      loading: 'Cargando comparativa...'
    },
    en: {
      title: 'Budget Comparison 2025 vs 2026',
      budget2025: 'Budget 2025',
      budget2026: 'Budget 2026',
      variation: 'Variation',
      percentage: '%',
      loading: 'Loading comparison...'
    }
  };

  const t = texts[language];

  // Datos del presupuesto 2025 - Octubre 2025
  const budget2025Data: { [key: string]: number } = {
    'INGRESOS': 416177.00,
    'Cuotas de Asociados': 200650.00,
    'Membresías de Empresas': 215527.00,
    'EGRESOS': 334743.00,
    'Personal': 200569.00,
    'Gastos Administrativos': 15945.00,
    'Viáticos y Giras': 30093.00,
    'Comunicación y Mercadeo': 27027.00,
    'Servicios Profesionales': 53012.00,
    'Tecnología': 0.00,
    'Impuestos': 0.00,
    'Otros Gastos': 8097.00,
    'Ingresos menos Egresos': 81434.00
  };

  useEffect(() => {
    loadBudget2026Data();
  }, [selectedCompanyId]);

  const loadBudget2026Data = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('budget_2026')
        .select('*')
        .eq('company_id', selectedCompanyId || '');

      if (error) throw error;

      if (data && data.length > 0) {
        processComparisonData(data);
      }
    } catch (error) {
      console.error('Error loading budget 2026:', error);
    } finally {
      setLoading(false);
    }
  };

  const processComparisonData = (budget2026: any[]) => {
    const comparison: BudgetComparison[] = [];

    // Calcular totales de categorías padre sumando sus hijos
    const calculateCategoryTotal = (category: string, parentCategory: string) => {
      const children = budget2026.filter(row => 
        row.parent_category === category || 
        (row.parent_category === parentCategory && row.category === category)
      );
      
      if (children.length > 0) {
        return children.reduce((sum, child) => sum + (child.total || 0), 0);
      }
      
      // Si no tiene hijos, buscar el total directo
      const directRow = budget2026.find(row => row.category === category);
      return directRow?.total || 0;
    };

    // Categorías principales
    const incomeCategories = ['Cuotas de Asociados', 'Membresías'];
    const expenseCategories = ['Personal', 'Gastos Administrativos', 'Viáticos y Giras', 'Comunicación y Mercadeo',
                               'Servicios Profesionales', 'Tecnología', 'Impuestos', 'Otros Gastos'];

    // Calcular total de ingresos
    let totalIncome2026 = 0;
    incomeCategories.forEach(cat => {
      const catTotal = calculateCategoryTotal(cat, 'INGRESOS');
      totalIncome2026 += catTotal;
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

    // Agregar subcategorías de ingresos
    incomeCategories.forEach(cat => {
      const budget2026Value = calculateCategoryTotal(cat, 'INGRESOS');
      // Mapear nombre de categoría de 2026 a nombre de 2025
      const cat2025Name = cat === 'Membresías' ? 'Membresías de Empresas' : cat;
      const budget2025Value = budget2025Data[cat2025Name] || 0;
      
      comparison.push({
        category: cat === 'Membresías' ? 'Membresías de Empresas' : cat,
        budget2025: budget2025Value,
        budget2026: budget2026Value,
        variation: budget2026Value - budget2025Value,
        percentage: budget2025Value !== 0 ? ((budget2026Value - budget2025Value) / budget2025Value * 100) : 0,
        level: 1,
        parent_category: 'INGRESOS'
      });
    });

    // Calcular total de egresos
    let totalExpenses2026 = 0;
    expenseCategories.forEach(cat => {
      const catTotal = calculateCategoryTotal(cat, 'EGRESOS');
      totalExpenses2026 += catTotal;
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

    // Agregar subcategorías de egresos
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

    // Resultado neto
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

    setComparisonData(comparison);
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatPercentage = (value: number) => {
    return value.toFixed(2) + '%';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">{t.loading}</span>
      </div>
    );
  }

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
                  <tr 
                    key={index}
                    className={`${isMainCategory ? 'bg-muted font-bold' : ''} hover:bg-muted/50`}
                  >
                    <td className={`border border-border p-2 ${isMainCategory ? 'font-bold' : 'pl-6'}`}>
                      {row.category}
                    </td>
                    <td className="border border-border p-2 text-right">
                      {formatNumber(row.budget2025)}
                    </td>
                    <td className="border border-border p-2 text-right">
                      {formatNumber(row.budget2026)}
                    </td>
                    <td className={`border border-border p-2 text-right ${isNegative ? 'text-destructive' : 'text-green-600'}`}>
                      {formatNumber(row.variation)}
                    </td>
                    <td className={`border border-border p-2 text-right ${isNegative ? 'text-destructive' : 'text-green-600'}`}>
                      {formatPercentage(row.percentage)}
                    </td>
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
