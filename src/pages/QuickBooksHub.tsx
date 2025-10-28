import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, BarChart3, DollarSign, FileText, TrendingUp, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

const QuickBooksHubContent = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { selectedCompanyId, companies, selectCompany } = useCompany();
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  const texts = {
    es: {
      title: 'Centro de QuickBooks',
      subtitle: 'Conecta y visualiza tus reportes financieros',
      connectionStatus: 'Estado de Conexión',
      connected: 'Conectado',
      disconnected: 'Desconectado',
      connectButton: 'Conectar con QuickBooks',
      selectReport: 'Selecciona un Reporte',
      selectReportDesc: 'Elige el reporte que deseas visualizar',
      reports: {
        balance: {
          title: 'Balance General',
          desc: 'Activos, Pasivos y Patrimonio'
        },
        income: {
          title: 'Estado de Resultados',
          desc: 'Ingresos, Gastos y Utilidad Neta'
        },
        cashFlow: {
          title: 'Flujo de Efectivo',
          desc: 'Entradas y Salidas de Efectivo'
        },
        profitLoss: {
          title: 'Pérdidas y Ganancias',
          desc: 'Análisis de Rentabilidad'
        }
      },
      viewReport: 'Ver Reporte',
      company: 'Empresa',
      dataInColones: 'Datos en Colones (CRC)'
    },
    en: {
      title: 'QuickBooks Hub',
      subtitle: 'Connect and view your financial reports',
      connectionStatus: 'Connection Status',
      connected: 'Connected',
      disconnected: 'Disconnected',
      connectButton: 'Connect to QuickBooks',
      selectReport: 'Select a Report',
      selectReportDesc: 'Choose the report you want to view',
      reports: {
        balance: {
          title: 'Balance Sheet',
          desc: 'Assets, Liabilities and Equity'
        },
        income: {
          title: 'Income Statement',
          desc: 'Income, Expenses and Net Income'
        },
        cashFlow: {
          title: 'Cash Flow',
          desc: 'Cash In and Cash Out'
        },
        profitLoss: {
          title: 'Profit & Loss',
          desc: 'Profitability Analysis'
        }
      },
      viewReport: 'View Report',
      company: 'Company',
      dataInColones: 'Data in Colones (CRC)'
    }
  };

  const t = texts[language];

  const availableReports = [
    {
      id: 'balance',
      title: t.reports.balance.title,
      description: t.reports.balance.desc,
      icon: BarChart3,
      route: '/quickbooks-balance',
      color: 'text-blue-500'
    },
    {
      id: 'income',
      title: t.reports.income.title,
      description: t.reports.income.desc,
      icon: DollarSign,
      route: '/quickbooks-income',
      color: 'text-green-500'
    }
  ];

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

  useEffect(() => {
    const loadCompanyAndCheckAuth = async () => {
      // Buscar específicamente "Horizonte Positivo"
      const { data: company } = await supabase
        .from('quickbooks_companies')
        .select('id, company_name, is_connected')
        .eq('company_name', 'Horizonte Positivo')
        .single();

      if (company && selectedCompanyId !== company.id) {
        // Forzar la selección de Horizonte Positivo
        selectCompany(company.id);
        return;
      }

      if (!selectedCompanyId) return;

      try {
        const { data } = await supabase.functions.invoke('quickbooks-check-auth', {
          body: { companyId: selectedCompanyId }
        });
        setIsAuthenticated(data?.authenticated || false);
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsAuthenticated(false);
      }
    };
    loadCompanyAndCheckAuth();
  }, [selectedCompanyId, selectCompany]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <header className="bg-card rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">{t.title}</h1>
              <p className="text-muted-foreground">{t.subtitle}</p>
            </div>
            <LanguageToggle />
          </div>
        </header>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{t.connectionStatus}</CardTitle>
                <CardDescription className="mt-1">
                  {t.company}: {selectedCompany?.company_name || '-'}
                </CardDescription>
              </div>
              <Badge 
                variant={isAuthenticated ? 'default' : 'secondary'}
                className="text-sm px-4 py-2"
              >
                {isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    {t.connected}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    {t.disconnected}
                  </div>
                )}
              </Badge>
            </div>
          </CardHeader>
          {!isAuthenticated && (
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {language === 'es' 
                  ? 'Conecta tu cuenta de QuickBooks para acceder a todos los reportes financieros.'
                  : 'Connect your QuickBooks account to access all financial reports.'}
              </p>
              <Button onClick={handleAuth} disabled={loading} size="lg">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t.connectButton}
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Reports Grid */}
        {isAuthenticated && (
          <div>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-foreground">{t.selectReport}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t.selectReportDesc} • {t.dataInColones}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availableReports.map((report) => {
                const Icon = report.icon;
                return (
                  <Card 
                    key={report.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer group"
                    onClick={() => navigate(report.route)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-lg bg-accent ${report.color}`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div>
                            <CardTitle className="text-lg group-hover:text-primary transition-colors">
                              {report.title}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {report.description}
                            </CardDescription>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(report.route);
                        }}
                      >
                        {t.viewReport}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const QuickBooksHub = () => {
  return (
    <LanguageProvider>
      <QuickBooksHubContent />
    </LanguageProvider>
  );
};

export default QuickBooksHub;
