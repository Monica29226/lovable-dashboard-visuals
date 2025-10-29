import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, BarChart3, DollarSign, FileText, TrendingUp, CheckCircle2, XCircle, ArrowRight, CreditCard, Receipt, FolderKanban } from "lucide-react";

const QuickBooksHubContent = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { selectedCompanyId, companies, selectCompany, isLoading } = useCompany();
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
        receivable: {
          title: 'Cuentas por Cobrar',
          desc: 'Facturas pendientes de clientes'
        },
        payable: {
          title: 'Cuentas por Pagar',
          desc: 'Facturas pendientes a proveedores'
        },
        projectPL: {
          title: 'Resultados por Proyecto',
          desc: 'Rentabilidad por proyecto'
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
        receivable: {
          title: 'Accounts Receivable',
          desc: 'Outstanding customer invoices'
        },
        payable: {
          title: 'Accounts Payable',
          desc: 'Outstanding vendor bills'
        },
        projectPL: {
          title: 'Profit & Loss by Project',
          desc: 'Profitability by project'
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
    },
    {
      id: 'receivable',
      title: t.reports.receivable.title,
      description: t.reports.receivable.desc,
      icon: CreditCard,
      route: '/quickbooks-accounts-receivable',
      color: 'text-purple-500'
    },
    {
      id: 'payable',
      title: t.reports.payable.title,
      description: t.reports.payable.desc,
      icon: Receipt,
      route: '/quickbooks-accounts-payable',
      color: 'text-orange-500'
    },
    {
      id: 'projectPL',
      title: t.reports.projectPL.title,
      description: t.reports.projectPL.desc,
      icon: FolderKanban,
      route: '/quickbooks-profit-loss-by-project',
      color: 'text-cyan-500'
    }
  ];

  const handleAuth = async () => {
    const companyId = selectedCompanyId || companies.find(c => c.company_name === 'Horizonte Positivo')?.id;
    
    console.log('handleAuth called, companyId:', companyId);
    
    if (!companyId) {
      console.error('No company ID found');
      toast.error(language === 'es' ? 'No se pudo encontrar la empresa' : 'Company not found');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Calling quickbooks-auth function...');
      
      const { data, error } = await supabase.functions.invoke('quickbooks-auth', {
        body: { companyId }
      });
      
      console.log('Response from quickbooks-auth:', { data, error });
      
      if (error) throw error;
      
      if (data?.authUrl) {
        console.log('Redirecting to:', data.authUrl);
        window.location.href = data.authUrl;
      } else {
        console.error('No authUrl in response');
        toast.error(language === 'es' ? 'No se recibió URL de autenticación' : 'No auth URL received');
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(language === 'es' ? 'Error al autenticar con QuickBooks' : 'Error authenticating with QuickBooks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading || companies.length === 0) return;

    // Seleccionar "Horizonte Positivo" si no hay empresa seleccionada
    const horizontePositivo = companies.find(c => c.company_name === 'Horizonte Positivo');
    if (horizontePositivo && !selectedCompanyId) {
      selectCompany(horizontePositivo.id);
    }
  }, [isLoading, companies, selectedCompanyId, selectCompany]);

  useEffect(() => {
    if (!selectedCompanyId) return;

    const checkAuth = async () => {
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
    
    checkAuth();
  }, [selectedCompanyId]);

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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

export default QuickBooksHubContent;
