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
    balance: "Estado de Posición Financiera",
    balanceSubtitle: "Comparativo Diciembre 2024 vs Agosto 2025 (US$)",
    assets: "Activos",
    liabilities: "Pasivos", 
    equity: "Patrimonio",
    dec2024: "Diciembre 2024",
    aug2025: "Agosto 2025",
    
    // Income Statement
    resultsTitle: "Estado de Resultados por Costos",
    resultsSubtitle: "Comparativo 2024 vs 2025 - Principales egresos (US$)",
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
    membershipSubtitle: "Distribución de asociados - Agosto 2025", 
    active: "Realizaron Aportes",
    inactive: "No ha pagado",
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
    community: "Comunidad",
    
    // New KPI terms
    kpis: "Indicadores Financieros",
    financialStatements: "Estados Financieros",
    executionRate: "Porcentaje de Ejecución",
    membershipPaid: "Asociados que Aportaron",
    membershipUnpaid: "Asociados Pendientes",
    communityIncome: "Ingresos Comunidad",
    communityExpenses: "Egresos Comunidad",
    annualizedIncome: "Ingresos Anualizados",
    financialPosition: "Posición Financiera",
    year2024: "2024",
    year2025: "2025"
  },
  en: {
    // Header
    title: "Financial Dashboard",
    subtitle: "Horizonte Positivo Association - Financial Statements and Goals 2025",
    
    // Balance
    balance: "Statement of Financial Position", 
    balanceSubtitle: "December 2024 vs August 2025 Comparison (US$)",
    assets: "Assets",
    liabilities: "Liabilities",
    equity: "Equity", 
    dec2024: "December 2024",
    aug2025: "August 2025",
    
    // Income Statement
    resultsTitle: "Income Statement by Costs",
    resultsSubtitle: "2024 vs 2025 Comparison - Main expenses (US$)",
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
    membershipSubtitle: "Members distribution - August 2025", 
    active: "Made Contributions",
    inactive: "No Contributions",
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
    community: "Community",
    
    // New KPI terms
    kpis: "Financial KPIs",
    financialStatements: "Financial Statements",
    executionRate: "Execution Rate",
    membershipPaid: "Members Who Contributed",
    membershipUnpaid: "Pending Members",
    communityIncome: "Community Income",
    communityExpenses: "Community Expenses",
    annualizedIncome: "Annualized Income",
    financialPosition: "Financial Position",
    year2024: "2024",
    year2025: "2025"
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