import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Users, Percent } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { incomeStatementData, getNetResult, formatCurrency } from "@/data/incomeStatementData";
import { balanceSheetData } from "@/data/balanceSheetData";

// Datos de presupuesto centralizados (deben coincidir con BudgetExecutionTable)
const budgetData = {
  income: {
    cuotasAsociados: 250650,
    membresia: 262059,
    otros: 50000,
    total: 562709
  },
  expenses: {
    personal: 255710,
    gastosAdministrativos: 14493,
    viaticos: 26400,
    comunicacionMercadeo: 15035,
    serviciosProfesionales: 18624,
    tecnologia: 20416,
    impuestos: 2000,
    otrosGastos: 400,
    depreciacion: 0,
    impuestoRenta: 0,
    total: 353078
  }
};

// Datos de membresía
const membershipData = {
  paid: 26,
  unpaid: 11,
  total: 37
};

export const KPICards = () => {
  const { t } = useLanguage();

  // Calcular KPIs dinámicamente desde los datos centralizados
  const actualIncome = incomeStatementData.income.total;
  const budgetIncome = budgetData.income.total;
  const incomeExecutionPercentage = Math.round((actualIncome / budgetIncome) * 100);

  const actualExpenses = incomeStatementData.expenses.total;
  const budgetExpenses = budgetData.expenses.total;
  const expenseExecutionPercentage = Math.round((actualExpenses / budgetExpenses) * 100);

  // Resultado neto del período actual
  const netResult = getNetResult();

  // Datos de comunidad desde el estado de resultados
  const communityIncome = incomeStatementData.income.comunidad;
  // Estimamos gastos de comunidad como proporción del total
  const communityExpenseRatio = communityIncome / actualIncome;
  const communityExpenses = Math.round(actualExpenses * communityExpenseRatio);
  const communityNet = communityIncome - communityExpenses;

  // Proyección anualizada (basada en 12 meses de datos)
  const monthsElapsed = 12; // Diciembre = 12 meses
  const annualizedIncome = Math.round((actualIncome / monthsElapsed) * 12);
  const annualizedExpenses = Math.round((actualExpenses / monthsElapsed) * 12);
  const annualizedNet = annualizedIncome - annualizedExpenses;

  // Patrimonio desde balance
  const currentEquity = balanceSheetData.equity.dec2025.totalEquity;
  const previousEquity = balanceSheetData.equity.dec2024.totalEquity;
  const equityGrowth = Math.round(((currentEquity - previousEquity) / previousEquity) * 100);

  // Período para mostrar
  const period = incomeStatementData.period;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Income Execution */}
      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('executionRate')} - {t('income')}
          </CardTitle>
          <DollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {incomeExecutionPercentage}%
          </div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(actualIncome)} / {formatCurrency(budgetIncome)}
          </p>
          <Badge variant="secondary" className="mt-2">
            <TrendingUp className="w-3 h-3 mr-1" />
            Presupuesto anual
          </Badge>
        </CardContent>
      </Card>

      {/* Expense Execution */}
      <Card className="border-secondary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('executionRate')} - {t('expenses')}
          </CardTitle>
          <Percent className="h-4 w-4 text-secondary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-secondary">
            {expenseExecutionPercentage}%
          </div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(actualExpenses)} / {formatCurrency(budgetExpenses)}
          </p>
          <Badge variant={expenseExecutionPercentage > 100 ? "destructive" : "secondary"} className="mt-2">
            {expenseExecutionPercentage > 100 ? (
              <>
                <TrendingUp className="w-3 h-3 mr-1" />
                Sobreejecución
              </>
            ) : (
              <>
                <TrendingDown className="w-3 h-3 mr-1" />
                Dentro del presupuesto
              </>
            )}
          </Badge>
        </CardContent>
      </Card>

      {/* Membership Payment */}
      <Card className="border-accent/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('membershipPaid')}
          </CardTitle>
          <Users className="h-4 w-4 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-accent">
            {Math.round((membershipData.paid / membershipData.total) * 100)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {membershipData.paid} de {membershipData.total} asociados
          </p>
          <Badge variant="outline" className="mt-2 border-accent text-accent">
            {membershipData.unpaid} no aportaron
          </Badge>
        </CardContent>
      </Card>

      {/* Community Results */}
      <Card className="border-chart-4/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('communityIncome')} Neto
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-chart-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-chart-4">
            {formatCurrency(communityNet)}
          </div>
          <p className="text-xs text-muted-foreground">
            Ingresos: {formatCurrency(communityIncome)}
          </p>
          <p className="text-xs text-muted-foreground">
            Egresos: {formatCurrency(communityExpenses)}
          </p>
        </CardContent>
      </Card>

      {/* Patrimony / Equity */}
      <Card className="border-chart-5/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Patrimonio Total
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-chart-5" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-chart-5">
            {formatCurrency(currentEquity)}
          </div>
          <p className="text-xs text-muted-foreground">
            Crecimiento: +{equityGrowth}% vs 2024
          </p>
          <Badge variant="outline" className="mt-2">
            {formatCurrency(previousEquity)} en 2024
          </Badge>
        </CardContent>
      </Card>

      {/* Net Result Current */}
      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('netResult')} {period}
          </CardTitle>
          <DollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${netResult >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {formatCurrency(netResult)}
          </div>
          <p className="text-xs text-muted-foreground">
            {netResult >= 0 ? 'Resultado positivo del período' : 'Resultado negativo del período'}
          </p>
          <Badge variant={netResult >= 0 ? "secondary" : "destructive"} className="mt-2">
            {netResult >= 0 ? (
              <>
                <TrendingUp className="w-3 h-3 mr-1" />
                Rentable
              </>
            ) : (
              <>
                <TrendingDown className="w-3 h-3 mr-1" />
                Pérdida
              </>
            )}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};
