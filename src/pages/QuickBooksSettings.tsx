import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { toast } from "sonner";
import { Loader2, RefreshCw, Eye, EyeOff, ArrowLeft, KeyRound, Plug } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import QuickBooksConnectionStatus from "@/components/QuickBooksConnectionStatus";

const QuickBooksSettings = () => {
  const navigate = useNavigate();
  const { selectedCompanyId, companies, loadCompanies } = useCompany();
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [validation, setValidation] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  const checkValidation = useCallback(async () => {
    if (!selectedCompanyId) return;
    setIsValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke('quickbooks-validate-credentials', {
        body: { companyId: selectedCompanyId }
      });
      if (error) throw error;
      setValidation(data);
    } catch (error: any) {
      setValidation({ error: error.message });
    } finally {
      setIsValidating(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    checkValidation();
  }, [checkValidation]);

  const handleSave = async () => {
    if (!selectedCompanyId) {
      toast.error("Selecciona una empresa primero");
      return;
    }
    if (!clientId.trim() || !clientSecret.trim()) {
      toast.error("Completa Client ID y Client Secret");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.functions.invoke('quickbooks-update-credentials', {
        body: {
          companyId: selectedCompanyId,
          clientId: clientId.trim(),
          clientSecret: clientSecret.trim(),
        }
      });
      if (error) throw error;

      toast.success("Credenciales guardadas. Conexión anterior reseteada.");
      setClientId("");
      setClientSecret("");
      await loadCompanies();
      await checkValidation();
    } catch (error: any) {
      console.error('Error saving credentials:', error);
      toast.error(`Error al guardar: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnect = async () => {
    if (!selectedCompanyId) {
      toast.error("Selecciona una empresa primero");
      return;
    }
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('qb-auth', {
        body: { companyId: selectedCompanyId }
      });
      if (error) throw error;
      if (data?.authUrl) {
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
      toast.error("Selecciona una empresa primero");
      return;
    }
    setIsSyncing(true);
    try {
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
        body: { realm_id: tokenData.realm_id, sync_type: 'all' }
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
                  <KeyRound className="h-7 w-7" />
                  Credenciales QuickBooks
                </h1>
                <p className="text-muted-foreground">
                  Empresa activa: <span className="font-medium text-foreground">{selectedCompany?.company_name || "—"}</span>
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate('/quickbooks')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a QuickBooks
              </Button>
            </div>

            <QuickBooksConnectionStatus />

            <Card>
              <CardHeader>
                <CardTitle>Credenciales de la app QuickBooks</CardTitle>
                <CardDescription>
                  Configura el Client ID y Client Secret para esta empresa. Al guardar se
                  reseteará la conexión anterior y deberás reconectar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="Client ID de QuickBooks"
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <div className="flex gap-2">
                    <Input
                      id="clientSecret"
                      type={showSecret ? "text" : "password"}
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      placeholder="Client Secret de QuickBooks"
                      autoComplete="off"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSecret((s) => !s)}
                    >
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button onClick={handleSave} disabled={isSaving || !selectedCompanyId}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar credenciales"
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
                <CardTitle>Estado de las credenciales</CardTitle>
                <CardDescription>Validación del estado actual configurado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isValidating ? (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Validando...
                  </p>
                ) : validation?.error ? (
                  <p className="text-sm text-destructive">{validation.error}</p>
                ) : validation ? (
                  <div className="text-sm space-y-1">
                    <p>Client ID configurado: <strong>{validation.client_id_configured ? "Sí" : "No"}</strong></p>
                    <p>Client Secret válido: <strong>{validation.client_secret_valid ? "Sí" : "No"}</strong></p>
                    {Array.isArray(validation.recommendations) && validation.recommendations.length > 0 && (
                      <ul className="list-disc list-inside text-muted-foreground mt-2">
                        {validation.recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}
                      </ul>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin información de validación</p>
                )}
                <Button variant="ghost" size="sm" onClick={checkValidation} disabled={isValidating}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Revalidar
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conexión y sincronización</CardTitle>
                <CardDescription>Conecta con QuickBooks o sincroniza los datos</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button onClick={handleConnect} disabled={isConnecting || !selectedCompanyId}>
                  {isConnecting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Conectando...</>
                  ) : (
                    <><Plug className="mr-2 h-4 w-4" />Conectar con QuickBooks</>
                  )}
                </Button>
                <Button variant="outline" onClick={handleSync} disabled={isSyncing || !selectedCompanyId}>
                  {isSyncing ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sincronizando...</>
                  ) : (
                    <><RefreshCw className="mr-2 h-4 w-4" />Sincronizar Ahora</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default QuickBooksSettings;
