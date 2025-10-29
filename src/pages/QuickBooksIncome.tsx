import { useState, useEffect } from "react";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, RefreshCw, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
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
      title: 'Estado de Resultados',
      connectButton: 'Conectar QuickBooks',
      updateButton: 'Actualizar',
      income: 'Ingresos',
      expenses: 'Gastos',
      netIncome: 'Utilidad Neta',
      total: 'Total',
      account: 'Cuenta',
      noData: 'No hay datos disponibles'
    },
    en: {
      title: 'Income Statement',
      connectButton: 'Connect QuickBooks',
      updateButton: 'Update',
      income: 'Income',
      expenses: 'Expenses',
      netIncome: 'Net Income',
      total: 'Total',
      account: 'Account',
      noData: 'No data available'
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

    // Auto-actualizar cada 60 segundos
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
          <Card>
            <CardContent className="pt-6">
              <p className="mb-4 text-muted-foreground">
                {language === 'es' 
                  ? 'Para ver el estado de resultados, primero debes conectar tu cuenta de QuickBooks.'
                  : 'To view the income statement, you must first connect your QuickBooks account.'}
              </p>
              <Button onClick={handleAuth} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t.connectButton}
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
                  {selectedCompany?.company_name || '-'} • 
                  {lastUpdate && ` Actualizado: ${lastUpdate.toLocaleTimeString('es-CR')}`}
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

        {incomeData ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.income}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(incomeData.totalIncome?.total || 0)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.expenses}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-600">
                    {formatCurrency(Math.abs(incomeData.totalExpenses?.total || 0))}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.netIncome}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-3xl font-bold ${(incomeData.netIncome?.total || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(incomeData.netIncome?.total || 0)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Income Table */}
            {incomeData.income && incomeData.income.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t.income}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-bold">{t.account}</TableHead>
                          {incomeData.months?.map((month: string, idx: number) => (
                            <TableHead key={idx} className="text-right">{month}</TableHead>
                          ))}
                          <TableHead className="text-right font-bold">{t.total}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {incomeData.income.map((item: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            {item.monthlyValues?.map((value: number, mIdx: number) => (
                              <TableCell key={mIdx} className="text-right">
                                {formatCurrency(value)}
                              </TableCell>
                            ))}
                            <TableCell className="text-right font-bold">
                              {formatCurrency(item.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50">
                          <TableCell className="font-bold">{t.total}</TableCell>
                          {incomeData.totalIncome?.monthlyValues?.map((value: number, idx: number) => (
                            <TableCell key={idx} className="text-right font-bold">
                              {formatCurrency(value)}
                            </TableCell>
                          ))}
                          <TableCell className="text-right font-bold text-green-600">
                            {formatCurrency(incomeData.totalIncome?.total || 0)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Expenses Table */}
            {incomeData.expenses && incomeData.expenses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t.expenses}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-bold">{t.account}</TableHead>
                          {incomeData.months?.map((month: string, idx: number) => (
                            <TableHead key={idx} className="text-right">{month}</TableHead>
                          ))}
                          <TableHead className="text-right font-bold">{t.total}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {incomeData.expenses.map((item: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            {item.monthlyValues?.map((value: number, mIdx: number) => (
                              <TableCell key={mIdx} className="text-right">
                                {formatCurrency(Math.abs(value))}
                              </TableCell>
                            ))}
                            <TableCell className="text-right font-bold">
                              {formatCurrency(Math.abs(item.total))}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50">
                          <TableCell className="font-bold">{t.total}</TableCell>
                          {incomeData.totalExpenses?.monthlyValues?.map((value: number, idx: number) => (
                            <TableCell key={idx} className="text-right font-bold">
                              {formatCurrency(Math.abs(value))}
                            </TableCell>
                          ))}
                          <TableCell className="text-right font-bold text-red-600">
                            {formatCurrency(Math.abs(incomeData.totalExpenses?.total || 0))}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
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
