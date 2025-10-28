import { useCompany } from '@/contexts/CompanyContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const CompanySelector = () => {
  const { selectedCompanyId, companies, selectCompany, isLoading } = useCompany();
  const { language } = useLanguage();

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>{language === 'es' ? 'Cargando...' : 'Loading...'}</span>
      </div>
    );
  }

  if (companies.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedCompanyId || undefined} onValueChange={selectCompany}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={language === 'es' ? 'Seleccionar empresa' : 'Select company'}>
            <div className="flex items-center gap-2">
              <span>{selectedCompany?.company_name}</span>
              {selectedCompany?.is_connected && (
                <span className="h-2 w-2 rounded-full bg-green-500" />
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {companies.map((company) => (
            <SelectItem key={company.id} value={company.id}>
              <div className="flex items-center gap-2">
                <span>{company.company_name}</span>
                {company.is_connected && (
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
