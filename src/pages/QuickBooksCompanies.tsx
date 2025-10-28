import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Link2, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Company {
  id: string;
  company_name: string;
  is_connected: boolean;
  realm_id: string | null;
  created_at: string;
}

const QuickBooksCompanies = () => {
  const { language } = useLanguage();
  const { loadCompanies, selectCompany } = useCompany();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({
    company_name: '',
    client_id: '',
    client_secret: '',
  });

  const texts = {
    es: {
      title: 'Empresas QuickBooks',
      description: 'Administra las conexiones de QuickBooks para cada empresa',
      addCompany: 'Agregar Empresa',
      companyName: 'Nombre de la Empresa',
      clientId: 'Client ID',
      clientSecret: 'Client Secret',
      save: 'Guardar',
      cancel: 'Cancelar',
      connect: 'Conectar',
      reconnect: 'Reconectar',
      viewData: 'Ver Datos',
      connected: 'Conectada',
      disconnected: 'Desconectada',
      addNewCompany: 'Agregar Nueva Empresa',
      addDescription: 'Ingresa los datos de la empresa y sus credenciales de QuickBooks',
      noCompanies: 'No hay empresas configuradas',
      addFirst: 'Agrega tu primera empresa para comenzar',
      companyAdded: 'Empresa agregada exitosamente',
      errorAdding: 'Error al agregar empresa',
    },
    en: {
      title: 'QuickBooks Companies',
      description: 'Manage QuickBooks connections for each company',
      addCompany: 'Add Company',
      companyName: 'Company Name',
      clientId: 'Client ID',
      clientSecret: 'Client Secret',
      save: 'Save',
      cancel: 'Cancel',
      connect: 'Connect',
      reconnect: 'Reconnect',
      viewData: 'View Data',
      connected: 'Connected',
      disconnected: 'Disconnected',
      addNewCompany: 'Add New Company',
      addDescription: 'Enter company details and QuickBooks credentials',
      noCompanies: 'No companies configured',
      addFirst: 'Add your first company to get started',
      companyAdded: 'Company added successfully',
      errorAdding: 'Error adding company',
    },
  };

  const t = texts[language];

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('quickbooks_companies')
        .select('*')
        .order('company_name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompany = async () => {
    try {
      const { error } = await supabase
        .from('quickbooks_companies')
        .insert([newCompany]);

      if (error) throw error;

      toast({
        title: t.companyAdded,
      });

      setIsDialogOpen(false);
      setNewCompany({ company_name: '', client_id: '', client_secret: '' });
      fetchCompanies();
      loadCompanies();
    } catch (error) {
      console.error('Error adding company:', error);
      toast({
        title: t.errorAdding,
        variant: 'destructive',
      });
    }
  };

  const handleConnect = async (companyId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('quickbooks-auth', {
        body: { companyId },
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

  const handleViewData = (companyId: string) => {
    selectCompany(companyId);
    navigate('/quickbooks-balance');
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground mt-2">{t.description}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t.addCompany}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.addNewCompany}</DialogTitle>
              <DialogDescription>{t.addDescription}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">{t.companyName}</Label>
                <Input
                  id="company_name"
                  value={newCompany.company_name}
                  onChange={(e) =>
                    setNewCompany({ ...newCompany, company_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_id">{t.clientId}</Label>
                <Input
                  id="client_id"
                  value={newCompany.client_id}
                  onChange={(e) =>
                    setNewCompany({ ...newCompany, client_id: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_secret">{t.clientSecret}</Label>
                <Input
                  id="client_secret"
                  type="password"
                  value={newCompany.client_secret}
                  onChange={(e) =>
                    setNewCompany({ ...newCompany, client_secret: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t.cancel}
              </Button>
              <Button onClick={handleAddCompany}>{t.save}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t.noCompanies}</h3>
            <p className="text-muted-foreground mb-4">{t.addFirst}</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t.addCompany}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card key={company.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <CardTitle>{company.company_name}</CardTitle>
                  </div>
                  <Badge variant={company.is_connected ? 'default' : 'secondary'}>
                    {company.is_connected ? t.connected : t.disconnected}
                  </Badge>
                </div>
                {company.realm_id && (
                  <CardDescription className="text-xs">
                    Realm ID: {company.realm_id}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full"
                  variant={company.is_connected ? 'outline' : 'default'}
                  onClick={() => handleConnect(company.id)}
                >
                  <Link2 className="mr-2 h-4 w-4" />
                  {company.is_connected ? t.reconnect : t.connect}
                </Button>
                {company.is_connected && (
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={() => handleViewData(company.id)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {t.viewData}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuickBooksCompanies;
