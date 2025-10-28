import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Link2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Company {
  id: string;
  company_name: string;
  is_connected: boolean;
  realm_id: string | null;
}

const QuickBooksCompanies = () => {
  const { language } = useLanguage();
  const { selectCompany } = useCompany();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const texts = {
    es: {
      title: 'Empresas QuickBooks',
      description: 'Administra las conexiones de QuickBooks para cada empresa',
      connect: 'Conectar QuickBooks',
      connected: 'Conectada',
      disconnected: 'Desconectada',
      connectionStatus: 'Estado de Conexión',
      credentials: 'Credenciales configuradas',
    },
    en: {
      title: 'QuickBooks Companies',
      description: 'Manage QuickBooks connections for each company',
      connect: 'Connect QuickBooks',
      connected: 'Connected',
      disconnected: 'Disconnected',
      connectionStatus: 'Connection Status',
      credentials: 'Credentials configured',
    },
  };

  const t = texts[language];

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      const { data, error } = await supabase
        .from('quickbooks_companies')
        .select('*')
        .eq('company_name', 'H+')
        .single();

      if (error) throw error;
      setCompany(data);
      
      // Auto-select this company
      if (data?.id) {
        selectCompany(data.id);
      }
    } catch (error) {
      console.error('Error fetching company:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!company?.id) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('quickbooks-auth', {
        body: { companyId: company.id },
      });

      if (error) throw error;

      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Error connecting:', error);
      toast({
        title: language === 'es' ? 'Error al conectar' : 'Connection error',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">{language === 'es' ? 'Cargando...' : 'Loading...'}</h2>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {language === 'es' ? 'Empresa no encontrada' : 'Company not found'}
            </h3>
            <p className="text-muted-foreground">
              {language === 'es' 
                ? 'No se encontró la empresa H+ en la base de datos' 
                : 'Company H+ not found in database'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground mt-2">{t.description}</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl">{company.company_name}</CardTitle>
            </div>
            <Badge 
              variant={company.is_connected ? 'default' : 'secondary'}
              className="text-sm px-3 py-1"
            >
              {company.is_connected ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {t.connected}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  {t.disconnected}
                </div>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-sm font-medium">{t.connectionStatus}</span>
              <span className={`text-sm ${company.is_connected ? 'text-green-600' : 'text-muted-foreground'}`}>
                {company.is_connected ? t.connected : t.disconnected}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-sm font-medium">{t.credentials}</span>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>

            {company.realm_id && (
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-sm font-medium">Realm ID</span>
                <span className="text-sm text-muted-foreground font-mono">{company.realm_id}</span>
              </div>
            )}
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={handleConnect}
          >
            <Link2 className="mr-2 h-5 w-5" />
            {t.connect}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickBooksCompanies;
