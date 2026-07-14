import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Percent, Building2, Shield } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatUsd, getBudget2025Totals, horizonteFinancials } from "@/data/horizonteFinancialModel";

export const KPICards = () => {
  const { t } = useLanguage();

  const budgetTotals = getBudget2025Totals();
  const statement2025 = horizonteFinancials.statements["2025"];
  const balance2024 = horizonteFinancials.balanceSheets["2024"];
  const balance2025 = horizonteFinancials.balanceSheets["2025"];

  const actualIncome = statement2025.income;
  const budgetIncome = budgetTotals.incomeBudget;
  const incomeExecutionPercentage = Math.round((actualIncome / budgetIncome) * 100);

  const actualExpenses = statement2025.expenses;
  const budgetExpenses = budgetTotals.expensesBudget;
  const expenseExecutionPercentage = Math.round((actualExpenses / budgetExpenses) * 100);

  const netResult = statement2025.netResult;

  const currentEquity = balance2025.equity.totalEquity;
  const previousEquity = balance2024.equity.totalEquity;
  const equityGrowth = ((currentEquity - previousEquity) / previousEquity) * 100;

  const currentAssets = balance2025.assets.total;
  const previousAssets = balance2024.assets.total;
  const assetsVariation = ((currentAssets - previousAssets) / previousAssets) * 100;

  const currentAssetsLiquidity = balance2025.assets.current.totalCurrent;
  const currentLiabilities = balance2025.liabilities.current.totalCurrent;
  const liquidityRatio = currentAssetsLiquidity / currentLiabilities;

  const period = statement2025.period;

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
            {formatUsd(actualIncome)} / {formatUsd(budgetIncome)}
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
            {formatUsd(actualExpenses)} / {formatUsd(budgetExpenses)}
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

      {/* Patrimony Growth */}
      <Card className="border-chart-5/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Crecimiento Patrimonio
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-chart-5" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-chart-5">
            +{equityGrowth.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {formatUsd(currentEquity)} (Dic 2025)
          </p>
          <Badge variant="outline" className="mt-2">
            vs {formatUsd(previousEquity)} en 2024
          </Badge>
        </CardContent>
      </Card>

      {/* Liquidity Ratio */}
      <Card className="border-chart-1/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Razón de Liquidez
          </CardTitle>
          <Shield className="h-4 w-4 text-chart-1" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-chart-1">
            {liquidityRatio.toFixed(1)}x
          </div>
          <p className="text-xs text-muted-foreground">
            Activo Cte / Pasivo Cte
          </p>
          <Badge variant={liquidityRatio >= 2 ? "secondary" : "outline"} className="mt-2">
            {liquidityRatio >= 2 ? (
              <>
                <TrendingUp className="w-3 h-3 mr-1" />
                Excelente liquidez
              </>
            ) : liquidityRatio >= 1 ? (
              <>Liquidez adecuada</>
            ) : (
              <>
                <TrendingDown className="w-3 h-3 mr-1" />
                Baja liquidez
              </>
            )}
          </Badge>
        </CardContent>
      </Card>

      {/* Assets Variation */}
      <Card className="border-chart-2/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Variación Activos
          </CardTitle>
          <Building2 className="h-4 w-4 text-chart-2" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-chart-2">
            +{assetsVariation.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {formatUsd(currentAssets)} (Dic 2025)
          </p>
          <Badge variant="outline" className="mt-2">
            vs {formatUsd(previousAssets)} en 2024
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
            {formatUsd(netResult)}
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
