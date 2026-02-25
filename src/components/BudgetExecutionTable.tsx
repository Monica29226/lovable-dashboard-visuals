import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const budgetData = {
  income: [
    { name: "Cuotas Asociados", budget: 250650, decemberBudget: 250650, actual: 220650, variation: 30000, pending: 30000 },
    { name: "Membresía", budget: 262059, decemberBudget: 262059, actual: 222522, variation: 39537, pending: 39537 },
    { name: "Ingreso Renta Diferido", budget: 0, decemberBudget: 0, actual: 2400, variation: -2400, pending: -2400 },
  ],
  expenses: [
    { name: "Personal", budget: 255710, decemberBudget: 255710, actual: 233741, variation: 21969, pending: 21969 },
    { name: "Gastos administrativos", budget: 14493, decemberBudget: 14493, actual: 20269, variation: -5776, pending: -5776 },
    { name: "Viáticos", budget: 26400, decemberBudget: 26400, actual: 34288, variation: -7888, pending: -7888 },
    { name: "Comunicación y Mercadeo", budget: 15035, decemberBudget: 15035, actual: 30141, variation: -15106, pending: -15106 },
    { name: "Servicios Profesionales", budget: 18624, decemberBudget: 18624, actual: 32317, variation: -13693, pending: -13693 },
    { name: "Tecnología", budget: 20416, decemberBudget: 20416, actual: 31990, variation: -11574, pending: -11574 },
    { name: "Otros Gastos / Patente / IVA", budget: 2400, decemberBudget: 2400, actual: 14534, variation: -12134, pending: -12134 },
    { name: "Impuesto de Renta", budget: 0, decemberBudget: 0, actual: 11841, variation: -11841, pending: -11841 },
    { name: "Depreciación", budget: 0, decemberBudget: 0, actual: 0, variation: 0, pending: 0 },
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
  const totalIncomeDecemberBudget = budgetData.income.reduce((sum, item) => sum + item.decemberBudget, 0);
  const totalIncomeActual = budgetData.income.reduce((sum, item) => sum + item.actual, 0);
  const totalIncomeVariation = budgetData.income.reduce((sum, item) => sum + item.variation, 0);
  const totalIncomePending = budgetData.income.reduce((sum, item) => sum + item.pending, 0);

  const totalExpensesBudget = budgetData.expenses.reduce((sum, item) => sum + item.budget, 0);
  const totalExpensesDecemberBudget = budgetData.expenses.reduce((sum, item) => sum + item.decemberBudget, 0);
  const totalExpensesActual = budgetData.expenses.reduce((sum, item) => sum + item.actual, 0);
  const totalExpensesVariation = budgetData.expenses.reduce((sum, item) => sum + item.variation, 0);
  const totalExpensesPending = budgetData.expenses.reduce((sum, item) => sum + item.pending, 0);

  const netBudget = totalIncomeBudget - totalExpensesBudget;
  const netDecemberBudget = totalIncomeDecemberBudget - totalExpensesDecemberBudget;
  const netActual = totalIncomeActual - totalExpensesActual;
  const netVariation = totalIncomeVariation - totalExpensesVariation;
  const netPending = totalIncomePending - totalExpensesPending;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Ejecución Presupuestaria 2025</CardTitle>
        <CardDescription>Comparación del presupuesto anual contra lo ejecutado a Diciembre</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border px-4 py-3 text-left font-semibold"></th>
                <th className="border px-4 py-3 text-right font-semibold">Presupuesto Total Anual</th>
                <th className="border px-4 py-3 text-right font-semibold">Presupuesto Diciembre</th>
                <th className="border px-4 py-3 text-right font-semibold">Acumulado Diciembre</th>
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
                    <td className="border px-4 py-2 text-right">{formatCurrency(item.decemberBudget)}</td>
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
                <td className="border px-4 py-2 text-right">{formatCurrency(totalIncomeDecemberBudget)}</td>
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
                    <td className="border px-4 py-2 text-right">{formatCurrency(item.decemberBudget)}</td>
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
                <td className="border px-4 py-2 text-right">{formatCurrency(totalExpensesDecemberBudget)}</td>
                <td className="border px-4 py-2 text-right">{formatCurrency(totalExpensesActual)}</td>
                <td className="border px-4 py-2 text-right">{totalExpensesVariation < 0 ? `(${formatCurrency(Math.abs(totalExpensesVariation))})` : formatCurrency(totalExpensesVariation)}</td>
                <td className="border px-4 py-2 text-right">{formatCurrency(totalExpensesPending)}</td>
                <td className="border px-4 py-2 text-center text-sm font-medium">{calculatePercentage(totalExpensesActual, totalExpensesBudget)}%</td>
              </tr>

              {/* Net Result */}
              <tr className="bg-chart-3/15 font-bold text-lg">
                <td className="border px-4 py-3">Ingresos menos Gastos</td>
                <td className="border px-4 py-3 text-right">{formatCurrency(netBudget)}</td>
                <td className="border px-4 py-3 text-right">{formatCurrency(netDecemberBudget)}</td>
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
