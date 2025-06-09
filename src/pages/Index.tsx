
import { KPICards } from "@/components/KPICards";
import { BalanceChart } from "@/components/BalanceChart";
import { BudgetComparisonChart } from "@/components/BudgetComparisonChart";
import { TopIncomeChart } from "@/components/TopIncomeChart";

const Index = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Dashboard Financiero
          </h1>
          <p className="text-lg text-muted-foreground">
            Asociación Horizonte Positivo - Análisis Financiero
          </p>
        </div>

        {/* KPI Cards */}
        <KPICards />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <BalanceChart />
          <BudgetComparisonChart />
        </div>

        {/* Full Width Chart */}
        <div className="w-full">
          <TopIncomeChart />
        </div>
      </div>
    </div>
  );
};

export default Index;
