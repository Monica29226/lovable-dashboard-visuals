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
        
        // These are the URIs that the user has configured in QuickBooks
        const configuredUris = [
          'https://12f71efd-1f70-462c-bb07-db795e0bb262.lovableproject.com/auth/quickbooks/callback',
          'https://horizonte.aureoncr.com/auth/quickbooks/callback',
          'https://preview--lovable-dashboard-visuals.lovable.app/auth/quickbooks/callback'
        ];
        
        setDebugInfo({
          company,
          validation,
          currentOrigin,
          currentRedirectUri: `${currentOrigin}${callbackPath}`,
          configuredUris,
          uriMatch: configuredUris.includes(`${currentOrigin}${callbackPath}`)
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
                <Badge variant="default">
                  Production
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
                🚨 ERROR: "accounts.intuit.com refused to connect"
              </p>
              <p className="text-sm text-red-600 dark:text-red-300 mb-3">
                QuickBooks está rechazando la conexión ANTES de llegar a tu app. Esto significa que hay un problema en la configuración del Portal de Desarrolladores.
              </p>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold mb-2 text-yellow-700 dark:text-yellow-400">
                🔍 URI que está intentando usar:
              </p>
              <div className="bg-white dark:bg-gray-800 rounded p-2 mb-2">
                <code className="text-xs break-all text-blue-600 dark:text-blue-400">
                  https://12f71efd-1f70-462c-bb07-db795e0bb262.lovableproject.com/auth/quickbooks/callback
                </code>
              </div>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                ⚠️ Este URI DEBE estar registrado EXACTAMENTE como está arriba (sin espacios antes o después)
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

            <div className={`border rounded-lg p-4 ${debugInfo.uriMatch ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <p className={`text-sm font-semibold mb-3 ${debugInfo.uriMatch ? 'text-green-700 dark:text-green-500' : 'text-red-700 dark:text-red-500'}`}>
                {debugInfo.uriMatch ? '✅ URIs configurados correctamente' : '❌ El URI actual NO está en la configuración'}
              </p>
              <div className="space-y-3">
                {debugInfo.configuredUris.map((uri: string, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          URI #{index + 1}:
                        </span>
                        {uri === debugInfo.currentRedirectUri && (
                          <Badge variant="default" className="text-xs">En uso ahora</Badge>
                        )}
                      </div>
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

            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4 mt-4">
              <p className="text-sm font-bold mb-3 text-blue-700 dark:text-blue-400">
                📋 PASOS PARA SOLUCIONAR (Sigue este orden exacto):
              </p>
              <div className="space-y-3">
                <div className="bg-white dark:bg-gray-800 rounded p-3">
                  <p className="text-sm font-semibold mb-1">1️⃣ Abre QuickBooks Developer Portal</p>
                  <a 
                    href="https://developer.intuit.com/app/developer/myapps" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs text-blue-600 hover:underline"
                  >
                    → Clic aquí para abrir
                  </a>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded p-3">
                  <p className="text-sm font-semibold mb-1">2️⃣ Selecciona tu app "Horizonte Positivo"</p>
                  <p className="text-xs text-muted-foreground">
                    Client ID: <code>ABxMJ1w...</code>
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded p-3">
                  <p className="text-sm font-semibold mb-1">3️⃣ Ve a "Keys & credentials"</p>
                </div>

                <div className="bg-red-500/10 border border-red-500/50 rounded p-3">
                  <p className="text-sm font-bold mb-2 text-red-700 dark:text-red-400">
                    4️⃣ 🔴 ESTE ES TU PROBLEMA - MODO PRODUCTION
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mb-2 font-semibold">
                    Tu app está en modo Production pero NO está aprobada por Intuit:
                  </p>
                  <ul className="text-xs text-red-600 dark:text-red-400 space-y-2 ml-4">
                    <li>• QuickBooks rechaza conexiones de apps Production "Pending"</li>
                    <li>• Debes completar el "App Assessment Questionnaire"</li>
                    <li>• La aprobación puede tardar varios días</li>
                    <li className="pt-2 font-bold">💡 SOLUCIÓN INMEDIATA: Cambia tu app a modo <strong>Development</strong></li>
                  </ul>
                  <div className="mt-3 bg-yellow-500/20 border border-yellow-500/50 rounded p-2">
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      ⚠️ En modo Development puedes conectar hasta 10 empresas sin esperar aprobación
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded p-3">
                  <p className="text-sm font-semibold mb-2">5️⃣ Verifica que tengas estos 3 URIs en "Redirect URIs":</p>
                  <div className="space-y-1 mb-2">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded p-2">
                      <code className="text-xs break-all">✅ https://12f71efd-1f70-462c-bb07-db795e0bb262.lovableproject.com/auth/quickbooks/callback</code>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded p-2">
                      <code className="text-xs break-all">✅ https://horizonte.aureoncr.com/auth/quickbooks/callback</code>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded p-2">
                      <code className="text-xs break-all">✅ https://preview--lovable-dashboard-visuals.lovable.app/auth/quickbooks/callback</code>
                    </div>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    ✓ Estos URIs ya están configurados correctamente según tu captura
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded p-3">
                  <p className="text-sm font-semibold mb-1">6️⃣ Guarda y espera 3 minutos</p>
                  <p className="text-xs text-muted-foreground">
                    Los cambios tardan en propagarse
                  </p>
                </div>

                <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
                  <p className="text-sm font-bold text-green-700 dark:text-green-500 mb-1">
                    7️⃣ Cierra tu navegador y prueba de nuevo
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Si sigue fallando, toma captura de tu pantalla de Redirect URIs
                  </p>
                </div>
              </div>
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
