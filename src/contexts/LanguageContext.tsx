import React, { createContext, useContext, useState } from 'react';

type Language = 'es' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  es: {
    // Header
    title: "Dashboard Financiero",
    subtitle: "Asociación Horizonte Positivo - Estados Financieros y Objetivos 2025",
    
    // Balance
    balance: "Balance General",
    balanceSubtitle: "Comparativo Diciembre 2024 vs Agosto 2025 (US$)",
    assets: "Activos",
    liabilities: "Pasivos", 
    equity: "Patrimonio",
    dec2024: "Diciembre 2024",
    aug2025: "Agosto 2025",
    
    // Income Statement
    resultsTitle: "Estado de Resultados por Costos",
    resultsSubtitle: "Principales egresos - Agosto 2025 (US$)",
    totalResults: "Estado de Resultados Total",
    totalResultsSubtitle: "Resumen financiero - Agosto 2025 (US$)",
    income: "Ingresos",
    expenses: "Egresos", 
    netResult: "Resultado Neto",
    budgeted: "Presupuestado",
    executed: "Ejecutado",
    progress: "Avance",
    
    // Membership
    membership: "Membresía",
    membershipSubtitle: "Distribución de asociados",
    active: "Activos",
    inactive: "Inactivos",
    total: "Total",
    members: "Asociados",
    
    // Budget
    budget: "Presupuesto vs Ejecución",
    budgetSubtitle: "Comparativo presupuesto 2025 (US$)",
    incomeProgress: "Ingresos - % Avance",
    expensesProgress: "Egresos - % Avance",
    
    // Categories
    personal: "Personal",
    technology: "Tecnología", 
    representation: "Representación",
    communication: "Comunicación y Mercadeo",
    professional: "Servicios Profesionales",
    rent: "Alquiler Oficinas y Parqueos",
    taxes: "Impuestos",
    depreciation: "Depreciación",
    memberFees: "Cuotas de Asociados",
    community: "Comunidad"
  },
  en: {
    // Header
    title: "Financial Dashboard",
    subtitle: "Horizonte Positivo Association - Financial Statements and Goals 2025",
    
    // Balance
    balance: "Balance Sheet", 
    balanceSubtitle: "December 2024 vs August 2025 Comparison (US$)",
    assets: "Assets",
    liabilities: "Liabilities",
    equity: "Equity", 
    dec2024: "December 2024",
    aug2025: "August 2025",
    
    // Income Statement
    resultsTitle: "Income Statement by Costs",
    resultsSubtitle: "Main expenses - August 2025 (US$)",
    totalResults: "Total Income Statement", 
    totalResultsSubtitle: "Financial summary - August 2025 (US$)",
    income: "Income",
    expenses: "Expenses",
    netResult: "Net Result", 
    budgeted: "Budget",
    executed: "Actual",
    progress: "Progress",
    
    // Membership
    membership: "Membership",
    membershipSubtitle: "Members distribution", 
    active: "Active",
    inactive: "Inactive",
    total: "Total",
    members: "Members",
    
    // Budget
    budget: "Budget vs Actual",
    budgetSubtitle: "2025 budget comparison (US$)",
    incomeProgress: "Income - % Progress",
    expensesProgress: "Expenses - % Progress",
    
    // Categories  
    personal: "Personnel",
    technology: "Technology",
    representation: "Representation", 
    communication: "Communication & Marketing",
    professional: "Professional Services",
    rent: "Office & Parking Rent", 
    taxes: "Taxes",
    depreciation: "Depreciation",
    memberFees: "Member Fees", 
    community: "Community"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('es');
  
  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};