import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const budgetData = {
  income: [
    { name: "Cuotas Asociados", budget: 250650, actual: 209067, pending: 41583 },
    { name: "Membresía", budget: 262059, actual: 145797, pending: 116262 },
    { name: "Otros", budget: 50000, actual: 0, pending: 50000 },
  ],
  expenses: [
    { name: "Personal", budget: 255710, actual: 183774, pending: 71936 },
    { name: "Gastos administrativos", budget: 14493, actual: 13690, pending: 803 },
    { name: "Viáticos", budget: 26400, actual: 23749, pending: 2651 },
    { name: "Comunicación y Mercadeo", budget: 15035, actual: 26029, pending: -10994 },
    { name: "Eventos", budget: 0, actual: 0, pending: 0 },
    { name: "Servicios Profesionales", budget: 18624, actual: 24027, pending: -5403 },
    { name: "Tecnología", budget: 20416, actual: 24402, pending: -3986 },
    { name: "Impuestos", budget: 2000, actual: 5063, pending: -3063 },
    { name: "Otros Gastos", budget: 400, actual: 0, pending: 400 },
    { name: "Depreciación", budget: 0, actual: 2242, pending: -2242 },
    { name: "Impuesto de Renta", budget: 0, actual: 0, pending: 0 },
  ],
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const calculatePercentage = (actual: number, budget: number): number => {
  if (budget === 0) return 0;
  return Math.round((actual / budget) * 100);
};

export const BudgetExecutionTable = () => {
  const { t } = useLanguage();

  const totalIncomeBudget = budgetData.income.reduce((sum, item) => sum + item.budget, 0);
  const totalIncomeActual = budgetData.income.reduce((sum, item) => sum + item.actual, 0);
  const totalIncomePending = budgetData.income.reduce((sum, item) => sum + item.pending, 0);

  const totalExpensesBudget = budgetData.expenses.reduce((sum, item) => sum + item.budget, 0);
  const totalExpensesActual = budgetData.expenses.reduce((sum, item) => sum + item.actual, 0);
  const totalExpensesPending = budgetData.expenses.reduce((sum, item) => sum + item.pending, 0);

  const netBudget = totalIncomeBudget - totalExpensesBudget;
  const netActual = totalIncomeActual - totalExpensesActual;
  const netPending = totalIncomePending - totalExpensesPending;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Ejecución Presupuestaria 2025</CardTitle>
        <CardDescription>Comparación del presupuesto anual contra lo ejecutado a Septiembre</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border px-4 py-3 text-left font-semibold">Concepto</th>
                <th className="border px-4 py-3 text-right font-semibold">Presupuesto Total Anual</th>
                <th className="border px-4 py-3 text-right font-semibold">Acumulado Septiembre</th>
                <th className="border px-4 py-3 text-right font-semibold">Pendiente Ejecución</th>
                <th className="border px-4 py-3 text-center font-semibold">% Avance</th>
              </tr>
            </thead>
            <tbody>
              {/* Income Section */}
              <tr className="bg-primary/10">
                <td colSpan={5} className="border px-4 py-2 font-bold">Ingresos</td>
              </tr>
              {budgetData.income.map((item, idx) => {
                const percentage = calculatePercentage(item.actual, item.budget);
                return (
                  <tr key={`income-${idx}`} className="hover:bg-muted/50">
                    <td className="border px-4 py-2">{item.name}</td>
                    <td className="border px-4 py-2 text-right">{formatCurrency(item.budget)}</td>
                    <td className="border px-4 py-2 text-right text-primary font-medium">{formatCurrency(item.actual)}</td>
                    <td className="border px-4 py-2 text-right text-muted-foreground">{formatCurrency(item.pending)}</td>
                    <td className="border px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Progress value={Math.min(percentage, 100)} className="flex-1" />
                        <span className="text-sm font-medium min-w-[45px] text-right">{percentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-primary/20 font-bold">
                <td className="border px-4 py-2">Total ingresos</td>
                <td className="border px-4 py-2 text-right">{formatCurrency(totalIncomeBudget)}</td>
                <td className="border px-4 py-2 text-right">{formatCurrency(totalIncomeActual)}</td>
                <td className="border px-4 py-2 text-right">{formatCurrency(totalIncomePending)}</td>
                <td className="border px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Progress value={Math.min(calculatePercentage(totalIncomeActual, totalIncomeBudget), 100)} className="flex-1" />
                    <span className="text-sm font-medium min-w-[45px] text-right">{calculatePercentage(totalIncomeActual, totalIncomeBudget)}%</span>
                  </div>
                </td>
              </tr>

              {/* Expenses Section */}
              <tr className="bg-destructive/10">
                <td colSpan={5} className="border px-4 py-2 font-bold">Egresos</td>
              </tr>
              {budgetData.expenses.map((item, idx) => {
                const percentage = calculatePercentage(item.actual, item.budget);
                return (
                  <tr key={`expense-${idx}`} className="hover:bg-muted/50">
                    <td className="border px-4 py-2">{item.name}</td>
                    <td className="border px-4 py-2 text-right">{formatCurrency(item.budget)}</td>
                    <td className="border px-4 py-2 text-right text-destructive font-medium">{formatCurrency(item.actual)}</td>
                    <td className="border px-4 py-2 text-right text-muted-foreground">{formatCurrency(item.pending)}</td>
                    <td className="border px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Progress value={Math.min(percentage, 100)} className="flex-1" />
                        <span className="text-sm font-medium min-w-[45px] text-right">{percentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-destructive/20 font-bold">
                <td className="border px-4 py-2">Total egresos</td>
                <td className="border px-4 py-2 text-right">{formatCurrency(totalExpensesBudget)}</td>
                <td className="border px-4 py-2 text-right">{formatCurrency(totalExpensesActual)}</td>
                <td className="border px-4 py-2 text-right">{formatCurrency(totalExpensesPending)}</td>
                <td className="border px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Progress value={Math.min(calculatePercentage(totalExpensesActual, totalExpensesBudget), 100)} className="flex-1" />
                    <span className="text-sm font-medium min-w-[45px] text-right">{calculatePercentage(totalExpensesActual, totalExpensesBudget)}%</span>
                  </div>
                </td>
              </tr>

              {/* Net Result */}
              <tr className="bg-secondary font-bold text-lg">
                <td className="border px-4 py-3">Ingresos menos Gastos</td>
                <td className="border px-4 py-3 text-right">{formatCurrency(netBudget)}</td>
                <td className="border px-4 py-3 text-right">{formatCurrency(netActual)}</td>
                <td className="border px-4 py-3 text-right">{formatCurrency(netPending)}</td>
                <td className="border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Progress value={Math.min(calculatePercentage(netActual, netBudget), 100)} className="flex-1" />
                    <span className="text-sm font-medium min-w-[45px] text-right">{calculatePercentage(netActual, netBudget)}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">Interpretación de porcentajes:</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• <span className="font-medium">Ingresos:</span> Porcentaje de lo recaudado vs presupuestado</li>
            <li>• <span className="font-medium">Egresos:</span> Porcentaje de lo gastado vs presupuestado</li>
            <li>• <span className="font-medium">Valores negativos en "Pendiente":</span> Indican sobreejecución del presupuesto</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
