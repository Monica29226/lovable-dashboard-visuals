import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatUsd, getBudget2025Totals, horizonteFinancials } from "@/data/horizonteFinancialModel";

const formatCurrency = (value: number) => {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const TotalIncomeStatement = () => {
  const { t } = useLanguage();
  const data2023 = horizonteFinancials.statements["2023"];
  const data2024 = horizonteFinancials.statements["2024"];
  const data2025 = horizonteFinancials.statements["2025"];
  const budgetData = getBudget2025Totals();
  
  const incomeProgress = Math.round((budgetData.incomeActual / budgetData.incomeBudget) * 100);
  const expensesProgress = Math.round((budgetData.expensesActual / budgetData.expensesBudget) * 100);

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
                  <td className="text-right py-3 font-bold text-primary">{formatCurrency(data2025.income)}</td>
                  <td className="text-right py-3 font-bold text-accent">{formatCurrency(data2025.expenses)}</td>
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
                  {((data2025.income - data2024.income) / data2024.income * 100).toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <div className="font-medium text-muted-foreground">Egresos</div>
                <div className="text-lg font-bold text-accent">
                  {((data2025.expenses - data2024.expenses) / data2024.expenses * 100).toFixed(1)}%
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
                Ejecutado: {formatUsd(budgetData.incomeActual, 2)}
              </div>
              <div className="text-sm text-muted-foreground">
                Presupuestado: {formatUsd(budgetData.incomeBudget, 2)}
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
                Ejecutado: {formatUsd(budgetData.expensesActual, 2)}
              </div>
              <div className="text-sm text-muted-foreground">
                Presupuestado: {formatUsd(budgetData.expensesBudget, 2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
