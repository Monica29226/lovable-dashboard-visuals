// Dashboard page with language context
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { KPICards } from "@/components/KPICards";
import { PatrimonyMovementChart } from "@/components/PatrimonyMovementChart";
import { DeferredIncomeChart } from "@/components/DeferredIncomeChart";
import { TaxProjectionCard } from "@/components/TaxProjectionCard";
import { FinancialPositionChart } from "@/components/FinancialPositionChart";
import { IncomeBySourceChart } from "@/components/IncomeBySourceChart";
import { TotalIncomeStatement } from "@/components/TotalIncomeStatement";
import { BalanceSheet } from "@/components/BalanceSheet";
import { ProjectIncomeStatement } from "@/components/ProjectIncomeStatement";
import { MembershipChart } from "@/components/MembershipChart";
import { IncomeExpensesChart } from "@/components/IncomeExpensesChart";
import { ComparativeIncomeStatement } from "@/components/ComparativeIncomeStatement";
import { BudgetVsRealComparison } from "@/components/BudgetVsRealComparison";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DashboardContent = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="text-xl font-bold text-primary">Horizonte +</div>
          </div>
          <LanguageToggle />
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {t('title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        <Tabs defaultValue="balance" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="balance">{t('balanceSheet')}</TabsTrigger>
            <TabsTrigger value="statements">{t('incomeStatement')}</TabsTrigger>
            <TabsTrigger value="projects">{t('projectResults')}</TabsTrigger>
            <TabsTrigger value="kpis">{t('kpis')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="balance" className="space-y-8">
            {/* Financial Position (Pie Chart) */}
            <FinancialPositionChart />
            
            {/* Balance Sheet */}
            <BalanceSheet />
          </TabsContent>
          
          <TabsContent value="statements" className="space-y-8">
            {/* Income vs Expenses Chart with Details */}
            <IncomeExpensesChart />
            
            {/* Budget vs Real Comparison Sept 2024 vs Sept 2025 */}
            <BudgetVsRealComparison />
            
            {/* Comparative Income Statement 2024 vs 2025 */}
            <ComparativeIncomeStatement />

            {/* Total Income Statement & Budget */}
            <TotalIncomeStatement />
          </TabsContent>
          
          <TabsContent value="projects" className="space-y-8">
            {/* Project Income Statement */}
            <ProjectIncomeStatement />
          </TabsContent>
          
          <TabsContent value="kpis" className="space-y-8">
            {/* KPI Cards */}
            <KPICards />
            
            {/* Patrimony Movement Chart */}
            <PatrimonyMovementChart />
            
            {/* Deferred Income Chart */}
            <DeferredIncomeChart />
            
            {/* Tax Projection */}
            <TaxProjectionCard />
            
            {/* Income Sources and Community Results */}
            <IncomeBySourceChart />
            
            {/* Membership Chart */}
            <MembershipChart />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const Index = () => {
  return (
    <LanguageProvider>
      <DashboardContent />
    </LanguageProvider>
  );
};

export default Index;
