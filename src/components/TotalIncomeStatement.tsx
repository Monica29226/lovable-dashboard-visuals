import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

// Data for 2024 (Jan-Dec actual)
const data2024 = {
  income: 314914,
  expenses: 209661, // 209,660.57 rounded
  netResult: 105253 // 314,914 - 209,661 = 105,253
};

// Data for 2025 (Aug actual) - Detailed breakdown
const data2025 = {
  income: {
    cuotasAsociados: 135000,
    proyectos: 148465,
    otros: 0,
    total: 283465
  },
  expenses: {
    personal: 166021,
    gastosAdministrativos: 17903,
    viaticos: 21760,
    comunicacionEventos: 20049,
    tecnologia: 42895,
    total: 268626
  },
  netResult: 14838 // Updated to match image: 14,838
};

const budgetData = {
  incomeExecuted: 283465,
  incomeBudgeted: 562709,
  expensesExecuted: 268628,
  expensesBudgeted: 353078
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const TotalIncomeStatement = () => {
  const { t } = useLanguage();
  
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
            Comparativo 2024 vs 2025 (US$)
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
                  <th className="text-right py-2 font-medium text-muted-foreground">{t('netResult')}</th>
                </tr>
              </thead>
              <tbody>
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