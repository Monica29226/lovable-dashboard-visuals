import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Company {
  id: string;
  company_name: string;
  is_connected: boolean;
  realm_id: string | null;
}

interface CompanyContextType {
  selectedCompanyId: string | null;
  companies: Company[];
  selectCompany: (id: string) => void;
  loadCompanies: () => Promise<void>;
  isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCompanies = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('quickbooks_companies')
        .select('id, company_name, is_connected, realm_id')
        .order('company_name');

      if (error) throw error;

      setCompanies(data || []);
      
      // Auto-select first connected company if none selected
      if (!selectedCompanyId && data && data.length > 0) {
        const connectedCompany = data.find(c => c.is_connected) || data[0];
        setSelectedCompanyId(connectedCompany.id);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectCompany = (id: string) => {
    setSelectedCompanyId(id);
    localStorage.setItem('selectedCompanyId', id);
  };

  useEffect(() => {
    loadCompanies();
    
    // Restore selected company from localStorage
    const savedCompanyId = localStorage.getItem('selectedCompanyId');
    if (savedCompanyId) {
      setSelectedCompanyId(savedCompanyId);
    }
  }, []);

  return (
    <CompanyContext.Provider
      value={{
        selectedCompanyId,
        companies,
        selectCompany,
        loadCompanies,
        isLoading,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
