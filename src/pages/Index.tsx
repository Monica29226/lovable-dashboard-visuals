
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { BalanceSheet } from "@/components/BalanceSheet";
import { IncomeStatementByCosts } from "@/components/IncomeStatementByCosts";
import { TotalIncomeStatement } from "@/components/TotalIncomeStatement";
import { MembershipChart } from "@/components/MembershipChart";

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

        {/* Balance Sheet */}
        <BalanceSheet />

        {/* Income Statement by Costs */}
        <IncomeStatementByCosts />

        {/* Total Income Statement & Budget */}
        <TotalIncomeStatement />

        {/* Membership Chart */}
        <MembershipChart />
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
