import { useEffect, useState } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const QuickBooksDebugRedirect = () => {
  const { selectedCompanyId } = useCompany();
  const { language } = useLanguage();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const fetchDebugInfo = async () => {
      if (!selectedCompanyId) return;

      const { data: company } = await supabase
        .from('quickbooks_companies')
        .select('company_name, realm_id, is_connected')
        .eq('id', selectedCompanyId)
        .single();

      // Single canonical redirect URI registered in Intuit
      const currentOrigin = window.location.origin;
      const redirectUris = [
        'https://aclcostarica.com/auth/quickbooks/callback',
      ];

      setDebugInfo({
        company,
        redirectUris,
        currentOrigin,
        environment: 'Production',
      });
    };

    fetchDebugInfo();
  }, [selectedCompanyId]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(language === 'es' ? 'Copiado al portapapeles' : 'Copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  };

  if (!debugInfo) {
    return <div className="p-8">Cargando información de debug...</div>;
  }

  const texts = {
    es: {
      title: 'Diagnóstico de Redirect URIs',
      subtitle: 'Información para configurar en el Portal de QuickBooks',
      environment: 'Entorno',
      clientId: 'Client ID',
      redirectUris: 'Redirect URIs Requeridos',
      instructions: 'Instrucciones',
      step1: '1. Ve al Portal de Desarrolladores de QuickBooks',
      step2: '2. Selecciona tu aplicación',
      step3: '3. Ve a la sección "Keys & OAuth"',
      step4: '4. En "Redirect URIs", agrega ÚNICAMENTE este URI exacto',
      step5: '5. Guarda los cambios',
      important: 'Importante',
      note: 'Los Redirect URIs deben coincidir EXACTAMENTE (incluyendo mayúsculas/minúsculas y /)',
      productionWarning: 'Apps en Production requieren aprobación de Intuit antes de funcionar',
      copy: 'Copiar',
      copied: 'Copiado',
    },
    en: {
      title: 'Redirect URIs Diagnostic',
      subtitle: 'Information to configure in QuickBooks Portal',
      environment: 'Environment',
      clientId: 'Client ID',
      redirectUris: 'Required Redirect URIs',
      instructions: 'Instructions',
      step1: '1. Go to QuickBooks Developer Portal',
      step2: '2. Select your application',
      step3: '3. Go to "Keys & OAuth" section',
      step4: '4. In "Redirect URIs", add ONLY this exact URI',
      step5: '5. Save changes',
      important: 'Important',
      note: 'Redirect URIs must match EXACTLY (including case and /)',
      productionWarning: 'Production apps require Intuit approval before working',
      copy: 'Copy',
      copied: 'Copied',
    },
  };

  const t = texts[language];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Environment Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{t.environment}:</span>
              <Badge variant="default">
                {debugInfo.environment}
              </Badge>
            </div>
          </div>

          {/* Client ID */}
          <div className="space-y-2">
            <span className="font-semibold">{t.clientId}:</span>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                Configurado en el backend
              </code>
            </div>
          </div>

          {/* Redirect URIs */}
          <div className="space-y-3">
            <span className="font-semibold">{t.redirectUris}:</span>
            {debugInfo.redirectUris.map((uri: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-xs font-mono break-all">
                  {uri}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(uri, `uri-${index}`)}
                >
                  {copied === `uri-${index}` ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="space-y-3 pt-4 border-t">
            <h3 className="font-semibold text-lg">{t.instructions}</h3>
            <ol className="space-y-2 text-sm">
              <li>{t.step1}</li>
              <li>{t.step2}</li>
              <li>{t.step3}</li>
              <li>{t.step4}</li>
              <li>{t.step5}</li>
            </ol>
          </div>

          {/* Important Note */}
          <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-sm">{t.important}</p>
              <p className="text-sm text-muted-foreground">{t.note}</p>
            </div>
          </div>

          {/* Portal Link */}
          <Button
            className="w-full"
            onClick={() => window.open('https://developer.intuit.com/app/developer/qbo/docs/get-started', '_blank')}
          >
            {language === 'es' ? 'Abrir Portal de QuickBooks' : 'Open QuickBooks Portal'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickBooksDebugRedirect;
