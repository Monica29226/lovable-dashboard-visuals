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
      console.log('Loading companies...');
      const { data, error } = await supabase
        .from('quickbooks_companies')
        .select('id, company_name, is_connected, realm_id')
        .order('company_name');

      if (error) {
        console.error('Error loading companies:', error);
        throw error;
      }

      console.log('Companies loaded:', data);
      setCompanies(data || []);
      
      // Auto-select Horizonte Positivo if it exists, otherwise first connected company
      if (!selectedCompanyId && data && data.length > 0) {
        const horizontePositivo = data.find(c => c.company_name === 'Horizonte Positivo');
        const connectedCompany = data.find(c => c.is_connected);
        const defaultCompany = horizontePositivo || connectedCompany || data[0];
        console.log('Auto-selecting company:', defaultCompany.company_name);
        setSelectedCompanyId(defaultCompany.id);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      setCompanies([]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectCompany = (id: string) => {
    setSelectedCompanyId(id);
    localStorage.setItem('selectedCompanyId', id);
  };

  useEffect(() => {
    const initializeCompany = async () => {
      await loadCompanies();
    };
    
    initializeCompany();
  }, []);

  useEffect(() => {
    // After companies are loaded, restore or set company selection
    if (companies.length > 0 && !selectedCompanyId) {
      const savedCompanyId = localStorage.getItem('selectedCompanyId');
      
      if (savedCompanyId && companies.find(c => c.id === savedCompanyId)) {
        // Use saved company if it exists
        setSelectedCompanyId(savedCompanyId);
      } else {
        // Default to Horizonte Positivo if no saved selection
        const horizontePositivo = companies.find(c => c.company_name === 'Horizonte Positivo');
        const defaultCompany = horizontePositivo || companies.find(c => c.is_connected) || companies[0];
        setSelectedCompanyId(defaultCompany.id);
        localStorage.setItem('selectedCompanyId', defaultCompany.id);
      }
    }
  }, [companies]);

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
