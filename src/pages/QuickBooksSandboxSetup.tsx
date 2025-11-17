import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/contexts/CompanyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";

const QuickBooksSandboxSetup = () => {
  const { selectedCompanyId, companies } = useCompany();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  const texts = {
    es: {
      title: 'Configurar Sandbox de QuickBooks',
      subtitle: 'Ingresa las credenciales de desarrollo (Sandbox) para comenzar las pruebas',
      company: 'Empresa',
      clientIdLabel: 'Client ID de Sandbox',
      clientIdPlaceholder: 'Empieza con QB o es más corto que production...',
      clientSecretLabel: 'Client Secret de Sandbox',
      clientSecretPlaceholder: '40 caracteres...',
      instructions: 'Instrucciones',
      step1: '1. Ve al Portal de Desarrolladores de QuickBooks',
      step2: '2. Selecciona tu app o crea una nueva',
      step3: '3. Ve a la sección "Development" (Sandbox)',
      step4: '4. En "Keys & OAuth" → copia el Client ID y Client Secret',
      step5: '5. En "Redirect URIs" → agrega todos los URIs listados abajo',
      redirectUrisTitle: 'Redirect URIs a configurar en QuickBooks',
      redirectUrisNote: 'Copia cada URI y agrégalo EXACTAMENTE en tu app de QuickBooks',
      saveButton: 'Guardar Credenciales',
      saving: 'Guardando...',
      openPortal: 'Abrir Portal de QuickBooks',
      requiredFields: 'Por favor completa todos los campos',
      success: 'Credenciales de Sandbox guardadas exitosamente',
      error: 'Error al guardar credenciales',
      noCompany: 'No hay empresa seleccionada',
      important: 'Importante',
      sandboxNote: 'Las credenciales de Sandbox solo funcionan con datos de prueba. Cuando tu app sea aprobada para Production, deberás actualizar a las credenciales de Production.',
    },
    en: {
      title: 'Configure QuickBooks Sandbox',
      subtitle: 'Enter development (Sandbox) credentials to start testing',
      company: 'Company',
      clientIdLabel: 'Sandbox Client ID',
      clientIdPlaceholder: 'Starts with QB or shorter than production...',
      clientSecretLabel: 'Sandbox Client Secret',
      clientSecretPlaceholder: '40 characters...',
      instructions: 'Instructions',
      step1: '1. Go to QuickBooks Developer Portal',
      step2: '2. Select your app or create a new one',
      step3: '3. Go to "Development" (Sandbox) section',
      step4: '4. In "Keys & OAuth" → copy Client ID and Client Secret',
      step5: '5. In "Redirect URIs" → add all URIs listed below',
      redirectUrisTitle: 'Redirect URIs to configure in QuickBooks',
      redirectUrisNote: 'Copy each URI and add it EXACTLY in your QuickBooks app',
      saveButton: 'Save Credentials',
      saving: 'Saving...',
      openPortal: 'Open QuickBooks Portal',
      requiredFields: 'Please complete all fields',
      success: 'Sandbox credentials saved successfully',
      error: 'Error saving credentials',
      noCompany: 'No company selected',
      important: 'Important',
      sandboxNote: 'Sandbox credentials only work with test data. When your app is approved for Production, you will need to update to Production credentials.',
    },
  };

  const t = texts[language];

  const redirectUris = [
    `${window.location.origin}/auth/quickbooks/callback`,
    'https://horizonte.aureoncr.com/auth/quickbooks/callback',
    'https://12f71efd-1f70-462c-bb07-db795e0bb262.lovableproject.com/auth/quickbooks/callback',
    'https://id-preview--12f71efd-1f70-462c-bb07-db795e0bb262.lovable.app/auth/quickbooks/callback',
  ];

  const handleSave = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      toast.error(t.requiredFields);
      return;
    }

    if (!selectedCompanyId) {
      toast.error(t.noCompany);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('quickbooks_companies')
        .update({
          client_id: clientId.trim(),
          client_secret: clientSecret.trim(),
          is_connected: false,
          realm_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedCompanyId);

      if (error) throw error;

      toast.success(t.success);
      
      // Wait a bit and redirect to hub
      setTimeout(() => {
        navigate('/quickbooks-hub');
      }, 2000);
    } catch (error: any) {
      console.error('Error saving credentials:', error);
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(language === 'es' ? 'Copiado' : 'Copied');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Main Setup Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t.title}
          </CardTitle>
          <CardDescription>{t.subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company Info */}
          <div className="p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">{t.company}: </span>
            <span className="text-sm">{selectedCompany?.company_name}</span>
          </div>

          {/* Important Note */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{t.important}:</strong> {t.sandboxNote}
            </AlertDescription>
          </Alert>

          {/* Credentials Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientId">{t.clientIdLabel}</Label>
              <Input
                id="clientId"
                type="text"
                placeholder={t.clientIdPlaceholder}
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientSecret">{t.clientSecretLabel}</Label>
              <Input
                id="clientSecret"
                type="password"
                placeholder={t.clientSecretPlaceholder}
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t.saving}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {t.saveButton}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t.instructions}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <span className="font-mono bg-primary text-primary-foreground rounded px-2 py-0.5 text-xs">1</span>
              <span>{t.step1}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono bg-primary text-primary-foreground rounded px-2 py-0.5 text-xs">2</span>
              <span>{t.step2}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono bg-primary text-primary-foreground rounded px-2 py-0.5 text-xs">3</span>
              <span>{t.step3}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono bg-primary text-primary-foreground rounded px-2 py-0.5 text-xs">4</span>
              <span>{t.step4}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono bg-primary text-primary-foreground rounded px-2 py-0.5 text-xs">5</span>
              <span>{t.step5}</span>
            </li>
          </ol>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open('https://developer.intuit.com/app/developer/dashboard', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {t.openPortal}
          </Button>
        </CardContent>
      </Card>

      {/* Redirect URIs Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t.redirectUrisTitle}</CardTitle>
          <CardDescription>{t.redirectUrisNote}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {redirectUris.map((uri, index) => (
            <div key={index} className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-muted rounded text-xs font-mono break-all">
                {uri}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(uri)}
              >
                {language === 'es' ? 'Copiar' : 'Copy'}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickBooksSandboxSetup;
