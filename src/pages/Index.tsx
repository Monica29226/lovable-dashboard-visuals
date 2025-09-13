
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { KPICards } from "@/components/KPICards";
import { FinancialPositionChart } from "@/components/FinancialPositionChart";
import { IncomeBySourceChart } from "@/components/IncomeBySourceChart";
import { ExpensesByYearChart } from "@/components/ExpensesByYearChart";
import { TotalIncomeStatement } from "@/components/TotalIncomeStatement";
import { MembershipChart } from "@/components/MembershipChart";
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

        <Tabs defaultValue="kpis" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="kpis">{t('kpis')}</TabsTrigger>
            <TabsTrigger value="statements">{t('financialStatements')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="kpis" className="space-y-8">
            {/* KPI Cards */}
            <KPICards />
            
            {/* Income Sources and Community Results */}
            <IncomeBySourceChart />
            
            {/* Membership Chart */}
            <MembershipChart />
          </TabsContent>
          
          <TabsContent value="statements" className="space-y-8">
            {/* Financial Position (Pie Chart) */}
            <FinancialPositionChart />
            
            {/* Income Statement by Costs */}
            <ExpensesByYearChart />

            {/* Total Income Statement & Budget */}
            <TotalIncomeStatement />
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
