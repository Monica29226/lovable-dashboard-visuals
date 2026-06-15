import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCompany } from '@/contexts/CompanyContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Building2, Loader2, Database, FileSpreadsheet, CheckCircle2, AlertTriangle, Power,
} from 'lucide-react';

interface CompanyRow {
  id: string;
  company_name: string;
  data_source: 'quickbooks' | 'excel';
  is_connected: boolean;
  is_active: boolean;
  responsable_user_id: string | null;
}

type InfoStatus = 'updated' | 'needs_update' | 'stale';

const DAYS_30 = 30 * 24 * 60 * 60 * 1000;
const DAYS_90 = 90 * 24 * 60 * 60 * 1000;

export default function ResumenTab() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { selectCompany } = useCompany();

  const { data: companies, isLoading } = useQuery({
    queryKey: ['corp-companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quickbooks_companies')
        .select('id, company_name, data_source, is_connected, is_active, responsable_user_id')
        .order('company_name');
      if (error) throw error;
      return data as CompanyRow[];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ['corp-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email');
      if (error) throw error;
      return data as { user_id: string; full_name: string | null; email: string | null }[];
    },
  });

  const { data: lastUpdates } = useQuery({
    queryKey: ['corp-last-updates'],
    queryFn: async () => {
      const [bal, pl] = await Promise.all([
        supabase.from('quickbooks_balance_sheet').select('company_id, report_date'),
        supabase.from('quickbooks_profit_loss').select('company_id, report_date'),
      ]);
      const map: Record<string, string> = {};
      const apply = (rows: { company_id: string; report_date: string }[] | null) => {
        (rows || []).forEach((r) => {
          if (!r.company_id || !r.report_date) return;
          if (!map[r.company_id] || r.report_date > map[r.company_id]) {
            map[r.company_id] = r.report_date;
          }
        });
      };
      apply(bal.data as any);
      apply(pl.data as any);
      return map;
    },
  });

  const profileName = (id: string | null) => {
    if (!id) return '—';
    const p = profiles?.find((x) => x.user_id === id);
    return p?.full_name || p?.email || '—';
  };

  const statusOf = (companyId: string): InfoStatus => {
    const last = lastUpdates?.[companyId];
    if (!last) return 'stale';
    const age = Date.now() - new Date(last).getTime();
    if (age <= DAYS_30) return 'updated';
    if (age <= DAYS_90) return 'needs_update';
    return 'stale';
  };

  const t = {
    es: {
      subtitle: 'Vista consolidada de todas las empresas',
      active: 'Empresas activas', qb: 'Conectadas a QuickBooks', excel: 'Gestionadas por Excel',
      updated: 'Información actualizada', pending: 'Requieren atención',
      company: 'Empresa', responsable: 'Responsable', source: 'Fuente de datos',
      lastUpdate: 'Última actualización', infoState: 'Estado de información',
      empty: 'No hay empresas registradas', title: 'Resumen',
      sUpdated: 'Actualizada', sNeeds: 'Requiere actualización', sStale: 'Sin info reciente',
      inactive: 'Inactiva', never: 'Sin datos',
    },
    en: {
      subtitle: 'Consolidated view of all companies',
      active: 'Active companies', qb: 'Connected to QuickBooks', excel: 'Managed via Excel',
      updated: 'Information up to date', pending: 'Need attention',
      company: 'Company', responsable: 'Owner', source: 'Data source',
      lastUpdate: 'Last update', infoState: 'Information status',
      empty: 'No companies registered', title: 'Overview',
      sUpdated: 'Up to date', sNeeds: 'Needs update', sStale: 'No recent info',
      inactive: 'Inactive', never: 'No data',
    },
  }[language];

  const stats = useMemo(() => {
    const list = companies || [];
    const activeList = list.filter((c) => c.is_active);
    return {
      active: activeList.length,
      qb: list.filter((c) => c.data_source === 'quickbooks').length,
      excel: list.filter((c) => c.data_source === 'excel').length,
      updated: activeList.filter((c) => statusOf(c.id) === 'updated').length,
      pending: activeList.filter((c) => statusOf(c.id) !== 'updated').length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies, lastUpdates]);

  const statusBadge = (s: InfoStatus) => {
    if (s === 'updated') {
      return <Badge className="gap-1 bg-success-live text-paper"><CheckCircle2 className="h-3 w-3" /> {t.sUpdated}</Badge>;
    }
    if (s === 'needs_update') {
      return <Badge variant="secondary" className="gap-1"><AlertTriangle className="h-3 w-3" /> {t.sNeeds}</Badge>;
    }
    return <Badge variant="outline" className="gap-1 text-muted-foreground"><AlertTriangle className="h-3 w-3" /> {t.sStale}</Badge>;
  };

  const openCompany = (id: string) => {
    selectCompany(id);
    navigate('/');
  };

  const statCards = [
    { label: t.active, value: stats.active, icon: Building2 },
    { label: t.qb, value: stats.qb, icon: Database },
    { label: t.excel, value: stats.excel, icon: FileSpreadsheet },
    { label: t.updated, value: stats.updated, icon: CheckCircle2 },
    { label: t.pending, value: stats.pending, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">{t.subtitle}</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <s.icon className="h-4 w-4 text-[hsl(var(--co))]" /> {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" /> {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !companies || companies.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">{t.empty}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.company}</TableHead>
                  <TableHead>{t.responsable}</TableHead>
                  <TableHead>{t.source}</TableHead>
                  <TableHead>{t.lastUpdate}</TableHead>
                  <TableHead>{t.infoState}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((c) => {
                  const last = lastUpdates?.[c.id];
                  return (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => openCompany(c.id)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {c.company_name}
                          {!c.is_active && (
                            <Badge variant="outline" className="gap-1 text-muted-foreground">
                              <Power className="h-3 w-3" /> {t.inactive}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{profileName(c.responsable_user_id)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">
                          {c.data_source === 'excel'
                            ? <><FileSpreadsheet className="h-3 w-3" /> Excel</>
                            : <><Database className="h-3 w-3" /> QuickBooks</>}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {last ? new Date(last).toLocaleDateString('es-CR') : t.never}
                      </TableCell>
                      <TableCell>{statusBadge(statusOf(c.id))}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
