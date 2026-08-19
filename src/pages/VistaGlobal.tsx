import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Loader2, AlertTriangle, Download } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useGroupConsolidation } from '@/hooks/useGroupConsolidation';
import { formatAmount, formatDateTime } from '@/lib/groupConsolidation';

const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Fecha de corte real del dato (YYYY-MM-DD sin desfase de zona horaria). */
const formatCutoff = (iso: string, language: 'es' | 'en', months: string[]) => {
  const [y, m, d] = iso.split('-').map(Number);
  return language === 'es'
    ? `${d} de ${months[m - 1].toLowerCase()} de ${y}`
    : `${months[m - 1]} ${d}, ${y}`;
};

export default function VistaGlobal() {
  const { language } = useLanguage();
  const { groups, selectedGroupId, groupCompanyIds } = useCompany();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [cutoffMonth, setCutoffMonth] = useState(now.getMonth() + 1);

  const group = groups.find((g) => g.id === selectedGroupId);
  const { data, isLoading } = useGroupConsolidation(groupCompanyIds, year, cutoffMonth);

  const months = language === 'es' ? MONTHS_ES : MONTHS_EN;
  const lang = language as 'es' | 'en';
  const t = {
    es: {
      period: 'Periodo', income: 'Ingresos', expenses: 'Gastos', profit: 'Utilidad contable',
      tax: 'Impuesto de renta (Estimación)', company: 'Empresa', estTax: 'Impuesto estimado',
      byCompany: 'Detalle por empresa', statement: 'Estado de Resultados consolidado',
      pending: 'Pendiente de configuración', noData: 'Pendiente de sincronización',
      connected: 'Conectada', disconnected: 'Desconectada', lastSync: 'Última sincronización',
      note: 'Sin eliminaciones intercompañía',
      disclaimer: 'Estimación informativa sujeta a revisión contable y fiscal',
      totalIncome: 'Total de ingresos', totalExpenses: 'Total de gastos', net: 'Utilidad contable',
      pendingTax: (n: number) => `${n} empresa(s) sin configuración fiscal`,
      partialTax: (n: number, m: number) => `Parcial: ${n} de ${m} empresas configuradas`,
      empty: 'Este grupo aún no tiene empresas asociadas.',
      shareProfit: '% de la utilidad',
      compare: 'Comparativo por empresa',
      export: 'Exportar',
      mixed: 'Las empresas tienen cortes distintos; se usa el más antiguo',
      noCutoff: 'Sin datos sincronizados en el periodo',
    },
    en: {
      period: 'Period', income: 'Revenue', expenses: 'Expenses', profit: 'Book profit',
      tax: 'Income tax (Estimate)', company: 'Company', estTax: 'Estimated tax',
      byCompany: 'Detail by company', statement: 'Consolidated Income Statement',
      pending: 'Pending configuration', noData: 'Pending sync',
      connected: 'Connected', disconnected: 'Disconnected', lastSync: 'Last sync',
      note: 'No intercompany eliminations',
      disclaimer: 'Informative estimate subject to accounting and tax review',
      totalIncome: 'Total revenue', totalExpenses: 'Total expenses', net: 'Book profit',
      pendingTax: (n: number) => `${n} company(ies) without tax configuration`,
      partialTax: (n: number, m: number) => `Partial: ${n} of ${m} companies configured`,
      empty: 'This group has no companies linked yet.',
      shareProfit: '% of profit',
      compare: 'Comparison by company',
      export: 'Export',
      mixed: 'Companies have different cutoffs; the earliest is used',
      noCutoff: 'No synced data in the period',
    },
  }[lang];

  const years = useMemo(() => {
    const current = now.getFullYear();
    return [current, current - 1, current - 2];
  }, []);

  const currency = group?.default_currency ?? 'CRC';
  const currencyWord = currency === 'USD'
    ? (lang === 'es' ? 'dólares' : 'US dollars')
    : (lang === 'es' ? 'colones' : 'colones');

  const blockNote = data?.dataCutoff
    ? (lang === 'es'
        ? `Acumulado al ${formatCutoff(data.dataCutoff, lang, months)} · Montos expresados en ${currencyWord}`
        : `Year to date through ${formatCutoff(data.dataCutoff, lang, months)} · Amounts in ${currencyWord}`)
    : `${t.noCutoff} · ${lang === 'es' ? `Montos expresados en ${currencyWord}` : `Amounts in ${currencyWord}`}`;

  const chartRows = (data?.rows ?? []).filter((r) => r.hasData);
  const showChart = chartRows.length > 1;

  const chartConfig = {
    income: { label: t.income, color: 'hsl(var(--chart-1))' },
    expenses: { label: t.expenses, color: 'hsl(var(--chart-2))' },
    profit: { label: t.profit, color: 'hsl(var(--chart-3))' },
  };

  const handleExport = () => {
    if (!data) return;
    const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const lines: string[] = [];
    lines.push(q(group?.name ?? 'Vista global'));
    lines.push(q(blockNote));
    lines.push(q(t.note));
    lines.push('');
    lines.push(t.byCompany);
    lines.push([t.company, t.income, t.expenses, t.profit, t.shareProfit, t.estTax, t.lastSync].map(q).join(','));
    for (const r of data.rows) {
      lines.push([
        r.companyName,
        r.hasData ? formatAmount(r.income) : t.noData,
        r.hasData ? formatAmount(r.expenses) : '—',
        r.hasData ? formatAmount(r.profit) : '—',
        shareLabel(r.profit, data.totals.profit, r.hasData),
        r.tax.configured && r.tax.amount !== null ? formatAmount(r.tax.amount) : t.pending,
        formatDateTime(r.syncedAt, lang),
      ].map(q).join(','));
    }
    lines.push([
      'Total',
      formatAmount(data.totals.income),
      formatAmount(data.totals.expenses),
      formatAmount(data.totals.profit),
      data.totals.profit > 0 ? '100%' : '—',
      data.totals.tax === null ? t.pending : formatAmount(data.totals.tax),
      formatDateTime(data.lastSyncedAt, lang),
    ].map(q).join(','));
    lines.push('');
    lines.push(t.statement);
    lines.push([t.income, formatAmount(data.totals.income)].map(q).join(','));
    for (const l of data.consolidatedIncome) lines.push([l.label, formatAmount(l.amount)].map(q).join(','));
    lines.push([t.expenses, formatAmount(data.totals.expenses)].map(q).join(','));
    for (const l of data.consolidatedExpenses) lines.push([l.label, formatAmount(l.amount)].map(q).join(','));
    lines.push([t.net, formatAmount(data.totals.profit)].map(q).join(','));
    lines.push('');
    lines.push(q(t.disclaimer));

    const slug = (group?.name ?? 'grupo').replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase();
    const cut = data.dataCutoff ?? `${year}-${String(cutoffMonth).padStart(2, '0')}`;
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}-${cut}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  function shareLabel(profit: number, total: number, hasData: boolean) {
    if (!hasData || total <= 0) return '—';
    return `${((profit / total) * 100).toFixed(1)}%`;
  }

  return (
    <div className="p-6">
      <div className="max-w-[1400px] mx-auto space-y-6 font-sans" style={{ fontVariantNumeric: 'tabular-nums' }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">{group?.name ?? 'Vista global'}</h1>
            <p className="text-sm text-muted-foreground">{blockNote}</p>
            {data?.mixedCutoff && (
              <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                <AlertTriangle className="h-3.5 w-3.5" /> {t.mixed}
              </p>
            )}
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
            <Button variant="outline" onClick={handleExport} disabled={!data}>
              <Download className="h-4 w-4 mr-2" /> {t.export}
            </Button>
          </div>
        </div>

        {groupCompanyIds.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">{t.empty}</CardContent></Card>
        ) : isLoading || !data ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: t.income, value: data.totals.income as number | null },
                { label: t.expenses, value: data.totals.expenses as number | null },
                { label: t.profit, value: data.totals.profit as number | null },
                { label: t.tax, value: data.totals.tax },
              ].map((k) => (
                <Card key={k.label}>
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs uppercase tracking-wide">{k.label}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {k.value === null ? (
                      <div className="text-base text-amber-600">{t.pending}</div>
                    ) : (
                      <div className="text-2xl font-semibold">{formatAmount(k.value)}</div>
                    )}
                    {k.label === t.tax && data.totals.tax !== null && data.totals.taxPending > 0 && (
                      <div className="text-xs text-amber-600 mt-1">
                        {t.partialTax(data.totals.taxConfigured, data.totals.taxTotalCompanies)}
                      </div>
                    )}
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

            {showChart && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.compare}</CardTitle>
                  <CardDescription>{blockNote}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[320px] w-full">
                    <BarChart data={chartRows.map((r) => ({
                      name: r.companyName,
                      income: Math.round(r.income),
                      expenses: Math.round(r.expenses),
                      profit: Math.round(r.profit),
                    }))}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={100}
                        fontSize={12}
                        tickFormatter={(v: number) => formatAmount(v)}
                      />
                      <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatAmount(Number(v))} />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="income" fill="var(--color-income)" radius={2} />
                      <Bar dataKey="expenses" fill="var(--color-expenses)" radius={2} />
                      <Bar dataKey="profit" fill="var(--color-profit)" radius={2} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.byCompany}</CardTitle>
                <CardDescription>{blockNote}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.company}</TableHead>
                      <TableHead className="text-right">{t.income}</TableHead>
                      <TableHead className="text-right">{t.expenses}</TableHead>
                      <TableHead className="text-right">{t.profit}</TableHead>
                      <TableHead className="text-right">{t.shareProfit}</TableHead>
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
                        <TableCell className="text-right">
                          {r.hasData ? formatAmount(r.income) : <span className="text-muted-foreground">{t.noData}</span>}
                        </TableCell>
                        <TableCell className="text-right">{r.hasData ? formatAmount(r.expenses) : '—'}</TableCell>
                        <TableCell className="text-right">{r.hasData ? formatAmount(r.profit) : '—'}</TableCell>
                        <TableCell className="text-right">{shareLabel(r.profit, data.totals.profit, r.hasData)}</TableCell>
                        <TableCell className="text-right">
                          {r.tax.configured && r.tax.amount !== null
                            ? formatAmount(r.tax.amount)
                            : <span className="text-amber-600">{t.pending}</span>}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {formatDateTime(r.syncedAt, lang)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold border-t-2">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">{formatAmount(data.totals.income)}</TableCell>
                      <TableCell className="text-right">{formatAmount(data.totals.expenses)}</TableCell>
                      <TableCell className="text-right">{formatAmount(data.totals.profit)}</TableCell>
                      <TableCell className="text-right">{data.totals.profit > 0 ? '100%' : '—'}</TableCell>
                      <TableCell className="text-right">
                        {data.totals.tax === null
                          ? <span className="text-amber-600 font-normal">{t.pending}</span>
                          : formatAmount(data.totals.tax)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-normal text-muted-foreground">
                        {formatDateTime(data.lastSyncedAt, lang)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.statement}</CardTitle>
                <CardDescription>{blockNote} · {t.note}</CardDescription>
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
