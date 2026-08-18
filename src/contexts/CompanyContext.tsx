import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useBusinessGroups, BusinessGroup } from '@/hooks/useBusinessGroups';

interface Company {
  id: string;
  company_name: string;
  is_connected: boolean;
  realm_id: string | null;
  accent_color: string | null;
  data_source: 'quickbooks' | 'excel';
}


interface CompanyContextType {
  selectedCompanyId: string | null;
  companies: Company[];
  selectCompany: (id: string) => void;
  loadCompanies: () => Promise<void>;
  isLoading: boolean;
  // Grupos empresariales
  groups: BusinessGroup[];
  hasGroups: boolean;
  selectedGroupId: string | null;
  isGlobalView: boolean;
  enterGlobalView: (groupId?: string) => void;
  groupCompanyIds: string[];
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { groups, hasGroups } = useBusinessGroups();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isGlobalView, setIsGlobalView] = useState(false);


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
        .select('id, company_name, is_connected, realm_id, accent_color, data_source')
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
    setIsGlobalView(false);
    localStorage.setItem('selectedCompanyId', id);
    localStorage.setItem('viewMode', 'company');
  };

  const enterGlobalView = (groupId?: string) => {
    const target = groupId ?? selectedGroupId ?? groups[0]?.id ?? null;
    if (!target) return;
    setSelectedGroupId(target);
    setIsGlobalView(true);
    localStorage.setItem('viewMode', 'global');
    localStorage.setItem('selectedGroupId', target);
  };

  useEffect(() => {
    // Only load companies when user is authenticated
    if (user) {
      loadCompanies();
    }
  }, [user]);

  // Al ingresar, un cliente de grupo abre en "Vista global" (salvo que haya elegido una empresa).
  useEffect(() => {
    if (!hasGroups) return;
    const saved = localStorage.getItem('selectedGroupId');
    const group = groups.find((g) => g.id === saved) ?? groups[0];
    setSelectedGroupId((prev) => prev ?? group.id);
    if (localStorage.getItem('viewMode') !== 'company') {
      setIsGlobalView(true);
    }
  }, [hasGroups, groups]);

  // Apply the selected company's white-label accent (--co) at runtime.
  useEffect(() => {
    const root = document.documentElement;
    const selected = companies.find((c) => c.id === selectedCompanyId);
    const accent = selected?.accent_color?.trim() || '218 92% 24%';
    root.style.setProperty('--co', accent);
    root.style.setProperty('--co-soft', accent);
  }, [selectedCompanyId, companies]);

  const groupCompanyIds = (groups.find((g) => g.id === selectedGroupId)?.companies ?? [])
    .filter((c) => c.include_in_consolidation)
    .map((c) => c.company_id);

  return (
    <CompanyContext.Provider
      value={{
        selectedCompanyId,
        companies,
        selectCompany,
        loadCompanies,
        isLoading,
        groups,
        hasGroups,
        selectedGroupId,
        isGlobalView,
        enterGlobalView,
        groupCompanyIds,
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
