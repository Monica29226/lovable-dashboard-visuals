import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, BarChart3, DollarSign, CheckCircle2, XCircle, ArrowRight, CreditCard, Receipt, FolderKanban, Plug } from "lucide-react";
import dashboardHero from "@/assets/dashboard-hero.png";
import horizonteLogo from "@/assets/horizonte-logo.png";

const QuickBooksHubContent = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { selectedCompanyId, companies, selectCompany, isLoading, loadCompanies } = useCompany();
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("connection");

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  const texts = {
    es: {
      title: 'Centro de QuickBooks',
      subtitle: 'Conecta y visualiza tus reportes financieros',
      connectionTab: 'Conexión',
      reportsTab: 'Reportes',
      budgetTab: 'Presupuesto 2026',
      connectionStatus: 'Estado de Conexión',
      connected: 'Conectado',
      disconnected: 'Desconectado',
      connectButton: 'Conectar con QuickBooks',
      selectReport: 'Selecciona un Reporte',
      selectReportDesc: 'Elige el reporte que deseas visualizar',
      connectionDescription: 'Conecta tu cuenta de QuickBooks para acceder a todos los reportes financieros en tiempo real.',
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
      dataInColones: 'Datos en Colones (CRC)',
      budgetTitle: 'Presupuesto 2026',
      budgetDescription: 'Gestiona y edita el presupuesto anual de la empresa',
      openBudget: 'Abrir Presupuesto 2026'
    },
    en: {
      title: 'QuickBooks Hub',
      subtitle: 'Connect and view your financial reports',
      connectionTab: 'Connection',
      reportsTab: 'Reports',
      budgetTab: 'Budget 2026',
      connectionStatus: 'Connection Status',
      connected: 'Connected',
      disconnected: 'Disconnected',
      connectButton: 'Connect to QuickBooks',
      selectReport: 'Select a Report',
      selectReportDesc: 'Choose the report you want to view',
      connectionDescription: 'Connect your QuickBooks account to access all financial reports in real-time.',
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
      dataInColones: 'Data in Colones (CRC)',
      budgetTitle: 'Budget 2026',
      budgetDescription: 'Manage and edit the company annual budget',
      openBudget: 'Open Budget 2026'
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
      console.log('Validating credentials...');
      
      // First validate the credentials
      const { data: validationData, error: validationError } = await supabase.functions.invoke('quickbooks-validate-credentials', {
        body: { companyId }
      });
      
      console.log('Validation result:', validationData);
      
      if (validationData?.recommendations?.length > 0) {
        toast.error(
          language === 'es' ? 'Problema con las credenciales' : 'Credentials Issue',
          {
            description: validationData.recommendations.join(' '),
            duration: 10000
          }
        );
        // Continue anyway but warn the user
      }
      
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

    const horizontePositivo = companies.find(c => c.company_name === 'Horizonte Positivo');
    if (horizontePositivo && !selectedCompanyId) {
      selectCompany(horizontePositivo.id);
    }
  }, [isLoading, companies.length, selectedCompanyId]);

  useEffect(() => {
    if (!selectedCompanyId) return;

    const checkAuth = async () => {
      try {
        const { data } = await supabase.functions.invoke('quickbooks-check-auth', {
          body: { companyId: selectedCompanyId }
        });
        const authenticated = data?.authenticated || false;
        setIsAuthenticated(authenticated);
        if (authenticated) {
          setActiveTab("reports");
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, [selectedCompanyId]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto">
        {/* Hero Section */}
        <section 
          className="relative min-h-[45vh] flex items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${dashboardHero})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628]/95 via-[#1a2847]/95 to-[#2d4875]/90"></div>
          
          <div className="absolute top-6 right-6 z-20">
            <LanguageToggle />
          </div>

          <div className="relative z-10 text-center px-4 py-16 space-y-8 max-w-4xl mx-auto">
            <div className="space-y-3">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight">
                <span className="text-white block mb-2">CENTRO DE</span>
                <span className="text-[#7bb4e0] block">QUICKBOOKS</span>
              </h1>
              <p className="text-white/90 text-lg md:text-xl font-medium tracking-wide mt-6">
                {t.subtitle}
              </p>
            </div>

            <div className="flex justify-center pt-4">
              <div className="border-2 border-white/30 rounded-2xl p-6 bg-white/5 backdrop-blur-sm hover:border-white/50 transition-all duration-300">
                <img 
                  src={horizonteLogo} 
                  alt="Horizonte Positivo" 
                  className="h-20 md:h-24 w-auto object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="p-4 md:p-6 space-y-6">

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 h-12">
            <TabsTrigger value="connection" className="text-base">
              <Plug className="h-4 w-4 mr-2" />
              {t.connectionTab}
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-base" disabled={!isAuthenticated}>
              <BarChart3 className="h-4 w-4 mr-2" />
              {t.reportsTab}
            </TabsTrigger>
            <TabsTrigger value="budget" className="text-base">
              <DollarSign className="h-4 w-4 mr-2" />
              {t.budgetTab}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connection" className="mt-6">
            <Card className="border-2">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl">{t.connectionStatus}</CardTitle>
                    <CardDescription className="text-base">
                      {t.company}: <span className="font-medium text-foreground">{selectedCompany?.company_name || '-'}</span>
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={isAuthenticated ? 'default' : 'secondary'}
                    className="text-base px-6 py-2 h-10"
                  >
                    {isAuthenticated ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        {t.connected}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5" />
                        {t.disconnected}
                      </div>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {isAuthenticated ? (
                  <div className="bg-accent/50 rounded-lg p-6 text-center">
                    <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-primary" />
                    <h3 className="text-xl font-semibold mb-2 text-foreground">
                      {language === 'es' ? '¡Conexión Exitosa!' : 'Successfully Connected!'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {language === 'es' 
                        ? 'Tu cuenta de QuickBooks está conectada. Ahora puedes acceder a todos los reportes financieros.'
                        : 'Your QuickBooks account is connected. You can now access all financial reports.'}
                    </p>
                    <Button 
                      onClick={() => setActiveTab("reports")}
                      size="lg"
                      className="mt-2"
                    >
                      {language === 'es' ? 'Ver Reportes' : 'View Reports'}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-accent/50 rounded-lg p-6">
                      <p className="text-base text-foreground leading-relaxed">
                        {t.connectionDescription}
                      </p>
                    </div>
                    <div className="flex justify-center pt-2">
                      <Button 
                        onClick={handleAuth} 
                        disabled={loading} 
                        size="lg"
                        className="px-8 h-12 text-base"
                      >
                        {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        <Plug className="mr-2 h-5 w-5" />
                        {t.connectButton}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-foreground mb-2">{t.selectReport}</h2>
                <p className="text-muted-foreground">{t.selectReportDesc}</p>
                <Badge variant="outline" className="mt-3 text-sm">
                  {t.dataInColones}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableReports.map((report) => {
                  const Icon = report.icon;
                  return (
                    <Card 
                      key={report.id} 
                      className="hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group border-2"
                      onClick={() => navigate(report.route)}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 ${report.color}`}>
                            <Icon className="h-8 w-8" />
                          </div>
                          <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {report.title}
                        </CardTitle>
                        <CardDescription className="text-base mt-2">
                          {report.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          variant="outline" 
                          className="w-full h-11 text-base group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(report.route);
                          }}
                        >
                          {t.viewReport}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="budget" className="mt-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">{t.budgetTitle}</CardTitle>
                <CardDescription className="text-base">
                  {t.budgetDescription}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate('/budget-2026')}
                  size="lg"
                  className="w-full h-12 text-base"
                >
                  {t.openBudget}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
};

export default QuickBooksHubContent;