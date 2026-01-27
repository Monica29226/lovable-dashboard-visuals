import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Users, Percent, Building2, Shield } from "lucide-react";
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

  // === KPIs del Balance ===
  // Patrimonio desde balance
  const currentEquity = balanceSheetData.equity.dec2025.totalEquity;
  const previousEquity = balanceSheetData.equity.dec2024.totalEquity;
  const equityGrowth = ((currentEquity - previousEquity) / previousEquity) * 100;

  // Variación de activos
  const currentAssets = balanceSheetData.assets.nonCurrent.dec2025.totalAssets;
  const previousAssets = balanceSheetData.assets.nonCurrent.dec2024.totalAssets;
  const assetsVariation = ((currentAssets - previousAssets) / previousAssets) * 100;

  // Razón de liquidez (Activo Corriente / Pasivo Corriente)
  const currentAssetsLiquidity = balanceSheetData.assets.current.dec2025.totalCurrent;
  const currentLiabilities = balanceSheetData.liabilities.current.dec2025.totalCurrent;
  const liquidityRatio = currentAssetsLiquidity / currentLiabilities;

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
            {formatCurrency(currentEquity)} (Dic 2025)
          </p>
          <Badge variant="outline" className="mt-2">
            vs {formatCurrency(previousEquity)} en 2024
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
            {formatCurrency(currentAssets)} (Dic 2025)
          </p>
          <Badge variant="outline" className="mt-2">
            vs {formatCurrency(previousAssets)} en 2024
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
