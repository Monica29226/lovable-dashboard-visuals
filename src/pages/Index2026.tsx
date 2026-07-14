import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import dashboardHero from "@/assets/dashboard-hero.png";
import horizonteLogo from "@/assets/horizonte-logo.png";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KPICards2026 } from "@/components/KPICards2026";
import { IncomeExpensesChart2026 } from "@/components/IncomeExpensesChart2026";
import { BalanceSheet2026 } from "@/components/BalanceSheet2026";
import { FinancialPositionChart2026 } from "@/components/FinancialPositionChart2026";
import { PatrimonyMovementChart2026 } from "@/components/PatrimonyMovementChart2026";
import { MembershipCharts2026 } from "@/components/MembershipCharts2026";
import { financialData2026 } from "@/data/financialData2026";
import { useCompany } from "@/contexts/CompanyContext";
import { CompanyQuickBooksDashboard } from "@/components/CompanyQuickBooksDashboard";
import { ManagerialDashboard } from "@/components/dashboard/ManagerialDashboard";
import { EnfoqueDashboard } from "@/components/EnfoqueDashboard";
import { OperationalCompanyDashboard } from "@/components/OperationalCompanyDashboard";
import { BudgetVsRealStatic2026 } from "@/components/BudgetVsRealStatic2026";
import { isHorizonte, isEnfoque, isRaci } from "@/lib/company";
import { Loader2 } from "lucide-react";

const DashboardContent2026 = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div 
        className="relative w-full h-[260px] md:h-[300px] bg-cover bg-center mb-6"
        style={{ backgroundImage: `url(${dashboardHero})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628]/95 via-[#1a2847]/95 to-[#2d4875]/90" />
        <div className="relative max-w-[1600px] mx-auto h-full flex items-center justify-center p-6 md:p-8">
          <div className="animate-fade-in">
            <div className="border-4 border-[#4a7ba7]/50 rounded-lg p-6 md:p-8 bg-[#1a2847]/30 backdrop-blur-sm">
              <img 
                src={horizonteLogo} 
                alt="Horizonte Positivo" 
                className="w-56 h-auto md:w-72 drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto space-y-6 px-4 md:px-6">
        <div className="text-center mb-6 animate-fade-in">
          <h2 className="text-3xl font-bold text-foreground mb-2 uppercase tracking-wide">
            Panel Financiero 2026
          </h2>
          <p className="text-base text-muted-foreground font-medium">
            Asociación Horizonte Positivo - {financialData2026.period}
          </p>
        </div>

        <Tabs defaultValue="balance" className="w-full animate-grow">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-card shadow-sm h-auto p-1 gap-1">
            <TabsTrigger 
              value="balance" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium py-3"
            >
              Estado de Posición Financiera
            </TabsTrigger>
            <TabsTrigger 
              value="statements"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium py-3"
            >
              Estado de Resultados
            </TabsTrigger>
            <TabsTrigger 
              value="execution"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium py-3"
            >
              Presupuesto vs. Real
            </TabsTrigger>
            <TabsTrigger 
              value="kpis"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium py-3"
            >
              Indicadores (KPIs)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="balance" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left side - Numbers */}
              <div className="animate-fade-in">
                <BalanceSheet2026 />
              </div>

              {/* Right side - Charts */}
              <div className="space-y-6">
                <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <PatrimonyMovementChart2026 />
                </div>
                <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <FinancialPositionChart2026 />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="statements" className="space-y-6 mt-6">
            <div className="animate-fade-in">
              <IncomeExpensesChart2026 />
            </div>
          </TabsContent>

          <TabsContent value="execution" className="space-y-6 mt-6">
            <div className="animate-fade-in">
              <BudgetVsRealStatic2026 />
            </div>
          </TabsContent>

          <TabsContent value="kpis" className="space-y-6 mt-6">
            <div className="animate-fade-in">
              <KPICards2026 />
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <MembershipCharts2026 />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const Index2026 = () => {
  const { selectedCompanyId, companies, isLoading } = useCompany();
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (selectedCompany && isEnfoque(selectedCompany.company_name)) {
    return (
      <EnfoqueDashboard
        companyId={selectedCompany.id}
        companyName={selectedCompany.company_name}
        isConnected={selectedCompany.is_connected}
      />
    );
  }

  if (selectedCompany && isRaci(selectedCompany.company_name)) {
    return <OperationalCompanyDashboard companyName={selectedCompany.company_name} />;
  }

  if (selectedCompany && !isHorizonte(selectedCompany.company_name)) {
    if (selectedCompany.data_source === "excel") {
      return (
        <LanguageProvider>
          <CompanyQuickBooksDashboard
            companyId={selectedCompany.id}
            companyName={selectedCompany.company_name}
            isConnected={selectedCompany.is_connected}
            dataSource={selectedCompany.data_source}
          />
        </LanguageProvider>
      );
    }
    return (
      <ManagerialDashboard
        companyId={selectedCompany.id}
        companyName={selectedCompany.company_name}
        isConnected={selectedCompany.is_connected}
      />
    );
  }

  return (
    <LanguageProvider>
      <DashboardContent2026 />
    </LanguageProvider>
  );
};

export default Index2026;
