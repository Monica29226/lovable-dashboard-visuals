import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import QuickBooksConnectionStatus from "@/components/QuickBooksConnectionStatus";

const QuickBooksSettings = () => {
  const navigate = useNavigate();
  const { selectedCompanyId } = useCompany();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleConnect = async () => {
    if (!selectedCompanyId) {
      toast.error("Por favor selecciona una empresa primero");
      return;
    }

    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('qb-auth', {
        body: { companyId: selectedCompanyId }
      });

      if (error) throw error;

      if (data?.authUrl) {
        // Redirect to QuickBooks OAuth
        window.location.href = data.authUrl;
      } else {
        throw new Error('No se recibió URL de autenticación');
      }
    } catch (error: any) {
      console.error('Error connecting to QuickBooks:', error);
      toast.error(`Error al conectar: ${error.message}`);
      setIsConnecting(false);
    }
  };

  const handleSync = async () => {
    if (!selectedCompanyId) {
      toast.error("Por favor selecciona una empresa primero");
      return;
    }

    setIsSyncing(true);
    try {
      // Get realm_id from oauth_tokens
      const { data: tokenData, error: tokenError } = await supabase
        .from('oauth_tokens')
        .select('realm_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (tokenError || !tokenData) {
        toast.error("No hay conexión activa con QuickBooks");
        setIsSyncing(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('qb-sync', {
        body: { 
          realm_id: tokenData.realm_id,
          sync_type: 'all'
        }
      });

      if (error) throw error;

      toast.success(`Sincronización completa: ${data.records_synced} registros`);
    } catch (error: any) {
      console.error('Error syncing with QuickBooks:', error);
      toast.error(`Error al sincronizar: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6 bg-background">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Configuración de QuickBooks
              </h1>
              <p className="text-muted-foreground">
                Gestiona tu conexión con QuickBooks y sincroniza datos financieros
              </p>
            </div>

            <QuickBooksConnectionStatus />

            <Card>
              <CardHeader>
                <CardTitle>Conexión con QuickBooks</CardTitle>
                <CardDescription>
                  Conecta tu cuenta de QuickBooks para sincronizar datos financieros
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting || !selectedCompanyId}
                  className="w-full sm:w-auto"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    "Conectar con QuickBooks"
                  )}
                </Button>

                {!selectedCompanyId && (
                  <p className="text-sm text-muted-foreground">
                    Selecciona una empresa en la barra lateral para continuar
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sincronización de Datos</CardTitle>
                <CardDescription>
                  Sincroniza manualmente los datos financieros desde QuickBooks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleSync}
                  disabled={isSyncing || !selectedCompanyId}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sincronizar Ahora
                    </>
                  )}
                </Button>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>La sincronización incluye:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Balance Sheet (Estado de Posición Financiera)</li>
                    <li>Profit & Loss (Estado de Resultados)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default QuickBooksSettings;
