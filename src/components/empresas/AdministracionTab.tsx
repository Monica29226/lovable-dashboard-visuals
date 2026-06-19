import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
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
import { Building2, Plus, Link2, Loader2, CheckCircle2, XCircle, Upload, Power } from 'lucide-react';

interface Company {
  id: string;
  company_name: string;
  is_connected: boolean;
  realm_id: string | null;
  data_source: 'quickbooks' | 'excel';
  is_active: boolean;
}

export default function AdministracionTab() {
  const { language } = useLanguage();
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
      title: 'Administración', description: 'Administra todas las empresas y sus conexiones con QuickBooks',
      add: 'Agregar empresa', name: 'Nombre de la empresa', clientId: 'QuickBooks Client ID',
      clientSecret: 'QuickBooks Client Secret', save: 'Guardar', cancel: 'Cancelar',
      connected: 'Conectada', disconnected: 'Desconectada', connect: 'Conectar con QuickBooks',
      status: 'Estado', actions: 'Acciones', empty: 'No hay empresas registradas',
      newCompany: 'Nueva empresa', newCompanyDesc: 'Ingresa los datos y credenciales de QuickBooks',
    },
    en: {
      title: 'Administration', description: 'Manage all companies and their QuickBooks connections',
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
        .select('id, company_name, is_connected, realm_id, data_source, is_active')
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
      queryClient.invalidateQueries({ queryKey: ['corp-companies'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async (c: Company) => {
      const { data, error } = await supabase.functions.invoke('admin-update-company', {
        body: { id: c.id, is_active: !c.is_active },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-companies'] });
      queryClient.invalidateQueries({ queryKey: ['corp-companies'] });
      toast.success(language === 'es' ? 'Empresa actualizada' : 'Company updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleConnect = async (companyId: string) => {
    setConnectingId(companyId);
    try {
      const { data, error } = await supabase.functions.invoke('quickbooks-auth', {
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
      queryClient.invalidateQueries({ queryKey: ['corp-companies'] });
    } catch (err: any) {
      toast.error(`${language === 'es' ? 'Error al subir Excel' : 'Excel upload error'}: ${err.message}`);
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <p className="text-muted-foreground">{t.description}</p>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              {t.add}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{language === 'es' ? 'Razón social' : 'Legal name'}</Label>
                  <Input value={form.razon_social}
                    onChange={(e) => setForm({ ...form, razon_social: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'es' ? 'Cédula jurídica' : 'Tax ID'}</Label>
                  <Input value={form.cedula_juridica}
                    onChange={(e) => setForm({ ...form, cedula_juridica: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'es' ? 'Actividad económica' : 'Economic activity'}</Label>
                  <Input value={form.actividad_economica}
                    onChange={(e) => setForm({ ...form, actividad_economica: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'es' ? 'Régimen tributario' : 'Tax regime'}</Label>
                  <Input value={form.regimen_tributario}
                    onChange={(e) => setForm({ ...form, regimen_tributario: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'es' ? 'Correo principal' : 'Main email'}</Label>
                  <Input type="email" value={form.correo_principal}
                    onChange={(e) => setForm({ ...form, correo_principal: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'es' ? 'Teléfono' : 'Phone'}</Label>
                  <Input value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'es' ? 'Representante legal' : 'Legal representative'}</Label>
                  <Input value={form.representante_legal}
                    onChange={(e) => setForm({ ...form, representante_legal: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'es' ? 'Moneda funcional' : 'Functional currency'}</Label>
                  <Input value={form.moneda_funcional}
                    onChange={(e) => setForm({ ...form, moneda_funcional: e.target.value })} />
                </div>
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
          {isLoading ? (
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
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive.mutate(c)}
                        disabled={toggleActive.isPending}
                        title={c.is_active ? (language === 'es' ? 'Desactivar' : 'Deactivate') : (language === 'es' ? 'Activar' : 'Activate')}
                      >
                        <Power className={`h-4 w-4 ${c.is_active ? 'text-success-live' : 'text-muted-foreground'}`} />
                      </Button>
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
  );
}
