import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Percent, PieChart, BarChart3 } from "lucide-react";
import { useBudget } from "@/contexts/BudgetContext";
import { incomeStatementData } from "@/data/incomeStatementData";

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const KPICards2026 = () => {
  const { derived, budgetData } = useBudget();

  const totalIncome2026 = derived.totalIncome;
  const totalExpenses2026 = derived.totalExpenses;
  const netResult2026 = derived.netResult;

  // Compare vs 2025
  const income2025 = incomeStatementData.income.total;
  const expenses2025 = incomeStatementData.expenses.total;
  const net2025 = income2025 - expenses2025;

  const incomeGrowth = income2025 > 0 ? ((totalIncome2026 - income2025) / income2025) * 100 : 0;
  const expensesGrowth = expenses2025 > 0 ? ((totalExpenses2026 - expenses2025) / expenses2025) * 100 : 0;
  const netGrowth = net2025 !== 0 ? ((netResult2026 - net2025) / Math.abs(net2025)) * 100 : 0;

  // Margin
  const margin2026 = totalIncome2026 > 0 ? (netResult2026 / totalIncome2026) * 100 : 0;

  // Impuesto de renta (30% of positive net)
  const taxAmount = derived.impuestoRenta;
  const netAfterTax = derived.resultadoNeto;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Total Income 2026 */}
      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Ingresos Presupuestados 2026
          </CardTitle>
          <DollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {formatCurrency(totalIncome2026)}
          </div>
          <p className="text-xs text-muted-foreground">
            vs {formatCurrency(income2025)} en 2025
          </p>
          <Badge variant={incomeGrowth >= 0 ? "secondary" : "destructive"} className="mt-2">
            {incomeGrowth >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {incomeGrowth >= 0 ? '+' : ''}{incomeGrowth.toFixed(1)}% vs 2025
          </Badge>
        </CardContent>
      </Card>

      {/* Total Expenses 2026 */}
      <Card className="border-secondary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Egresos Presupuestados 2026
          </CardTitle>
          <Percent className="h-4 w-4 text-secondary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-secondary">
            {formatCurrency(totalExpenses2026)}
          </div>
          <p className="text-xs text-muted-foreground">
            vs {formatCurrency(expenses2025)} en 2025
          </p>
          <Badge variant={expensesGrowth <= 0 ? "secondary" : "destructive"} className="mt-2">
            {expensesGrowth >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {expensesGrowth >= 0 ? '+' : ''}{expensesGrowth.toFixed(1)}% vs 2025
          </Badge>
        </CardContent>
      </Card>

      {/* Net Result 2026 */}
      <Card className="border-chart-5/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Ingresos menos Gastos 2026
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-chart-5" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${netResult2026 >= 0 ? 'text-chart-5' : 'text-destructive'}`}>
            {formatCurrency(netResult2026)}
          </div>
          <p className="text-xs text-muted-foreground">
            vs {formatCurrency(net2025)} en 2025
          </p>
          <Badge variant={netGrowth >= 0 ? "secondary" : "destructive"} className="mt-2">
            {netGrowth >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {netGrowth >= 0 ? '+' : ''}{netGrowth.toFixed(1)}% vs 2025
          </Badge>
        </CardContent>
      </Card>

      {/* Margin */}
      <Card className="border-chart-1/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Margen Operativo 2026
          </CardTitle>
          <PieChart className="h-4 w-4 text-chart-1" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-chart-1">
            {margin2026.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            Resultado / Ingresos Totales
          </p>
          <Badge variant="outline" className="mt-2">
            {margin2026 >= 10 ? 'Margen saludable' : margin2026 >= 0 ? 'Margen bajo' : 'Margen negativo'}
          </Badge>
        </CardContent>
      </Card>

      {/* Tax Estimate */}
      <Card className="border-chart-2/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Impuesto de Renta Estimado (30%)
          </CardTitle>
          <DollarSign className="h-4 w-4 text-chart-2" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-chart-2">
            {formatCurrency(taxAmount)}
          </div>
          <p className="text-xs text-muted-foreground">
            30% del resultado bruto
          </p>
          <Badge variant="outline" className="mt-2">
            Estimación fiscal
          </Badge>
        </CardContent>
      </Card>

      {/* Net After Tax */}
      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Resultado Neto después de Impuestos
          </CardTitle>
          <DollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${netAfterTax >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {formatCurrency(netAfterTax)}
          </div>
          <p className="text-xs text-muted-foreground">
            Resultado bruto - Impuesto de Renta
          </p>
          <Badge variant={netAfterTax >= 0 ? "secondary" : "destructive"} className="mt-2">
            {netAfterTax >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {netAfterTax >= 0 ? 'Rentable' : 'Pérdida'}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};
