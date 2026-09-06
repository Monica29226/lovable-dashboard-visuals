import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useCompanyExecutive } from '@/hooks/useCompanyExecutive';
import { formatAmount, formatDateTime } from '@/lib/groupConsolidation';

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
const MONTHS_FULL_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const formatCutoff = (iso: string, lang: 'es' | 'en') => {
  const [y, m, d] = iso.split('-').map(Number);
  return lang === 'es'
    ? `${d} de ${MONTHS_FULL_ES[m - 1]} de ${y}`
    : `${MONTHS_FULL_EN[m - 1]} ${d}, ${y}`;
};

export default function VistaEjecutiva() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { companies, selectedCompanyId, groups, selectedGroupId, groupCompanyIds } = useCompany();
  const lang = language as 'es' | 'en';
  const shortMonths = lang === 'es' ? MONTHS_ES : MONTHS_EN;

  const scopeIds = groupCompanyIds.length ? groupCompanyIds : companies.map((c) => c.id);
  const scopeCompanies = companies.filter((c) => scopeIds.includes(c.id));

  const initial = scopeIds.includes(selectedCompanyId ?? '') ? selectedCompanyId! : scopeCompanies[0]?.id ?? null;
  const [companyId, setCompanyId] = useState<string | null>(initial);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const years = useMemo(() => [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2], []);

  const { data, isLoading } = useCompanyExecutive(companyId, year);
  const group = groups.find((g) => g.id === selectedGroupId);
  const currency = group?.default_currency ?? 'CRC';
  const currencyWord = currency === 'USD'
    ? (lang === 'es' ? 'dólares' : 'US dollars')
    : (lang === 'es' ? 'colones' : 'colones');

  const t = {
    es: {
      title: 'Vista ejecutiva por empresa',
      back: 'Volver al panel',
      company: 'Empresa', period: 'Periodo',
      income: 'Ingresos', expenses: 'Gastos', profit: 'Utilidad contable',
      tax: 'Impuesto de renta (Estimación)',
      monthly: 'Comportamiento mensual',
      monthlyNote: 'Calculado como diferencia entre cierres acumulados sincronizados',
      projection: 'Proyección de renta del año',
      annualized: 'Utilidad anualizada (real extrapolado a 12 meses)',
      projectedTax: 'Renta estimada del año completo',
      pending: 'Pendiente de configuración',
      noData: 'Pendiente de sincronización',
      connected: 'Conectada', disconnected: 'Desconectada',
      lastSync: 'Última sincronización',
      disclaimer: 'Estimación informativa sujeta a revisión contable y fiscal',
      noBudget: 'Esta empresa no tiene presupuesto cargado: solo se proyecta la renta, no ingresos ni gastos.',
      basis: (n: number) => `Con base en ${n} mes(es) de datos reales`,
      empty: 'No hay empresas disponibles.',
      rate: 'Tarifa',
    },
    en: {
      title: 'Executive view by company',
      back: 'Back to dashboard',
      company: 'Company', period: 'Period',
      income: 'Revenue', expenses: 'Expenses', profit: 'Book profit',
      tax: 'Income tax (Estimate)',
      monthly: 'Monthly performance',
      monthlyNote: 'Derived from synced year-to-date closings',
      projection: 'Income tax projection',
      annualized: 'Annualized profit (actual extrapolated to 12 months)',
      projectedTax: 'Estimated full-year income tax',
      pending: 'Pending configuration',
      noData: 'Pending sync',
      connected: 'Connected', disconnected: 'Disconnected',
      lastSync: 'Last sync',
      disclaimer: 'Informative estimate subject to accounting and tax review',
      noBudget: 'This company has no budget loaded: only income tax is projected, not revenue or expenses.',
      basis: (n: number) => `Based on ${n} month(s) of actual data`,
      empty: 'No companies available.',
      rate: 'Rate',
    },
  }[lang];

  const blockNote = data?.cutoff
    ? (lang === 'es'
        ? `Acumulado al ${formatCutoff(data.cutoff, lang)} · Montos expresados en ${currencyWord}`
        : `Year to date through ${formatCutoff(data.cutoff, lang)} · Amounts in ${currencyWord}`)
    : `${t.noData} · ${lang === 'es' ? `Montos expresados en ${currencyWord}` : `Amounts in ${currencyWord}`}`;

  const chartData = (data?.months ?? []).map((m) => ({
    month: shortMonths[m.month - 1],
    income: Math.round(m.income),
    expenses: Math.round(m.expenses),
    profit: Math.round(m.profit),
  }));

  const chartConfig = {
    income: { label: t.income, color: 'hsl(var(--chart-1))' },
    expenses: { label: t.expenses, color: 'hsl(var(--chart-2))' },
    profit: { label: t.profit, color: 'hsl(var(--chart-3))' },
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" className="-ml-2 mb-1" onClick={() => navigate('/panel-2026')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t.back}
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{blockNote}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={companyId ?? ''} onValueChange={(v) => setCompanyId(v)}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder={t.company} /></SelectTrigger>
            <SelectContent>
              {scopeCompanies.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!scopeCompanies.length ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">{t.empty}</CardContent></Card>
      ) : isLoading || !data ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant={data.isConnected ? 'secondary' : 'outline'}>
              {data.isConnected ? t.connected : t.disconnected}
            </Badge>
            <span>{t.lastSync}: {formatDateTime(data.syncedAt, lang)}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2"><CardDescription>{t.income}</CardDescription></CardHeader>
              <CardContent><p className="text-2xl font-semibold tabular-nums">{data.hasData ? formatAmount(data.income) : t.noData}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>{t.expenses}</CardDescription></CardHeader>
              <CardContent><p className="text-2xl font-semibold tabular-nums">{data.hasData ? formatAmount(data.expenses) : '—'}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>{t.profit}</CardDescription></CardHeader>
              <CardContent><p className="text-2xl font-semibold tabular-nums">{data.hasData ? formatAmount(data.profit) : '—'}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>{t.tax}</CardDescription></CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums">
                  {data.tax.configured && data.tax.amount !== null ? formatAmount(data.tax.amount) : t.pending}
                </p>
                {data.tax.rateLabel && <p className="text-xs text-muted-foreground mt-1">{t.rate}: {data.tax.rateLabel}</p>}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.monthly}</CardTitle>
              <CardDescription>{t.monthlyNote} · {currencyWord}</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length ? (
                <ChartContainer config={chartConfig} className="h-[320px] w-full">
                  <BarChart data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={110}
                      tickFormatter={(v: number) => formatAmount(v)}
                    />
                    <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatAmount(Number(v))} />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="income" fill="var(--color-income)" radius={2} />
                    <Bar dataKey="expenses" fill="var(--color-expenses)" radius={2} />
                    <Bar dataKey="profit" fill="var(--color-profit)" radius={2} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <p className="py-10 text-center text-muted-foreground text-sm">{t.noData}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.projection}</CardTitle>
              <CardDescription>{t.noBudget}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">{t.annualized}</p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {data.annualizedProfit !== null ? formatAmount(data.annualizedProfit) : t.noData}
                  </p>
                  {data.monthsElapsed > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">{t.basis(data.monthsElapsed)}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.projectedTax}</p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {data.projectedTax.configured && data.projectedTax.amount !== null
                      ? formatAmount(data.projectedTax.amount)
                      : t.pending}
                  </p>
                  {data.projectedTax.rateLabel && (
                    <p className="text-xs text-muted-foreground mt-1">{t.rate}: {data.projectedTax.rateLabel}</p>
                  )}
                </div>
              </div>
              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                {t.disclaimer}
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
