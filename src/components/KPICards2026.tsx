import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Percent, PieChart, BarChart3 } from "lucide-react";
import { financialData2026, formatCurrency2026 } from "@/data/financialData2026";
import { incomeStatementData } from "@/data/incomeStatementData";
import { balanceSheetData } from "@/data/balanceSheetData";

export const KPICards2026 = () => {
  const is2026 = financialData2026.incomeStatement;
  const bs2026 = financialData2026.balanceSheet;

  // 2025 reference
  const income2025 = incomeStatementData.income.total;
  const expenses2025 = incomeStatementData.expenses.total;
  const net2025 = income2025 - expenses2025;
  const equity2025 = balanceSheetData.equity.dec2025.totalEquity;
  const assets2025 = balanceSheetData.assets.nonCurrent.dec2025.totalAssets;

  // 2026 values
  const totalIncome = is2026.income.total;
  const totalExpenses = is2026.expenses.total;
  const netResult = is2026.netResult;
  const equity2026 = bs2026.equity.totalEquity;
  const assets2026 = bs2026.assets.totalAssets;

  // Growth
  const equityGrowth = ((equity2026 - equity2025) / equity2025) * 100;
  const assetsGrowth = ((assets2026 - assets2025) / assets2025) * 100;

  // Liquidity
  const liquidityRatio = bs2026.assets.current.totalCurrent / bs2026.liabilities.totalCurrent;

  // Margin
  const margin = totalIncome > 0 ? (netResult / totalIncome) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Income */}
      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Ingresos {financialData2026.period}
          </CardTitle>
          <DollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{formatCurrency2026(totalIncome)}</div>
          <p className="text-xs text-muted-foreground">Acumulado a {financialData2026.period}</p>
          <Badge variant="secondary" className="mt-2">
            <TrendingUp className="w-3 h-3 mr-1" />
            Presupuesto 2026
          </Badge>
        </CardContent>
      </Card>

      {/* Expenses */}
      <Card className="border-secondary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Egresos {financialData2026.period}
          </CardTitle>
          <Percent className="h-4 w-4 text-secondary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-secondary">{formatCurrency2026(totalExpenses)}</div>
          <p className="text-xs text-muted-foreground">Acumulado a {financialData2026.period}</p>
          <Badge variant="secondary" className="mt-2">
            <TrendingDown className="w-3 h-3 mr-1" />
            Dentro del presupuesto
          </Badge>
        </CardContent>
      </Card>

      {/* Net Result */}
      <Card className="border-chart-5/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Ingresos menos Gastos
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-chart-5" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${netResult >= 0 ? 'text-chart-5' : 'text-destructive'}`}>
            {formatCurrency2026(netResult)}
          </div>
          <p className="text-xs text-muted-foreground">{financialData2026.period}</p>
          <Badge variant={netResult >= 0 ? "secondary" : "destructive"} className="mt-2">
            {netResult >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {netResult >= 0 ? 'Resultado positivo' : 'Pérdida'}
          </Badge>
        </CardContent>
      </Card>

      {/* Equity Growth */}
      <Card className="border-chart-1/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Crecimiento Patrimonio
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-chart-1" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-chart-1">+{equityGrowth.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency2026(equity2026)} (Junio 2026)
          </p>
          <Badge variant="outline" className="mt-2">
            vs {formatCurrency2026(equity2025)} Dic 2025
          </Badge>
        </CardContent>
      </Card>

      {/* Liquidity Ratio */}
      <Card className="border-chart-2/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Razón de Liquidez
          </CardTitle>
          <PieChart className="h-4 w-4 text-chart-2" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-chart-2">{liquidityRatio.toFixed(1)}x</div>
          <p className="text-xs text-muted-foreground">Activo Cte / Pasivo Cte</p>
          <Badge variant={liquidityRatio >= 2 ? "secondary" : "outline"} className="mt-2">
            {liquidityRatio >= 2 ? (
              <><TrendingUp className="w-3 h-3 mr-1" />Excelente liquidez</>
            ) : 'Liquidez adecuada'}
          </Badge>
        </CardContent>
      </Card>

      {/* Assets Growth */}
      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Variación Activos
          </CardTitle>
          <DollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">+{assetsGrowth.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency2026(assets2026)} (Junio 2026)
          </p>
          <Badge variant="outline" className="mt-2">
            vs {formatCurrency2026(assets2025)} Dic 2025
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};
