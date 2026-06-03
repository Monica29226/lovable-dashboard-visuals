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
    subtitle: "ACL Costa Rica - Portal Financiero",
    language: "es",
    
    // Balance
    balance: "Estado de Posición Financiera",
    balanceSubtitle: "Comparativo Diciembre 2024 vs Agosto 2025 (US$)",
    assets: "Activos",
    liabilities: "Pasivos", 
    equity: "Patrimonio",
    dec2024: "Diciembre 2024",
    aug2025: "Agosto 2025",
    
    // Income Statement
    resultsTitle: "Estado de Resultados",
    resultsSubtitle: "Comparativo 2024 vs 2025 - Principales egresos (US$)",
    totalResults: "Estado de Resultados Total",
    totalResultsSubtitle: "Resumen financiero - Agosto 2025 (US$)",
    income: "Ingresos",
    expenses: "Egresos",
    totalIncome: "Total ingresos", 
    totalExpenses: "Total egresos",
    netResult: "Resultado Neto",
    netIncome: "Ingresos menos Gastos",
    budgeted: "Presupuestado",
    executed: "Ejecutado",
    progress: "Avance",
    
    // Budget Terms
    budget: "Presupuesto",
    budgetVsExecution: "Presupuesto vs Ejecución",
    annualBudget: "Presupuesto Total Anual",
    septemberBudget: "Presupuesto Setiembre",
    budgetExecution: "Ejecución Presupuestaria",
    budgetComparison: "Comparación del presupuesto anual contra lo ejecutado a Septiembre",
    pendingExecution: "Pendiente Ejecución",
    variation: "Variacion",
    accumulated: "Acumulado",
    accumulatedSeptember: "Acumulado Setiembre",
    
    // Common Terms
    detailed: "Detallado",
    summary: "Resumen",
    detailedSummary: "Resumen Detallado",
    comparative: "Comparativo",
    composition: "Composición",
    distribution: "Distribución",
    september: "Septiembre",
    
    // Membership
    membership: "Contratos",
    membershipSubtitle: "Distribución de empresas - Octubre 2025",
    active: "Facturadas",
    inactive: "No ha pagado",
    pending: "Pendientes de Facturar",
    total: "Total",
    members: "Empresas",
    
    // Associates
    associates: "Asociados",
    associatesSubtitle: "Distribución de asociados - Diciembre 2025",
    associatesWhoContributed: "Asociados que Aportaron",
    associatesActive: "Realizaron Aportes",
    associatesPending: "Faltan por Realizar",
    didNotContribute: "No aportaron",
    
    // Budget progress
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
    administrative: "Gastos administrativos",
    memberFees: "Cuotas de Asociados",
    community: "Comunidad",
    
    // New KPI terms
    kpis: "Indicadores Financieros",
    balanceSheet: "Estado de Posición Financiera",
    projectResults: "Estado de Resultados por Proyecto",
    incomeStatement: "Estado de Resultados",
    executionRate: "Porcentaje de Ejecución",
    membershipPaid: "Asociados que Aportaron",
    membershipUnpaid: "Asociados Pendientes",
    communityIncome: "Ingresos Comunidad",
    communityExpenses: "Egresos Comunidad",
    annualizedIncome: "Ingresos Anualizados",
    financialPosition: "Posición Financiera",
    year2024: "2024",
    year2025: "2025",
    previousYearsTax: "Impuestos de Rentas de Años Anteriores",
    year: "Año",
    amount: "Monto"
  },
  en: {
    // Header
    title: "Financial Dashboard",
    subtitle: "Horizonte Positivo Association - Financial Statements and Goals 2025",
    language: "en",
    
    // Balance
    balance: "Statement of Financial Position", 
    balanceSubtitle: "December 2024 vs August 2025 Comparison (US$)",
    assets: "Assets",
    liabilities: "Liabilities",
    equity: "Equity", 
    dec2024: "December 2024",
    aug2025: "August 2025",
    
    // Income Statement
    resultsTitle: "Income Statement",
    resultsSubtitle: "2024 vs 2025 Comparison - Main expenses (US$)",
    totalResults: "Total Income Statement", 
    totalResultsSubtitle: "Financial summary - August 2025 (US$)",
    income: "Income",
    expenses: "Expenses",
    totalIncome: "Total income",
    totalExpenses: "Total expenses",
    netResult: "Net Result",
    netIncome: "Income minus Expenses", 
    budgeted: "Budget",
    executed: "Actual",
    progress: "Progress",
    
    // Budget Terms
    budget: "Budget",
    budgetVsExecution: "Budget vs Actual",
    annualBudget: "Annual Total Budget",
    septemberBudget: "September Budget",
    budgetExecution: "Budget Execution",
    budgetComparison: "Annual budget comparison against September execution",
    pendingExecution: "Pending Execution",
    variation: "Variation",
    accumulated: "Accumulated",
    accumulatedSeptember: "Accumulated September",
    
    // Common Terms
    detailed: "Detailed",
    summary: "Summary",
    detailedSummary: "Detailed Summary",
    comparative: "Comparative",
    composition: "Composition",
    distribution: "Distribution",
    september: "September",
    
    // Membership
    membership: "Contracts",
    membershipSubtitle: "Companies distribution - October 2025",
    active: "Invoiced",
    inactive: "No Contributions",
    pending: "Pending Invoice",
    total: "Total",
    members: "Companies",
    
    // Associates
    associates: "Associates",
    associatesSubtitle: "Associates distribution - October 2025",
    associatesWhoContributed: "Associates Who Contributed",
    associatesActive: "Made Contributions",
    associatesPending: "Pending Contributions",
    didNotContribute: "Did not contribute",
    
    // Budget progress
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
    administrative: "Administrative Expenses",
    memberFees: "Member Fees", 
    community: "Community",
    
    // New KPI terms
    kpis: "Financial KPIs",
    balanceSheet: "Balance Sheet",
    projectResults: "Income Statement by Project",
    incomeStatement: "Income Statement",
    executionRate: "Execution Rate",
    membershipPaid: "Members Who Contributed",
    membershipUnpaid: "Pending Members",
    communityIncome: "Community Income",
    communityExpenses: "Community Expenses",
    annualizedIncome: "Annualized Income",
    financialPosition: "Financial Position",
    year2024: "2024",
    year2025: "2025",
    previousYearsTax: "Previous Years Income Tax",
    year: "Year",
    amount: "Amount"
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