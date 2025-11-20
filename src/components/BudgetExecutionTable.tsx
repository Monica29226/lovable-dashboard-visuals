import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const budgetData = {
  income: [
    { name: "Cuotas Asociados", budget: 250650, septemberBudget: 200650, actual: 200650, variation: 0, pending: 50000 },
    { name: "Membresía", budget: 262059, septemberBudget: 223659, actual: 215527, variation: 8132, pending: 46532 },
    { name: "Otros", budget: 50000, septemberBudget: 50000, actual: 0, variation: 50000, pending: 50000 },
  ],
  expenses: [
    { name: "Personal", budget: 255710, septemberBudget: 191783, actual: 200549, variation: -8786, pending: 55141 },
    { name: "Gastos administrativos", budget: 14493, septemberBudget: 10870, actual: 15945, variation: -5075, pending: -1452 },
    { name: "Viáticos", budget: 26400, septemberBudget: 13750, actual: 30093, variation: -16343, pending: -3693 },
    { name: "Comunicación y Mercadeo", budget: 15035, septemberBudget: 10990, actual: 27027, variation: -16037, pending: -11992 },
    { name: "Servicios Profesionales", budget: 18624, septemberBudget: 13968, actual: 27030, variation: -13062, pending: -8406 },
    { name: "Tecnología", budget: 20416, septemberBudget: 16181, actual: 25982, variation: -9802, pending: -5567 },
    { name: "Impuestos", budget: 2000, septemberBudget: 1500, actual: 5605, variation: -4105, pending: -3605 },
    { name: "Otros Gastos", budget: 400, septemberBudget: 300, actual: 0, variation: 300, pending: 400 },
    { name: "Depreciación", budget: 0, septemberBudget: 0, actual: 2492, variation: -2492, pending: -2492 },
    { name: "Impuesto de Renta", budget: 0, septemberBudget: 0, actual: 0, variation: 0, pending: 0 },
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
  const totalIncomeSeptemberBudget = budgetData.income.reduce((sum, item) => sum + item.septemberBudget, 0);
  const totalIncomeActual = budgetData.income.reduce((sum, item) => sum + item.actual, 0);
  const totalIncomeVariation = budgetData.income.reduce((sum, item) => sum + item.variation, 0);
  const totalIncomePending = budgetData.income.reduce((sum, item) => sum + item.pending, 0);

  const totalExpensesBudget = budgetData.expenses.reduce((sum, item) => sum + item.budget, 0);
  const totalExpensesSeptemberBudget = budgetData.expenses.reduce((sum, item) => sum + item.septemberBudget, 0);
  const totalExpensesActual = budgetData.expenses.reduce((sum, item) => sum + item.actual, 0);
  const totalExpensesVariation = budgetData.expenses.reduce((sum, item) => sum + item.variation, 0);
  const totalExpensesPending = budgetData.expenses.reduce((sum, item) => sum + item.pending, 0);

  const netBudget = totalIncomeBudget - totalExpensesBudget;
  const netSeptemberBudget = totalIncomeSeptemberBudget - totalExpensesSeptemberBudget;
  const netActual = totalIncomeActual - totalExpensesActual;
  const netVariation = totalIncomeVariation - totalExpensesVariation;
  const netPending = totalIncomePending - totalExpensesPending;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Ejecución Presupuestaria 2025</CardTitle>
        <CardDescription>Comparación del presupuesto anual contra lo ejecutado a Octubre</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border px-4 py-3 text-left font-semibold"></th>
                <th className="border px-4 py-3 text-right font-semibold">Presupuesto Total Anual</th>
                <th className="border px-4 py-3 text-right font-semibold">Presupuesto Octubre</th>
                <th className="border px-4 py-3 text-right font-semibold">Acumulado Octubre</th>
                <th className="border px-4 py-3 text-right font-semibold">Variacion</th>
                <th className="border px-4 py-3 text-right font-semibold">Pendiente Ejecución</th>
                <th className="border px-4 py-3 text-center font-semibold">% Avance</th>
              </tr>
            </thead>
            <tbody>
              {/* Income Section */}
              <tr className="bg-accent/5">
                <td colSpan={7} className="border px-4 py-2 font-bold">Ingresos</td>
              </tr>
              {budgetData.income.map((item, idx) => {
                const percentage = calculatePercentage(item.actual, item.budget);
                return (
                  <tr key={`income-${idx}`} className="hover:bg-muted/50">
                    <td className="border px-4 py-2">{item.name}</td>
                    <td className="border px-4 py-2 text-right">{formatCurrency(item.budget)}</td>
                    <td className="border px-4 py-2 text-right">{formatCurrency(item.septemberBudget)}</td>
                    <td className="border px-4 py-2 text-right text-accent font-medium">{formatCurrency(item.actual)}</td>
                    <td className="border px-4 py-2 text-right">{formatCurrency(item.variation)}</td>
                    <td className="border px-4 py-2 text-right text-muted-foreground">{formatCurrency(item.pending)}</td>
                    <td className="border px-4 py-2 text-center text-sm font-medium">{percentage}%</td>
                  </tr>
                );
              })}
              <tr className="bg-accent/10 font-bold">
                <td className="border px-4 py-2">Total ingresos</td>
                <td className="border px-4 py-2 text-right">{formatCurrency(totalIncomeBudget)}</td>
                <td className="border px-4 py-2 text-right">{formatCurrency(totalIncomeSeptemberBudget)}</td>
                <td className="border px-4 py-2 text-right">{formatCurrency(totalIncomeActual)}</td>
                <td className="border px-4 py-2 text-right">{formatCurrency(totalIncomeVariation)}</td>
                <td className="border px-4 py-2 text-right">{formatCurrency(totalIncomePending)}</td>
                <td className="border px-4 py-2 text-center text-sm font-medium">{calculatePercentage(totalIncomeActual, totalIncomeBudget)}%</td>
              </tr>

              {/* Expenses Section */}
              <tr className="bg-secondary/5">
                <td colSpan={7} className="border px-4 py-2 font-bold">Egresos</td>
              </tr>
              {budgetData.expenses.map((item, idx) => {
                const percentage = calculatePercentage(item.actual, item.budget);
                return (
                  <tr key={`expense-${idx}`} className="hover:bg-muted/50">
                    <td className="border px-4 py-2">{idx + 1}   {item.name}</td>
                    <td className="border px-4 py-2 text-right">{formatCurrency(item.budget)}</td>
                    <td className="border px-4 py-2 text-right">{formatCurrency(item.septemberBudget)}</td>
                    <td className="border px-4 py-2 text-right text-accent font-medium">{formatCurrency(item.actual)}</td>
                    <td className="border px-4 py-2 text-right">{item.variation < 0 ? `(${formatCurrency(Math.abs(item.variation))})` : formatCurrency(item.variation)}</td>
                    <td className="border px-4 py-2 text-right text-muted-foreground">{item.pending < 0 ? `(${formatCurrency(Math.abs(item.pending))})` : formatCurrency(item.pending)}</td>
                    <td className="border px-4 py-2 text-center text-sm font-medium">{item.budget > 0 ? `${percentage}%` : 'n/a'}</td>
                  </tr>
                );
              })}
              <tr className="bg-secondary/10 font-bold">
                <td className="border px-4 py-2">Total egresos</td>
                <td className="border px-4 py-2 text-right">{formatCurrency(totalExpensesBudget)}</td>
                <td className="border px-4 py-2 text-right">{formatCurrency(totalExpensesSeptemberBudget)}</td>
                <td className="border px-4 py-2 text-right">{formatCurrency(totalExpensesActual)}</td>
                <td className="border px-4 py-2 text-right">{totalExpensesVariation < 0 ? `(${formatCurrency(Math.abs(totalExpensesVariation))})` : formatCurrency(totalExpensesVariation)}</td>
                <td className="border px-4 py-2 text-right">{formatCurrency(totalExpensesPending)}</td>
                <td className="border px-4 py-2 text-center text-sm font-medium">{calculatePercentage(totalExpensesActual, totalExpensesBudget)}%</td>
              </tr>

              {/* Net Result */}
              <tr className="bg-chart-3/15 font-bold text-lg">
                <td className="border px-4 py-3">Ingresos menos Gastos</td>
                <td className="border px-4 py-3 text-right">{formatCurrency(netBudget)}</td>
                <td className="border px-4 py-3 text-right">{formatCurrency(netSeptemberBudget)}</td>
                <td className="border px-4 py-3 text-right">{formatCurrency(netActual)}</td>
                <td className="border px-4 py-3 text-right">{netVariation < 0 ? `(${formatCurrency(Math.abs(netVariation))})` : formatCurrency(netVariation)}</td>
                <td className="border px-4 py-3 text-right">{formatCurrency(netPending)}</td>
                <td className="border px-4 py-3 text-center text-sm font-medium">{netBudget !== 0 ? `${calculatePercentage(netActual, netBudget)}%` : 'n/a'}</td>
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
