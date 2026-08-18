import { useCompany } from '@/contexts/CompanyContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

const GLOBAL_VALUE = '__global__';

export const CompanySelector = () => {
  const {
    selectedCompanyId, companies, selectCompany, isLoading,
    hasGroups, groups, selectedGroupId, isGlobalView, enterGlobalView, groupCompanyIds,
  } = useCompany();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);
  const group = groups.find(g => g.id === selectedGroupId);

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

  // Vista de grupo: "Vista global" encima de las empresas del grupo.
  if (hasGroups && group) {
    const groupCompanies = groupCompanyIds
      .map(id => companies.find(c => c.id === id))
      .filter(Boolean) as typeof companies;
    const others = companies.filter(c => !groupCompanyIds.includes(c.id));

    const handleChange = (value: string) => {
      if (value === GLOBAL_VALUE) {
        enterGlobalView(group.id);
        navigate('/vista-global');
      } else {
        selectCompany(value);
        navigate('/quickbooks');
      }
    };

    return (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <Select value={isGlobalView ? GLOBAL_VALUE : selectedCompanyId || undefined} onValueChange={handleChange}>
          <SelectTrigger className="w-[240px]">
            <SelectValue>
              {isGlobalView
                ? (language === 'es' ? `Vista global · ${group.name}` : `Global view · ${group.name}`)
                : selectedCompany?.company_name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={GLOBAL_VALUE}>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>{language === 'es' ? `Vista global · ${group.name}` : `Global view · ${group.name}`}</span>
              </div>
            </SelectItem>
            {[...groupCompanies, ...others].map((company) => (
              <SelectItem key={company.id} value={company.id}>
                <div className="flex items-center gap-2">
                  <span className="pl-4">{company.company_name}</span>
                  {company.is_connected && <span className="h-2 w-2 rounded-full bg-green-500" />}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (companies.length === 1) {
    const company = companies[0];
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span>{company.company_name}</span>
        {company.is_connected && (
          <span className="h-2 w-2 rounded-full bg-green-500" />
        )}
      </div>
    );
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

