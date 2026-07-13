import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, RefreshCw, Eye, EyeOff, KeyRound, Plug } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import QuickBooksConnectionStatus from "@/components/QuickBooksConnectionStatus";

const QuickBooksSettings = () => {
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
      // Never break the screen: show a friendly fallback state.
      setValidation({ error: 'No se pudo validar el estado actual de las credenciales' });
    } finally {
      setIsValidating(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    checkValidation();
  }, [checkValidation]);

  // Extract a human-readable error message from an edge function response.
  const extractErrorMessage = async (error: any, fallback: string): Promise<string> => {
    try {
      const ctx = error?.context;
      if (ctx && typeof ctx.json === 'function') {
        const body = await ctx.json();
        if (body?.error) {
          return typeof body.error === 'string' ? body.error : fallback;
        }
      }
    } catch {
      // ignore parsing errors
    }
    if (error?.message && !error.message.includes('non-2xx')) {
      return error.message;
    }
    return fallback;
  };

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
      const { data, error } = await supabase.functions.invoke('quickbooks-update-credentials', {
        body: {
          companyId: selectedCompanyId,
          clientId: clientId.trim(),
          clientSecret: clientSecret.trim(),
        }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Credenciales guardadas. Conexión anterior reseteada.");
      setClientId("");
      setClientSecret("");
      await loadCompanies();
      await checkValidation();
    } catch (error: any) {
      console.error('Error saving credentials:', error);
      const message = await extractErrorMessage(error, 'No se pudieron guardar las credenciales');
      toast.error(message);
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
      // Same connection logic as QuickBooksOnline: use quickbooks-auth + popup + localStorage signal
      const { data, error } = await supabase.functions.invoke('quickbooks-auth', {
        body: { companyId: selectedCompanyId }
      });
      if (error) throw error;
      if (data?.authUrl) {
        // Open a named popup WITHOUT noopener so window.opener stays available (same as QuickBooksOnline)
        const authWindow = window.open(data.authUrl, 'qbAuth', 'width=600,height=750');
        if (!authWindow) {
          toast.error('El navegador bloqueó la ventana emergente. Permite las ventanas emergentes e intenta de nuevo.', { duration: 10000 });
        } else {
          toast.info('Se abrió una ventana para conectar con QuickBooks. Completa la autorización y regresa aquí.', { duration: 10000 });
        }
      } else {
        throw new Error('No se recibió URL de autenticación');
      }
    } catch (error: any) {
      console.error('Error connecting to QuickBooks:', error);
      toast.error(`Error al conectar: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  // Listen for auth result from popup via localStorage (same strategy as QuickBooksOnline)
  useEffect(() => {
    const processAuthResult = () => {
      const raw = localStorage.getItem('quickbooks_auth_result');
      if (!raw) return;
      let result: any;
      try {
        result = JSON.parse(raw);
      } catch {
        localStorage.removeItem('quickbooks_auth_result');
        return;
      }
      if (result?.success === true) {
        toast.success(`¡Conexión exitosa con ${result.companyName || 'QuickBooks'}!`);
        loadCompanies();
        checkValidation();
      } else if (result?.success === false) {
        toast.error(`No se pudo conectar con QuickBooks: ${result.error || 'Error desconocido'}`);
      }
      localStorage.removeItem('quickbooks_auth_result');
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'quickbooks_auth_result' && event.newValue) {
        processAuthResult();
      }
    };

    processAuthResult();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', processAuthResult);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', processAuthResult);
    };
  }, [loadCompanies, checkValidation]);

  const handleSync = async () => {
    if (!selectedCompanyId) {
      toast.error("Selecciona una empresa primero");
      return;
    }
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('quickbooks-sync-all', {
        body: { companyId: selectedCompanyId }
      });
      if (error) throw error;
      toast.success(data?.message || "Sincronización completa");
    } catch (error: any) {
      console.error('Error syncing with QuickBooks:', error);
      toast.error(`Error al sincronizar: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
          <KeyRound className="h-6 w-6" />
          Credenciales QuickBooks
        </h1>
        <p className="text-muted-foreground">
          Empresa activa: <span className="font-medium text-foreground">{selectedCompany?.company_name || "—"}</span>
        </p>
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
  );
};

export default QuickBooksSettings;
