import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Users, Percent } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const kpiData = {
  incomeExecution: {
    actual: 354864,
    budget: 562709,
    percentage: 63
  },
  expenseExecution: {
    actual: 302975,
    budget: 321912,
    percentage: 94
  },
  membershipPayment: {
    paid: 26,
    unpaid: 11,
    total: 37
  },
  communityResults: {
    income: 145797,
    expenses: 120132,
    net: 25665
  },
  annualizedProjection: {
    income: 473152, // (354864 / 9) * 12
    expenses: 403967, // (302975 / 9) * 12
    net: 69185
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const KPICards = () => {
  const { t } = useLanguage();

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
            {kpiData.incomeExecution.percentage}%
          </div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(kpiData.incomeExecution.actual)} / {formatCurrency(kpiData.incomeExecution.budget)}
          </p>
          <Badge variant="secondary" className="mt-2">
            <TrendingUp className="w-3 h-3 mr-1" />
            Proyectado: 50%
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
            {kpiData.expenseExecution.percentage}%
          </div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(kpiData.expenseExecution.actual)} / {formatCurrency(kpiData.expenseExecution.budget)}
          </p>
          <Badge variant="destructive" className="mt-2">
            <TrendingUp className="w-3 h-3 mr-1" />
            Alto gasto
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
            {Math.round((kpiData.membershipPayment.paid / kpiData.membershipPayment.total) * 100)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {kpiData.membershipPayment.paid} de {kpiData.membershipPayment.total} asociados
          </p>
          <Badge variant="outline" className="mt-2 border-accent text-accent">
            {kpiData.membershipPayment.unpaid} no aportaron
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
            {formatCurrency(kpiData.communityResults.net)}
          </div>
          <p className="text-xs text-muted-foreground">
            Ingresos: {formatCurrency(kpiData.communityResults.income)}
          </p>
          <p className="text-xs text-muted-foreground">
            Egresos: {formatCurrency(kpiData.communityResults.expenses)}
          </p>
        </CardContent>
      </Card>

      {/* Annualized Projection */}
      <Card className="border-chart-5/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('annualizedIncome')}
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-chart-5" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-chart-5">
            {formatCurrency(kpiData.annualizedProjection.net)}
          </div>
          <p className="text-xs text-muted-foreground">
            Proyección anual (Ago base)
          </p>
          <Badge variant="outline" className="mt-2">
            Resultado positivo
          </Badge>
        </CardContent>
      </Card>

      {/* Net Result Current */}
      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('netResult')} Octubre
          </CardTitle>
          <DollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {formatCurrency(51889)}
          </div>
          <p className="text-xs text-muted-foreground">
            Resultado positivo del mes
          </p>
          <Badge variant="secondary" className="mt-2">
            <TrendingUp className="w-3 h-3 mr-1" />
            Rentable
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};