
import { KPICards } from "@/components/KPICards";
import { FinancialPositionChart } from "@/components/FinancialPositionChart";
import { BudgetComparisonChart } from "@/components/BudgetComparisonChart";
import { TopIncomeChart } from "@/components/TopIncomeChart";
import { IncomeBySourceChart } from "@/components/IncomeBySourceChart";
import { OKRProgressChart } from "@/components/OKRProgressChart";
import { ExpensesByMonthChart } from "@/components/ExpensesByMonthChart";

const Index = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Dashboard Financiero & OKRs
          </h1>
          <p className="text-lg text-muted-foreground">
            Asociación Horizonte Positivo - Estados Financieros y Objetivos 2025
          </p>
        </div>

        {/* KPI Cards */}
        <KPICards />

        {/* OKR Progress */}
        <OKRProgressChart />

        {/* Financial Position Chart with Interactive Details */}
        <FinancialPositionChart />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <BudgetComparisonChart />
          <IncomeBySourceChart />
        </div>

        {/* Expenses by Month Chart with Drill-down */}
        <ExpensesByMonthChart />

        {/* Full Width Chart */}
        <div className="w-full">
          <TopIncomeChart />
        </div>
      </div>
    </div>
  );
};

export default Index;
