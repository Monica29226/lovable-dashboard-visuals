import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Company {
  id: string;
  company_name: string;
  is_connected: boolean;
  realm_id: string | null;
  accent_color: string | null;
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
  const { user } = useAuth();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const resolveSelection = (list: Company[]) => {
    if (list.length === 0) return;

    // 1. Keep the current selection if it's still valid
    if (selectedCompanyId && list.find(c => c.id === selectedCompanyId)) {
      return;
    }

    // 2. Restore the saved selection if the user still has access to it
    const savedCompanyId = localStorage.getItem('selectedCompanyId');
    if (savedCompanyId && list.find(c => c.id === savedCompanyId)) {
      setSelectedCompanyId(savedCompanyId);
      return;
    }

    // 3. Fallback: Horizonte, then first connected, then first available
    const fallback =
      list.find(c => c.company_name === 'Horizonte Positivo') ||
      list.find(c => c.is_connected) ||
      list[0];
    setSelectedCompanyId(fallback.id);
    localStorage.setItem('selectedCompanyId', fallback.id);
  };

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
      const list = data || [];
      setCompanies(list);
      resolveSelection(list);
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
    // Only load companies when user is authenticated
    if (user) {
      loadCompanies();
    }
  }, [user]);

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
