// Dashboard page with language context
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import dashboardHero from "@/assets/dashboard-hero.png";
import horizonteLogo from "@/assets/horizonte-logo.png";
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
import { IncomeExpensesChart } from "@/components/IncomeExpensesChart";
import { ComparativeIncomeStatement } from "@/components/ComparativeIncomeStatement";
import { PreviousYearsTaxTable } from "@/components/PreviousYearsTaxTable";
import { BudgetExecutionTable } from "@/components/BudgetExecutionTable";
import { AssociateCompositionTable } from "@/components/AssociateCompositionTable";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DashboardContent = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Background Image */}
      <div 
        className="relative w-full h-[500px] md:h-[600px] bg-cover bg-center mb-6"
        style={{ backgroundImage: `url(${dashboardHero})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628]/95 via-[#1a2847]/95 to-[#2d4875]/90" />
        <div className="relative max-w-[1600px] mx-auto h-full flex flex-col justify-between p-8 md:p-12">
          <div className="flex justify-center pb-12 border-b-2 border-white/30">
            <div className="animate-fade-in">
              <div className="border-4 border-[#4a7ba7]/50 rounded-lg p-8 bg-[#1a2847]/30 backdrop-blur-sm">
                <img 
                  src={horizonteLogo} 
                  alt="Horizonte Positivo" 
                  className="w-64 h-auto md:w-80 drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto space-y-6 px-4 md:px-6">
        
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
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Second Membership Chart - Asociados */}
              <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
                <SecondMembershipChart />
              </div>
              
              {/* Associate Composition Table */}
              <div className="animate-fade-in" style={{ animationDelay: '0.65s' }}>
                <AssociateCompositionTable />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {/* Previous Years Tax Table */}
              <div className="animate-fade-in" style={{ animationDelay: '0.7s' }}>
                <PreviousYearsTaxTable />
              </div>
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
