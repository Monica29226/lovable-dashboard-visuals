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
import { Loader2, CheckCircle2, XCircle, Settings, Plug, RefreshCw, Clock, Database } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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
  const [syncing, setSyncing] = useState(false);

  const { data: syncStatus, refetch: refetchSync } = useQuery({
    queryKey: ['sync-status', selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return null;

      const [balanceSheet, profitLoss, budgets] = await Promise.all([
        supabase
          .from('quickbooks_balance_sheet')
          .select('synced_at')
          .eq('company_id', selectedCompanyId)
          .order('synced_at', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('quickbooks_profit_loss')
          .select('synced_at')
          .eq('company_id', selectedCompanyId)
          .order('synced_at', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('quickbooks_budgets')
          .select('synced_at')
          .eq('company_id', selectedCompanyId)
          .order('synced_at', { ascending: false })
          .limit(1)
      ]);

      return {
        balanceSheet: balanceSheet.data?.synced_at || null,
        profitLoss: profitLoss.data?.synced_at || null,
        budgets: budgets.data?.[0]?.synced_at || null,
      };
    },
    enabled: !!selectedCompanyId && isAuthenticated,
  });

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
      viewConfig: 'Ver Configuración',
      syncAll: 'Sincronizar Todo',
      syncBalanceSheet: 'Sincronizar Balance',
      syncProfitLoss: 'Sincronizar Estado de Resultados',
      lastSync: 'Última sincronización',
      never: 'Nunca',
      syncing: 'Sincronizando...'
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
      viewConfig: 'View Configuration',
      syncAll: 'Sync All',
      syncBalanceSheet: 'Sync Balance Sheet',
      syncProfitLoss: 'Sync Income Statement',
      lastSync: 'Last sync',
      never: 'Never',
      syncing: 'Syncing...'
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
        // Open a named popup WITHOUT noopener (keeps window.opener for postMessage).
        // Never navigate the preview iframe (would throw SecurityError).
        const authWindow = window.open(data.authUrl, 'qbAuth', 'width=600,height=750');
        if (!authWindow) {
          toast.error(
            language === 'es'
              ? 'El navegador bloqueó la ventana emergente. Permite las ventanas emergentes e intenta de nuevo.'
              : 'The browser blocked the popup. Please allow popups and try again.',
            { duration: 10000 }
          );
        }
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

  const handleSyncAll = async () => {
    if (!selectedCompanyId || !selectedCompany) {
      toast.error(language === 'es' ? 'No hay empresa seleccionada' : 'No company selected');
      return;
    }

    if (!selectedCompany.is_connected || !selectedCompany.realm_id) {
      toast.error(language === 'es' ? 'La empresa no está conectada a QuickBooks' : 'Company not connected to QuickBooks');
      return;
    }

    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('quickbooks-sync-all', {
        body: { companyId: selectedCompanyId }
      });

      if (error) throw error;

      const result = data.results[0];
      const successCount = [
        result.balanceSheet.success,
        result.profitLoss.success,
        result.budgets.success
      ].filter(Boolean).length;

      toast.success(
        language === 'es' ? 'Sincronización completada' : 'Sync completed',
        { description: `${successCount} ${language === 'es' ? 'de 3 reportes sincronizados' : 'of 3 reports synced'}` }
      );

      refetchSync();
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error(language === 'es' ? 'Error en sincronización' : 'Sync error');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncIndividual = async (type: 'balance' | 'profit-loss') => {
    if (!selectedCompanyId || !selectedCompany) {
      toast.error(language === 'es' ? 'No hay empresa seleccionada' : 'No company selected');
      return;
    }

    setSyncing(true);
    try {
      const functionName = type === 'balance' ? 'quickbooks-sync-balance' : 'quickbooks-sync-profit-loss';
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { companyId: selectedCompanyId }
      });

      if (error) throw error;

      toast.success(
        language === 'es' ? 'Sincronización completada' : 'Sync completed'
      );

      refetchSync();
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error(language === 'es' ? 'Error en sincronización' : 'Sync error');
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return t.never;
    return new Date(dateString).toLocaleString(language === 'es' ? 'es-CR' : 'en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
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
                <div className="space-y-6">
                  <div className="bg-accent/50 rounded-lg p-6 text-center">
                    <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-primary" />
                    <h3 className="text-xl font-semibold mb-2 text-foreground">
                      {t.successTitle}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {t.successDescription}
                    </p>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          Balance Sheet
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {t.lastSync}: {formatDate(syncStatus?.balanceSheet)}
                        </div>
                        <Button
                          onClick={() => handleSyncIndividual('balance')}
                          disabled={syncing}
                          size="sm"
                          variant="outline"
                          className="w-full"
                        >
                          {syncing ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.syncing}</>
                          ) : (
                            <><RefreshCw className="mr-2 h-4 w-4" />{t.syncBalanceSheet}</>
                          )}
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          Income Statement
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {t.lastSync}: {formatDate(syncStatus?.profitLoss)}
                        </div>
                        <Button
                          onClick={() => handleSyncIndividual('profit-loss')}
                          disabled={syncing}
                          size="sm"
                          variant="outline"
                          className="w-full"
                        >
                          {syncing ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.syncing}</>
                          ) : (
                            <><RefreshCw className="mr-2 h-4 w-4" />{t.syncProfitLoss}</>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <Button 
                      onClick={handleSyncAll}
                      disabled={syncing}
                      size="lg"
                      className="w-full sm:w-auto"
                    >
                      {syncing ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{t.syncing}</>
                      ) : (
                        <><RefreshCw className="mr-2 h-5 w-5" />{t.syncAll}</>
                      )}
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