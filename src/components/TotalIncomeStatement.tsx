import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { incomeStatementData, getNetResult } from "@/data/incomeStatementData";

// Data for 2023 (Jan-Dec actual) - Historical, won't change
const data2023 = {
  income: 389430,
  expenses: 349004,
  netResult: 40426
};

// Data for 2024 (Jan-Dec actual) - Historical, won't change
const data2024 = {
  income: 314914,
  expenses: 209661,
  netResult: 105253
};

// Data for 2025 - NOW AUTOMATICALLY UPDATED from incomeStatementData.ts
const getData2025 = () => ({
  income: {
    cuotasAsociados: incomeStatementData.income.cuotasAsociados,
    proyectos: incomeStatementData.income.comunidad,
    otros: incomeStatementData.income.otros,
    total: incomeStatementData.income.total
  },
  expenses: {
    personal: incomeStatementData.expenses.personal,
    gastosAdministrativos: incomeStatementData.expenses.gastosAdministrativos,
    viaticos: incomeStatementData.expenses.viaticos,
    comunicacionEventos: incomeStatementData.expenses.comunicacionEventos,
    tecnologia: incomeStatementData.expenses.tecnologia,
    alquiler: incomeStatementData.expenses.alquiler,
    serviciosProfesionales: incomeStatementData.expenses.serviciosProfesionales,
    impuestos: incomeStatementData.expenses.impuestos,
    total: incomeStatementData.expenses.total
  },
  netResult: getNetResult()
});

// Budget data - also uses 2025 actual data for "executed" values
const getBudgetData = () => ({
  incomeExecuted: incomeStatementData.income.total,
  incomeBudgeted: 562709,
  expensesExecuted: incomeStatementData.expenses.total,
  expensesBudgeted: 321912
});

const formatCurrency = (value: number) => {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const TotalIncomeStatement = () => {
  const { t } = useLanguage();
  
  // Get current 2025 data (updates automatically when incomeStatementData changes)
  const data2025 = getData2025();
  const budgetData = getBudgetData();
  
  const incomeProgress = Math.round((budgetData.incomeExecuted / budgetData.incomeBudgeted) * 100);
  const expensesProgress = Math.round((budgetData.expensesExecuted / budgetData.expensesBudgeted) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Total Results Summary */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            {t('totalResults')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Comparativo 2023 vs 2024 vs 2025 (US$)
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground">Año</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">{t('income')}</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">{t('expenses')}</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Ingresos menos gastos</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 font-medium text-foreground">2023</td>
                  <td className="text-right py-3 font-bold text-primary">{formatCurrency(data2023.income)}</td>
                  <td className="text-right py-3 font-bold text-accent">{formatCurrency(data2023.expenses)}</td>
                  <td className="text-right py-3 font-bold text-chart-5">{formatCurrency(data2023.netResult)}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 font-medium text-foreground">2024</td>
                  <td className="text-right py-3 font-bold text-primary">{formatCurrency(data2024.income)}</td>
                  <td className="text-right py-3 font-bold text-accent">{formatCurrency(data2024.expenses)}</td>
                  <td className="text-right py-3 font-bold text-chart-5">{formatCurrency(data2024.netResult)}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 font-medium text-foreground">2025</td>
                  <td className="text-right py-3 font-bold text-primary">{formatCurrency(data2025.income.total)}</td>
                  <td className="text-right py-3 font-bold text-accent">{formatCurrency(data2025.expenses.total)}</td>
                  <td className="text-right py-3 font-bold text-chart-5">{formatCurrency(data2025.netResult)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold text-foreground mb-2">Variación 2024 vs 2025</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-muted-foreground">Ingresos</div>
                <div className="text-lg font-bold text-primary">
                  {((data2025.income.total - data2024.income) / data2024.income * 100).toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <div className="font-medium text-muted-foreground">Egresos</div>
                <div className="text-lg font-bold text-accent">
                  {((data2025.expenses.total - data2024.expenses) / data2024.expenses * 100).toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <div className="font-medium text-muted-foreground">Resultado</div>
                <div className="text-lg font-bold text-chart-5">
                  {((data2025.netResult - data2024.netResult) / Math.abs(data2024.netResult) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget vs Actual */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            {t('budget')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Ejecución vs Presupuesto 2025
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{t('incomeProgress')}</span>
                <Badge variant="secondary">
                  {incomeProgress}%
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Ejecutado: {formatCurrency(budgetData.incomeExecuted)}
              </div>
              <div className="text-sm text-muted-foreground">
                Presupuestado: {formatCurrency(budgetData.incomeBudgeted)}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{t('expensesProgress')}</span>
                <Badge variant="destructive">
                  {expensesProgress}%
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Ejecutado: {formatCurrency(budgetData.expensesExecuted)}
              </div>
              <div className="text-sm text-muted-foreground">
                Presupuestado: {formatCurrency(budgetData.expensesBudgeted)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};