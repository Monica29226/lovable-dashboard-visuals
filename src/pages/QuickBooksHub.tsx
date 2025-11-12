import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, Settings, Plug } from "lucide-react";
import dashboardHero from "@/assets/dashboard-hero.png";
import horizonteLogo from "@/assets/horizonte-logo.png";
import horizonteLogoHorizontal from "@/assets/horizonte-logo-horizontal.png";

const QuickBooksHubContent = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { selectedCompanyId, companies, selectCompany, isLoading, loadCompanies } = useCompany();
  const { user } = useAuth();
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
      connectionDescription: 'Conecta tu cuenta de QuickBooks para acceder a todos los reportes financieros en tiempo real.',
      company: 'Empresa',
      successTitle: '¡Conexión Exitosa!',
      successDescription: 'Tu cuenta de QuickBooks está conectada. Ahora puedes acceder a todos los reportes financieros desde el menú lateral.',
      diagnostics: 'Diagnóstico',
      viewConfig: 'Ver Configuración'
    },
    en: {
      title: 'QuickBooks Hub',
      subtitle: 'Connect and view your financial reports',
      connectionStatus: 'Connection Status',
      connected: 'Connected',
      disconnected: 'Disconnected',
      connectButton: 'Connect to QuickBooks',
      connectionDescription: 'Connect your QuickBooks account to access all financial reports in real-time.',
      company: 'Company',
      successTitle: 'Successfully Connected!',
      successDescription: 'Your QuickBooks account is connected. You can now access all financial reports from the sidebar menu.',
      diagnostics: 'Diagnostics',
      viewConfig: 'View Configuration'
    }
  };

  const t = texts[language];

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
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, [selectedCompanyId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
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
                    {t.successTitle}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {t.successDescription}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-4">
                    <Button 
                      onClick={() => navigate('/quickbooks-debug')}
                      variant="outline"
                      size="lg"
                    >
                      <Settings className="mr-2 h-5 w-5" />
                      {t.viewConfig}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-accent/50 rounded-lg p-6">
                    <p className="text-base text-foreground leading-relaxed">
                      {t.connectionDescription}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
                    <Button 
                      onClick={handleAuth} 
                      disabled={loading} 
                      size="lg"
                      className="px-8 h-12 text-base w-full sm:w-auto"
                    >
                      {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                      <Plug className="mr-2 h-5 w-5" />
                      {t.connectButton}
                    </Button>
                    <Button 
                      onClick={() => navigate('/quickbooks-debug')}
                      variant="outline"
                      size="lg"
                      className="px-6 h-12 text-base w-full sm:w-auto"
                    >
                      <Settings className="mr-2 h-5 w-5" />
                      {t.diagnostics}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
      </div>
    </div>
  );
};

export default QuickBooksHubContent;