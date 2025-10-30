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
import { SecondMembershipChart } from "@/components/SecondMembershipChart";
import { AssociatesChart } from "@/components/AssociatesChart";
import { IncomeExpensesChart } from "@/components/IncomeExpensesChart";
import { ComparativeIncomeStatement } from "@/components/ComparativeIncomeStatement";
import { PreviousYearsTaxTable } from "@/components/PreviousYearsTaxTable";
import { BudgetExecutionTable } from "@/components/BudgetExecutionTable";
import { ExpensesByCategoryChart } from "@/components/ExpensesByCategoryChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DashboardContent = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <header className="bg-card rounded-xl shadow-sm p-6 mb-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">H+</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary uppercase tracking-tight">
                  Horizonte Positivo
                </h1>
                <p className="text-sm text-muted-foreground">Dashboard Financiero 2025</p>
              </div>
            </div>
            <LanguageToggle />
          </div>
        </header>
        
        <div className="text-center mb-6 animate-fade-in">
          <h2 className="text-3xl font-bold text-foreground mb-2 uppercase tracking-wide">
            {t('title')}
          </h2>
          <p className="text-base text-muted-foreground font-medium">
            {t('subtitle')}
          </p>
        </div>

        <Tabs defaultValue="balance" className="w-full animate-grow">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-card shadow-sm h-auto p-1 gap-1">
            <TabsTrigger 
              value="balance" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium py-3"
            >
              {t('balanceSheet')}
            </TabsTrigger>
            <TabsTrigger 
              value="statements"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium py-3"
            >
              {t('incomeStatement')}
            </TabsTrigger>
            <TabsTrigger 
              value="budget"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium py-3"
            >
              Presupuesto
            </TabsTrigger>
            <TabsTrigger 
              value="projects"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium py-3"
            >
              {t('projectResults')}
            </TabsTrigger>
            <TabsTrigger 
              value="kpis"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium py-3"
            >
              {t('kpis')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="balance" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left side - Charts */}
              <div className="space-y-6">
                {/* Patrimony Movement Chart */}
                <div className="animate-fade-in">
                  <PatrimonyMovementChart />
                </div>
                
                {/* Financial Position Chart */}
                <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <FinancialPositionChart />
                </div>
              </div>
              
              {/* Right side - Balance Sheet */}
              <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <BalanceSheet />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="statements" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Income vs Expenses Chart with Details */}
              <div className="animate-fade-in">
                <IncomeExpensesChart />
              </div>
              
              {/* Comparative Income Statement 2024 vs 2025 */}
              <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <ComparativeIncomeStatement />
              </div>

              {/* Total Income Statement & Budget */}
              <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <TotalIncomeStatement />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="budget" className="space-y-6 mt-6">
            <div className="animate-fade-in">
              <BudgetExecutionTable />
            </div>
          </TabsContent>
          
          <TabsContent value="projects" className="space-y-6 mt-6">
            <div className="animate-fade-in">
              {/* Project Income Statement */}
              <ProjectIncomeStatement />
            </div>
          </TabsContent>
          
          <TabsContent value="kpis" className="space-y-6 mt-6">
            {/* KPI Cards */}
            <div className="animate-fade-in">
              <KPICards />
            </div>
            
            {/* Deferred Income Chart */}
            <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <DeferredIncomeChart />
            </div>
            
            {/* Tax Projection */}
            <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <TaxProjectionCard />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Income Sources and Community Results */}
              <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <IncomeBySourceChart />
              </div>
              
              {/* Membership Chart - Anualidades */}
              <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <MembershipChart />
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Second Membership Chart - Asociados */}
              <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
                <SecondMembershipChart />
              </div>
              
              {/* Associates Chart - Asociados que Aportaron */}
              <div className="animate-fade-in" style={{ animationDelay: '0.65s' }}>
                <AssociatesChart />
              </div>
              
              {/* Previous Years Tax Table */}
              <div className="animate-fade-in" style={{ animationDelay: '0.7s' }}>
                <PreviousYearsTaxTable />
              </div>
            </div>
            
            {/* Expenses by Category Chart */}
            <div className="animate-fade-in" style={{ animationDelay: '0.8s' }}>
              <ExpensesByCategoryChart />
            </div>
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
