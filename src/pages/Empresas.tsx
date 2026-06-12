import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Building2, Plus, Link2, Loader2, CheckCircle2, XCircle, Upload } from 'lucide-react';

interface Company {
  id: string;
  company_name: string;
  is_connected: boolean;
  realm_id: string | null;
  data_source: 'quickbooks' | 'excel';
}

export default function Empresas() {
  const { language } = useLanguage();
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    company_name: string;
    data_source: 'quickbooks' | 'excel';
    client_id: string;
    client_secret: string;
    razon_social: string;
    cedula_juridica: string;
    actividad_economica: string;
    regimen_tributario: string;
    correo_principal: string;
    telefono: string;
    representante_legal: string;
    moneda_funcional: string;
  }>({
    company_name: '', data_source: 'excel', client_id: '', client_secret: '',
    razon_social: '', cedula_juridica: '', actividad_economica: '', regimen_tributario: '',
    correo_principal: '', telefono: '', representante_legal: '', moneda_funcional: 'CRC',
  });
  const resetForm = () => setForm({
    company_name: '', data_source: 'excel', client_id: '', client_secret: '',
    razon_social: '', cedula_juridica: '', actividad_economica: '', regimen_tributario: '',
    correo_principal: '', telefono: '', representante_legal: '', moneda_funcional: 'CRC',
  });

  const t = {
    es: {
      title: 'Empresas', description: 'Administra todas las empresas y sus conexiones con QuickBooks',
      add: 'Agregar empresa', name: 'Nombre de la empresa', clientId: 'QuickBooks Client ID',
      clientSecret: 'QuickBooks Client Secret', save: 'Guardar', cancel: 'Cancelar',
      connected: 'Conectada', disconnected: 'Desconectada', connect: 'Conectar con QuickBooks',
      status: 'Estado', actions: 'Acciones', empty: 'No hay empresas registradas',
      newCompany: 'Nueva empresa', newCompanyDesc: 'Ingresa los datos y credenciales de QuickBooks',
    },
    en: {
      title: 'Companies', description: 'Manage all companies and their QuickBooks connections',
      add: 'Add company', name: 'Company name', clientId: 'QuickBooks Client ID',
      clientSecret: 'QuickBooks Client Secret', save: 'Save', cancel: 'Cancel',
      connected: 'Connected', disconnected: 'Disconnected', connect: 'Connect with QuickBooks',
      status: 'Status', actions: 'Actions', empty: 'No companies registered',
      newCompany: 'New company', newCompanyDesc: 'Enter the QuickBooks details and credentials',
    },
  }[language];

  const { data: companies, isLoading } = useQuery({
    queryKey: ['all-companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quickbooks_companies')
        .select('id, company_name, is_connected, realm_id, data_source')
        .order('company_name');
      if (error) throw error;
      return data as Company[];
    },
  });

  const createCompany = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-create-company', {
        body: form,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success(language === 'es' ? 'Empresa creada' : 'Company created');
      resetForm();
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['all-companies'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleConnect = async (companyId: string) => {
    setConnectingId(companyId);
    try {
      const { data, error } = await supabase.functions.invoke('qb-auth', {
        body: { companyId },
      });
      if (error) throw error;
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error(language === 'es' ? 'No se recibió URL de autenticación' : 'No auth URL received');
      }
    } catch (e: any) {
      toast.error(`${language === 'es' ? 'Error al conectar' : 'Connection error'}: ${e.message}`);
      setConnectingId(null);
    }
  };

  const handleUploadExcel = (companyId: string) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingId(companyId);
    try {
      const buffer = await file.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const fileBase64 = btoa(binary);

      const { data, error } = await supabase.functions.invoke('parse-company-excel', {
        body: { companyId, fileBase64, fileName: file.name },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(language === 'es' ? 'Excel analizado y dashboard actualizado' : 'Excel analyzed and dashboard updated');
      queryClient.invalidateQueries({ queryKey: ['all-companies'] });
    } catch (err: any) {
      toast.error(`${language === 'es' ? 'Error al subir Excel' : 'Excel upload error'}: ${err.message}`);
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{t.title}</h1>
            <p className="text-muted-foreground">{t.description}</p>
          </div>

          {(
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4" />
                  {t.add}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.newCompany}</DialogTitle>
                  <DialogDescription>{t.newCompanyDesc}</DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => { e.preventDefault(); createCompany.mutate(); }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="company_name">{t.name}</Label>
                    <Input id="company_name" value={form.company_name} required
                      onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'es' ? 'Fuente de datos' : 'Data source'}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={form.data_source === 'excel' ? 'default' : 'outline'}
                        onClick={() => setForm({ ...form, data_source: 'excel' })}
                      >
                        Excel
                      </Button>
                      <Button
                        type="button"
                        variant={form.data_source === 'quickbooks' ? 'default' : 'outline'}
                        onClick={() => setForm({ ...form, data_source: 'quickbooks' })}
                      >
                        QuickBooks
                      </Button>
                    </div>
                  </div>
                  {form.data_source === 'quickbooks' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="client_id">{t.clientId}</Label>
                        <Input id="client_id" value={form.client_id} required
                          onChange={(e) => setForm({ ...form, client_id: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="client_secret">{t.clientSecret}</Label>
                        <Input id="client_secret" type="password" value={form.client_secret} required
                          onChange={(e) => setForm({ ...form, client_secret: e.target.value })} />
                      </div>
                    </>
                  )}
                  {form.data_source === 'excel' && (
                    <p className="text-xs text-muted-foreground">
                      {language === 'es'
                        ? 'Crea la empresa y luego sube su Excel desde la tabla para generar el dashboard.'
                        : 'Create the company, then upload its Excel from the table to generate the dashboard.'}
                    </p>
                  )}
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      {t.cancel}
                    </Button>
                    <Button type="submit" disabled={createCompany.isPending}>
                      {createCompany.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      {t.save}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {t.title}
            </CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || roleLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !companies || companies.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">{t.empty}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.name}</TableHead>
                    <TableHead>Realm ID</TableHead>
                    <TableHead>{t.status}</TableHead>
                    <TableHead className="text-right">{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.company_name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {c.realm_id || '—'}
                      </TableCell>
                      <TableCell>
                        {c.is_connected ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" /> {t.connected}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <XCircle className="h-3 w-3" /> {t.disconnected}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {c.data_source === 'excel' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            disabled={uploadingId === c.id}
                          >
                            <label className="cursor-pointer">
                              {uploadingId === c.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                              {language === 'es' ? 'Subir Excel' : 'Upload Excel'}
                              <input
                                type="file"
                                accept=".xlsx,.xls"
                                className="hidden"
                                onChange={handleUploadExcel(c.id)}
                                disabled={uploadingId === c.id}
                              />
                            </label>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConnect(c.id)}
                            disabled={connectingId === c.id}
                          >
                            {connectingId === c.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Link2 className="h-4 w-4" />
                            )}
                            {t.connect}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
