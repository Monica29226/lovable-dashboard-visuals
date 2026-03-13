import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { BudgetProvider, useBudget } from "@/contexts/BudgetContext";
import dashboardHero from "@/assets/dashboard-hero.png";
import horizonteLogo from "@/assets/horizonte-logo.png";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KPICards2026 } from "@/components/KPICards2026";
import { IncomeExpensesChart2026 } from "@/components/IncomeExpensesChart2026";
import { BudgetMonthlyView2026 } from "@/components/BudgetMonthlyView2026";

const DashboardContent2026 = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
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
            Panel Financiero 2026
          </h2>
          <p className="text-base text-muted-foreground font-medium">
            Asociación Horizonte Positivo - Presupuesto y Proyección 2026
          </p>
        </div>

        <Tabs defaultValue="resumen" className="w-full animate-grow">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 bg-card shadow-sm h-auto p-1 gap-1">
            <TabsTrigger 
              value="resumen" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium py-3"
            >
              Resumen e Indicadores
            </TabsTrigger>
            <TabsTrigger 
              value="estado-resultados"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium py-3"
            >
              Estado de Resultados
            </TabsTrigger>
            <TabsTrigger 
              value="mensual"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium py-3"
            >
              Vista Mensual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="space-y-6 mt-6">
            <div className="animate-fade-in">
              <KPICards2026 />
            </div>
          </TabsContent>

          <TabsContent value="estado-resultados" className="space-y-6 mt-6">
            <div className="animate-fade-in">
              <IncomeExpensesChart2026 />
            </div>
          </TabsContent>

          <TabsContent value="mensual" className="space-y-6 mt-6">
            <div className="animate-fade-in">
              <BudgetMonthlyView2026 />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const Index2026 = () => {
  return (
    <LanguageProvider>
      <BudgetProvider>
        <DashboardContent2026 />
      </BudgetProvider>
    </LanguageProvider>
  );
};

export default Index2026;
