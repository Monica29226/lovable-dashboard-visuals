import { useState, useEffect } from "react";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, RefreshCw, ArrowLeft, ChevronDown, ChevronRight, Receipt, DollarSign, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

interface ProcessedRow {
  name: string;
  monthlyValues: number[];
  total: number;
  type: string;
  level: number;
  children?: ProcessedRow[];
}

const IncomeRow = ({ row, months, level = 0 }: { row: ProcessedRow; months: string[]; level?: number }) => {
  const [isOpen, setIsOpen] = useState(level < 2); // Auto-expand primeros 2 niveles
  const hasChildren = row.children && row.children.length > 0;
  
  const paddingLeft = `${level * 1.5}rem`;
  
  const isTotal = row.type === 'Summary' || row.type === 'TotalIncome' || row.type === 'TotalExpenses';
  const isSection = row.type === 'Section';
  
  const rowClass = isTotal 
    ? "bg-muted/50 font-bold border-t-2 border-t-primary" 
    : isSection 
    ? "font-semibold bg-muted/20" 
    : "hover:bg-muted/10";

  if (!hasChildren) {
    return (
      <tr className={rowClass}>
        <td className="border border-border px-4 py-2 whitespace-nowrap" style={{ paddingLeft }}>
          {row.name}
        </td>
        {row.monthlyValues.map((value, idx) => (
          <td key={idx} className="border border-border px-4 py-2 text-right whitespace-nowrap min-w-[120px]">
            {value !== 0 ? formatCurrency(value) : '-'}
          </td>
        ))}
        <td className="border border-border px-4 py-2 text-right font-semibold whitespace-nowrap min-w-[120px] bg-muted/20">
          {formatCurrency(row.total)}
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr className={rowClass}>
        <td className="border border-border px-4 py-2 whitespace-nowrap" style={{ paddingLeft }}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 hover:text-primary w-full text-left transition-colors"
          >
            {isOpen ? <ChevronDown className="h-4 w-4 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 flex-shrink-0" />}
            <span>{row.name}</span>
          </button>
        </td>
        {/* Para cuentas padre con subcuentas, mostrar solo guiones */}
        {months.map((_, idx) => (
          <td key={idx} className="border border-border px-4 py-2 text-right text-muted-foreground whitespace-nowrap min-w-[120px]">
            -
          </td>
        ))}
        <td className="border border-border px-4 py-2 text-right font-semibold whitespace-nowrap min-w-[120px] bg-muted/20">
          {isTotal ? formatCurrency(row.total) : '-'}
        </td>
      </tr>
      {isOpen && row.children!.map((child, idx) => (
        <IncomeRow key={idx} row={child} months={months} level={level + 1} />
      ))}
    </>
  );
};

const QuickBooksIncomeContent = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { selectedCompanyId, companies } = useCompany();
  const [loading, setLoading] = useState(false);
  const [incomeData, setIncomeData] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  const texts = {
    es: {
      title: 'Pérdidas y Ganancias por Mes',
      connectButton: 'Conectar QuickBooks',
      updateButton: 'Actualizar',
      income: 'Ingresos',
      expenses: 'Gastos',
      netIncome: 'Utilidad Neta',
      total: 'Total',
      account: 'Cuenta',
      noData: 'No hay datos disponibles',
      period: 'Período'
    },
    en: {
      title: 'Profit and Loss by Month',
      connectButton: 'Connect QuickBooks',
      updateButton: 'Update',
      income: 'Income',
      expenses: 'Expenses',
      netIncome: 'Net Income',
      total: 'Total',
      account: 'Account',
      noData: 'No data available',
      period: 'Period'
    }
  };

  const t = texts[language];

  const handleAuth = async () => {
    if (!selectedCompanyId) {
      toast.error(language === 'es' ? 'Por favor selecciona una empresa' : 'Please select a company');
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('quickbooks-auth', {
        body: { companyId: selectedCompanyId }
      });
      
      if (error) throw error;
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(language === 'es' ? 'Error al autenticar con QuickBooks' : 'Error authenticating with QuickBooks');
    } finally {
      setLoading(false);
    }
  };

  const fetchIncome = async () => {
    if (!selectedCompanyId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('quickbooks-income', {
        body: { companyId: selectedCompanyId }
      });
      
      if (error) throw error;
      
      console.log('Income data received:', data);
      setIncomeData(data);
      setLastUpdate(new Date());
      toast.success(language === 'es' ? 'Datos actualizados' : 'Data updated');
    } catch (error) {
      console.error('Error fetching income:', error);
      toast.error(language === 'es' ? 'Error al cargar datos' : 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedCompanyId) return;
    const checkAuth = async () => {
      try {
        const { data } = await supabase.functions.invoke('quickbooks-check-auth', {
          body: { companyId: selectedCompanyId }
        });
        setIsAuthenticated(data?.authenticated || false);
        if (data?.authenticated) {
          fetchIncome();
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };
    checkAuth();

    const interval = setInterval(() => {
      if (isAuthenticated) {
        fetchIncome();
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [selectedCompanyId, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <header className="bg-card rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/quickbooks-hub')}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-primary mb-2">{t.title}</h1>
                  <p className="text-muted-foreground">{selectedCompany?.company_name || '-'}</p>
                </div>
              </div>
              <LanguageToggle />
            </div>
          </header>
          
          {/* Quick Navigation */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => navigate('/quickbooks-balance')}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Balance General
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/quickbooks-accounts-payable')}>
                  <Receipt className="h-4 w-4 mr-2" />
                  Cuentas por Pagar
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/quickbooks-accounts-receivable')}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Cuentas por Cobrar
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <p className="mb-4 text-muted-foreground">
                {language === 'es' 
                  ? 'Para ver el estado de resultados, primero debes conectar tu cuenta de QuickBooks desde el Centro de QuickBooks.'
                  : 'To view the income statement, you must first connect your QuickBooks account from the QuickBooks Hub.'}
              </p>
              <Button onClick={() => navigate('/quickbooks-hub')}>
                {language === 'es' ? 'Ir al Centro de QuickBooks' : 'Go to QuickBooks Hub'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <header className="bg-card rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/quickbooks-hub')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-primary mb-2">{t.title}</h1>
                <p className="text-muted-foreground">
                  {selectedCompany?.company_name || '-'}
                  {incomeData?.startDate && incomeData?.endDate && (
                    <> • {t.period}: {incomeData.startDate} - {incomeData.endDate}</>
                  )}
                  {lastUpdate && <> • Actualizado: {lastUpdate.toLocaleTimeString('es-CR')}</>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={fetchIncome}
                disabled={loading}
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <LanguageToggle />
            </div>
          </div>
        </header>

        {/* Quick Navigation */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => navigate('/quickbooks-balance')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Balance General
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/quickbooks-accounts-payable')}>
                <Receipt className="h-4 w-4 mr-2" />
                Cuentas por Pagar
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/quickbooks-accounts-receivable')}>
                <DollarSign className="h-4 w-4 mr-2" />
                Cuentas por Cobrar
              </Button>
            </div>
          </CardContent>
        </Card>

        {incomeData ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {incomeData.totalIncome && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t.income}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-600">
                      {formatCurrency(incomeData.totalIncome.total)}
                    </p>
                  </CardContent>
                </Card>
              )}

              {incomeData.totalExpenses && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t.expenses}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-red-600">
                      {formatCurrency(Math.abs(incomeData.totalExpenses.total))}
                    </p>
                  </CardContent>
                </Card>
              )}

              {incomeData.netIncome && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t.netIncome}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-3xl font-bold ${incomeData.netIncome.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(incomeData.netIncome.total)}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Reporte Detallado */}
            {incomeData.sections && incomeData.sections.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse table-fixed">
                      <colgroup>
                        <col style={{ width: '300px', minWidth: '250px' }} />
                        {incomeData.months?.map((_: string, idx: number) => (
                          <col key={idx} style={{ width: '120px', minWidth: '120px' }} />
                        ))}
                        <col style={{ width: '120px', minWidth: '120px' }} />
                      </colgroup>
                      <thead>
                        <tr className="bg-primary/10">
                          <th className="border border-border px-4 py-3 text-left font-bold sticky left-0 bg-primary/10 z-10">{t.account}</th>
                          {incomeData.months?.map((month: string, idx: number) => {
                            // Convertir el nombre del mes abreviado a nombre completo
                            const monthNames: { [key: string]: string } = {
                              'jan': 'Enero', 'ene': 'Enero',
                              'feb': 'Febrero', 
                              'mar': 'Marzo',
                              'apr': 'Abril', 'abr': 'Abril',
                              'may': 'Mayo',
                              'jun': 'Junio',
                              'jul': 'Julio',
                              'aug': 'Agosto', 'ago': 'Agosto',
                              'sep': 'Septiembre',
                              'oct': 'Octubre',
                              'nov': 'Noviembre',
                              'dec': 'Diciembre', 'dic': 'Diciembre'
                            };
                            
                            // Extraer las primeras 3 letras del mes del string
                            const monthKey = month.toLowerCase().substring(0, 3);
                            const fullMonthName = monthNames[monthKey] || month;
                            
                            return (
                              <th key={idx} className="border border-border px-4 py-3 text-center font-bold whitespace-nowrap bg-primary/10">
                                {fullMonthName}
                              </th>
                            );
                          })}
                          <th className="border border-border px-4 py-3 text-center font-bold whitespace-nowrap bg-primary/20">
                            {t.total}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {incomeData.sections.map((section: ProcessedRow, idx: number) => (
                          <IncomeRow key={idx} row={section} months={incomeData.months} />
                        ))}
                        
                        {/* Totales finales */}
                        {incomeData.totalIncome && (
                          <tr className="bg-green-100 dark:bg-green-900/20 font-bold border-t-4 border-t-primary">
                            <td className="border border-border px-4 py-3 sticky left-0 bg-green-100 dark:bg-green-900/20">
                              {incomeData.totalIncome.name || t.income}
                            </td>
                            {incomeData.totalIncome.monthlyValues.map((value: number, idx: number) => (
                              <td key={idx} className="border border-border px-4 py-3 text-right whitespace-nowrap">
                                {formatCurrency(value)}
                              </td>
                            ))}
                            <td className="border border-border px-4 py-3 text-right text-green-600 dark:text-green-400 whitespace-nowrap bg-green-200 dark:bg-green-900/40">
                              {formatCurrency(incomeData.totalIncome.total)}
                            </td>
                          </tr>
                        )}
                        
                        {incomeData.totalExpenses && (
                          <tr className="bg-red-100 dark:bg-red-900/20 font-bold">
                            <td className="border border-border px-4 py-3 sticky left-0 bg-red-100 dark:bg-red-900/20">
                              {incomeData.totalExpenses.name || t.expenses}
                            </td>
                            {incomeData.totalExpenses.monthlyValues.map((value: number, idx: number) => (
                              <td key={idx} className="border border-border px-4 py-3 text-right whitespace-nowrap">
                                {formatCurrency(value)}
                              </td>
                            ))}
                            <td className="border border-border px-4 py-3 text-right text-red-600 dark:text-red-400 whitespace-nowrap bg-red-200 dark:bg-red-900/40">
                              {formatCurrency(incomeData.totalExpenses.total)}
                            </td>
                          </tr>
                        )}
                        
                        {incomeData.netIncome && (
                          <tr className="bg-primary/30 font-bold text-lg border-t-4 border-t-primary">
                            <td className="border border-border px-4 py-4 sticky left-0 bg-primary/30">
                              {incomeData.netIncome.name || t.netIncome}
                            </td>
                            {incomeData.netIncome.monthlyValues.map((value: number, idx: number) => (
                              <td key={idx} className="border border-border px-4 py-4 text-right whitespace-nowrap">
                                {formatCurrency(value)}
                              </td>
                            ))}
                            <td className={`border border-border px-4 py-4 text-right whitespace-nowrap font-bold ${incomeData.netIncome.total >= 0 ? 'text-green-600 dark:text-green-400 bg-green-200 dark:bg-green-900/40' : 'text-red-600 dark:text-red-400 bg-red-200 dark:bg-red-900/40'}`}>
                              {formatCurrency(incomeData.netIncome.total)}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

const QuickBooksIncome = () => {
  return (
    <LanguageProvider>
      <QuickBooksIncomeContent />
    </LanguageProvider>
  );
};

export default QuickBooksIncome;