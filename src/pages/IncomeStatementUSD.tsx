import { useLanguage } from "@/contexts/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { IncomeStatementUSD } from "@/components/IncomeStatementUSD";

const IncomeStatementUSDPage = () => {
  const { language } = useLanguage();
  const { selectedCompanyId, companies } = useCompany();
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  const title = language === 'es' ? 'Estado de Resultados (USD)' : 'Income Statement (USD)';

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{title}</h1>
        {selectedCompany?.company_name && (
          <p className="text-muted-foreground mt-1">{selectedCompany.company_name}</p>
        )}
      </header>

      <IncomeStatementUSD companyId={selectedCompanyId} />
    </div>
  );
};

export default IncomeStatementUSDPage;
