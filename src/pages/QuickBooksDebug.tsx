import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { CheckCircle2, XCircle, AlertTriangle, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const QuickBooksDebug = () => {
  const { selectedCompanyId, companies } = useCompany();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  useEffect(() => {
    if (!selectedCompanyId) return;

    const loadDebugInfo = async () => {
      try {
        // Get company info
        const { data: company } = await supabase
          .from('quickbooks_companies')
          .select('*')
          .eq('id', selectedCompanyId)
          .single();

        // Get validation
        const { data: validation } = await supabase.functions.invoke('quickbooks-validate-credentials', {
          body: { companyId: selectedCompanyId }
        });

        const currentOrigin = window.location.origin;
        const callbackPath = '/auth/quickbooks/callback';
        
        setDebugInfo({
          company,
          validation,
          currentOrigin,
          currentRedirectUri: `${currentOrigin}${callbackPath}`,
          allRequiredUris: [
            'https://12f71efd-1f70-462c-bb07-db795e0bb262.lovableproject.com/auth/quickbooks/callback',
            'https://preview--lovable-dashboard-visuals.lovable.app/auth/quickbooks/callback',
            `${currentOrigin}${callbackPath}`
          ].filter((uri, index, self) => self.indexOf(uri) === index) // Remove duplicates
        });
      } catch (error) {
        console.error('Error loading debug info:', error);
      }
    };

    loadDebugInfo();
  }, [selectedCompanyId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!debugInfo) {
    return <div className="p-8">Cargando información de diagnóstico...</div>;
  }


  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Diagnóstico de QuickBooks</h1>
          <p className="text-muted-foreground">
            Información de configuración para {selectedCompany?.company_name}
          </p>
        </div>

        {/* Credenciales */}
        <Card>
          <CardHeader>
            <CardTitle>Credenciales de QuickBooks</CardTitle>
            <CardDescription>Verifica que estas credenciales coincidan con tu app en QuickBooks Developer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Client ID:</span>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-3 py-1 rounded text-sm">
                    {debugInfo.company?.client_id}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(debugInfo.company?.client_id)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Client ID Length:</span>
                <Badge variant={debugInfo.validation?.client_id_valid ? "default" : "destructive"}>
                  {debugInfo.validation?.client_secret_length} caracteres
                  {debugInfo.validation?.client_id_valid ? <CheckCircle2 className="ml-2 h-4 w-4" /> : <XCircle className="ml-2 h-4 w-4" />}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Client Secret Length:</span>
                <Badge variant={debugInfo.validation?.client_secret_valid ? "default" : "destructive"}>
                  {debugInfo.validation?.client_secret_length} caracteres
                  {debugInfo.validation?.client_secret_valid ? <CheckCircle2 className="ml-2 h-4 w-4" /> : <XCircle className="ml-2 h-4 w-4" />}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Ambiente Detectado:</span>
                <Badge variant="outline">
                  {debugInfo.company?.client_id?.length >= 40 ? 'Production' : 'Sandbox'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Redirect URIs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Redirect URIs Requeridos
            </CardTitle>
            <CardDescription>
              Estos URIs DEBEN estar registrados EXACTAMENTE como aparecen aquí en tu app de QuickBooks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold mb-2 text-red-700 dark:text-red-400">
                🚨 ERROR IDENTIFICADO: "undefined didn't connect"
              </p>
              <p className="text-sm text-red-600 dark:text-red-300">
                Este error ocurre porque QuickBooks está rechazando la conexión. La causa más común es que los Redirect URIs no están registrados en tu aplicación de QuickBooks Developer Portal, o tu app está en modo Development en lugar de Production.
              </p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                URI Actual que se está usando:
              </p>
              <div className="flex items-center justify-between mt-2">
                <code className="block bg-background px-3 py-2 rounded text-xs break-all flex-1 mr-2">
                  {debugInfo.currentRedirectUri}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(debugInfo.currentRedirectUri)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copiar
                </Button>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-sm font-semibold mb-3 text-yellow-700 dark:text-yellow-500">
                ⚠️ TODOS estos URIs deben estar registrados en QuickBooks:
              </p>
              <div className="space-y-3">
                {debugInfo.allRequiredUris.map((uri: string, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        URI #{index + 1}:
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(uri)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </Button>
                    </div>
                    <code className="block bg-background px-3 py-2 rounded text-xs break-all">
                      {uri}
                    </code>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 text-sm mt-4">
              <p className="font-semibold text-base">📋 Pasos para SOLUCIONAR el error:</p>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
                <li className="font-medium">
                  Ve a{' '}
                  <a 
                    href="https://developer.intuit.com/app/developer/myapps" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-primary hover:underline font-semibold"
                  >
                    developer.intuit.com
                  </a>
                </li>
                <li>Inicia sesión y selecciona tu app <strong>"Horizonte Positivo"</strong></li>
                <li>Ve a la pestaña <strong>"Keys & credentials"</strong></li>
                <li className="font-medium text-yellow-700 dark:text-yellow-500">
                  ⚠️ CRÍTICO: Verifica que tu app esté en modo <strong>"Production"</strong>. Si está en "Development", cámbiala a "Production".
                </li>
                <li>Busca la sección <strong>"Redirect URIs"</strong></li>
                <li className="font-medium">
                  Agrega TODOS los URIs listados arriba (copia y pega exactamente)
                </li>
                <li>Haz clic en <strong>"Save"</strong> para guardar los cambios</li>
                <li className="font-medium text-green-700 dark:text-green-500">
                  Espera 1-2 minutos para que los cambios se propaguen
                </li>
                <li>Vuelve al Hub e intenta conectar nuevamente</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Estado de Conexión */}
        <Card>
          <CardHeader>
            <CardTitle>Estado Actual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Conectado:</span>
              <Badge variant={debugInfo.company?.is_connected ? "default" : "secondary"}>
                {debugInfo.company?.is_connected ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Sí
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    No
                  </>
                )}
              </Badge>
            </div>
            {debugInfo.company?.realm_id && (
              <div className="flex items-center justify-between">
                <span className="font-semibold">Realm ID:</span>
                <code className="bg-muted px-3 py-1 rounded text-sm">
                  {debugInfo.company.realm_id}
                </code>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recomendaciones */}
        {debugInfo.validation?.recommendations?.length > 0 && (
          <Card className="border-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-500">
                <AlertTriangle className="h-5 w-5" />
                Advertencias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {debugInfo.validation.recommendations.map((rec: string, idx: number) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4">
          <Button onClick={() => window.location.href = '/quickbooks-hub'}>
            Volver al Hub
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refrescar Diagnóstico
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuickBooksDebug;
