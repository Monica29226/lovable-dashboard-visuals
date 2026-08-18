import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useGroupConsolidation } from '@/hooks/useGroupConsolidation';
import { formatAmount, formatDateTime } from '@/lib/groupConsolidation';

const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function VistaGlobal() {
  const { language } = useLanguage();
  const { groups, selectedGroupId, groupCompanyIds } = useCompany();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [cutoffMonth, setCutoffMonth] = useState(now.getMonth() + 1);

  const group = groups.find((g) => g.id === selectedGroupId);
  const { data, isLoading } = useGroupConsolidation(groupCompanyIds, year, cutoffMonth);

  const months = language === 'es' ? MONTHS_ES : MONTHS_EN;
  const t = {
    es: {
      period: 'Periodo', income: 'Ingresos', expenses: 'Gastos', profit: 'Utilidad contable',
      tax: 'Impuesto de renta (Estimación)', company: 'Empresa', estTax: 'Impuesto estimado',
      byCompany: 'Detalle por empresa', statement: 'Estado de Resultados consolidado',
      pending: 'Pendiente de configuración', noData: 'Pendiente de sincronización',
      connected: 'Conectada', disconnected: 'Desconectada', lastSync: 'Última sincronización',
      note: 'Sin eliminaciones intercompañía',
      disclaimer: 'Estimación informativa sujeta a revisión contable y fiscal',
      currencyNote: (g: string) => `Acumulado enero–${months[cutoffMonth - 1].toLowerCase()} ${year} · Montos expresados en ${g === 'USD' ? 'dólares' : 'colones'}`,
      totalIncome: 'Total de ingresos', totalExpenses: 'Total de gastos', net: 'Utilidad contable',
      pendingTax: (n: number) => `${n} empresa(s) sin configuración fiscal`,
      empty: 'Este grupo aún no tiene empresas asociadas.',
    },
    en: {
      period: 'Period', income: 'Revenue', expenses: 'Expenses', profit: 'Book profit',
      tax: 'Income tax (Estimate)', company: 'Company', estTax: 'Estimated tax',
      byCompany: 'Detail by company', statement: 'Consolidated Income Statement',
      pending: 'Pending configuration', noData: 'Pending sync',
      connected: 'Connected', disconnected: 'Disconnected', lastSync: 'Last sync',
      note: 'No intercompany eliminations',
      disclaimer: 'Informative estimate subject to accounting and tax review',
      currencyNote: (g: string) => `Year to date January–${months[cutoffMonth - 1]} ${year} · Amounts in ${g === 'USD' ? 'US dollars' : 'colones'}`,
      totalIncome: 'Total revenue', totalExpenses: 'Total expenses', net: 'Book profit',
      pendingTax: (n: number) => `${n} company(ies) without tax configuration`,
      empty: 'This group has no companies linked yet.',
    },
  }[language];

  const years = useMemo(() => {
    const current = now.getFullYear();
    return [current, current - 1, current - 2];
  }, []);

  const currency = group?.default_currency ?? 'CRC';

  const kpis = data
    ? [
        { label: t.income, value: data.totals.income },
        { label: t.expenses, value: data.totals.expenses },
        { label: t.profit, value: data.totals.profit },
        { label: t.tax, value: data.totals.tax },
      ]
    : [];

  return (
    <div className="p-6">
      <div className="max-w-[1400px] mx-auto space-y-6 font-sans" style={{ fontVariantNumeric: 'tabular-nums' }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">{group?.name ?? 'Vista global'}</h1>
            <p className="text-sm text-muted-foreground">{t.currencyNote(currency)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={String(cutoffMonth)} onValueChange={(v) => setCutoffMonth(Number(v))}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {months.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {groupCompanyIds.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">{t.empty}</CardContent></Card>
        ) : isLoading || !data ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {kpis.map((k) => (
                <Card key={k.label}>
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs uppercase tracking-wide">{k.label}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">{formatAmount(k.value)}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{t.note}</Badge>
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> {t.disclaimer}
              </span>
              {data.totals.taxPending > 0 && (
                <Badge variant="outline" className="text-amber-600 border-amber-500/40">
                  {t.pendingTax(data.totals.taxPending)}
                </Badge>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.byCompany}</CardTitle>
                <CardDescription>{t.currencyNote(currency)}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.company}</TableHead>
                      <TableHead className="text-right">{t.income}</TableHead>
                      <TableHead className="text-right">{t.expenses}</TableHead>
                      <TableHead className="text-right">{t.profit}</TableHead>
                      <TableHead className="text-right">{t.estTax}</TableHead>
                      <TableHead className="text-right">{t.lastSync}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.rows.map((r) => (
                      <TableRow key={r.companyId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{r.companyName}</span>
                            <Badge variant={r.isConnected ? 'outline' : 'secondary'} className={r.isConnected ? 'text-emerald-600 border-emerald-500/40' : ''}>
                              {r.isConnected ? t.connected : t.disconnected}
                            </Badge>
                          </div>
                        </TableCell>
                        {r.hasData ? (
                          <>
                            <TableCell className="text-right">{formatAmount(r.income)}</TableCell>
                            <TableCell className="text-right">{formatAmount(r.expenses)}</TableCell>
                            <TableCell className="text-right">{formatAmount(r.profit)}</TableCell>
                          </>
                        ) : (
                          <TableCell colSpan={3} className="text-right text-muted-foreground">{t.noData}</TableCell>
                        )}
                        <TableCell className="text-right">
                          {r.tax.configured && r.tax.amount !== null
                            ? formatAmount(r.tax.amount)
                            : <span className="text-amber-600">{t.pending}</span>}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {formatDateTime(r.syncedAt, language as 'es' | 'en')}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold border-t-2">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">{formatAmount(data.totals.income)}</TableCell>
                      <TableCell className="text-right">{formatAmount(data.totals.expenses)}</TableCell>
                      <TableCell className="text-right">{formatAmount(data.totals.profit)}</TableCell>
                      <TableCell className="text-right">{formatAmount(data.totals.tax)}</TableCell>
                      <TableCell className="text-right text-xs font-normal text-muted-foreground">
                        {formatDateTime(data.lastSyncedAt, language as 'es' | 'en')}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.statement}</CardTitle>
                <CardDescription>{t.currencyNote(currency)} · {t.note}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow className="bg-muted/40 font-semibold">
                      <TableCell>{t.income}</TableCell>
                      <TableCell className="text-right">{formatAmount(data.totals.income)}</TableCell>
                    </TableRow>
                    {data.consolidatedIncome.map((l) => (
                      <TableRow key={`i-${l.label}`}>
                        <TableCell className="pl-8">{l.label}</TableCell>
                        <TableCell className="text-right">{formatAmount(l.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/40 font-semibold">
                      <TableCell>{t.expenses}</TableCell>
                      <TableCell className="text-right">{formatAmount(data.totals.expenses)}</TableCell>
                    </TableRow>
                    {data.consolidatedExpenses.map((l) => (
                      <TableRow key={`e-${l.label}`}>
                        <TableCell className="pl-8">{l.label}</TableCell>
                        <TableCell className="text-right">{formatAmount(l.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 font-semibold">
                      <TableCell>{t.net}</TableCell>
                      <TableCell className="text-right">{formatAmount(data.totals.profit)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
