/** Vista ejecutiva financiera y fiscal por empresa. */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SlidersHorizontal } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { buildInsights, buildYearProjection, computeFiscal, formatMoney, formatPct, topExpenses, type FiscalResult, type TaxBracket, type YearProjection } from "@/lib/executiveProjection";
import { creditsFromSettings, useFiscalSettings, useSaveFiscalCredits, useTaxBrackets, type FiscalSettingsRow } from "@/hooks/useExecutiveFiscal";

interface Props { companyId: string; companyName: string; isConnected: boolean; year?: number }
interface YearData {
  currency: string | null;
  connection: string;
  pnl: { status: string; expenseCategories: { name: string; amount: number | null }[] };
  monthly: { status: string; series: { label: string; income: number | null; expenses: number | null }[] };
}

type TaxpayerProfile = "persona_fisica_lucrativa" | "persona_juridica_general" | "persona_juridica_pyme";
const LEGAL_GROSS_INCOME_THRESHOLD = 119174000;
const PROFILE_LABELS: Record<TaxpayerProfile, string> = {
  persona_fisica_lucrativa: "Persona física con actividad lucrativa",
  persona_juridica_general: "Sociedad – tarifa general 30 %",
  persona_juridica_pyme: "Sociedad – tramos pyme",
};

const useYearData = (companyId: string, year: number, enabled: boolean) => useQuery({
  queryKey: ["qb-dashboard-data", companyId, `${year}-01-01`, `${year}-12-31`],
  enabled: enabled && !!companyId,
  queryFn: async (): Promise<YearData> => {
    const { data, error } = await supabase.functions.invoke("quickbooks-dashboard-data", {
      body: { companyId, startDate: `${year}-01-01`, endDate: `${year}-12-31` },
    });
    if (error) throw error;
    return data as YearData;
  },
});

const cleanExpenseName = (name: string) => name.replace(/^\s*\d+(?:[.-]\d+)*\s*[-–—:]?\s*/, "").trim() || name;
const asConfig = (settings: FiscalSettingsRow | null | undefined) => (settings?.config ?? {}) as Record<string, unknown>;
const validProfile = (value: string | null | undefined): value is TaxpayerProfile => !!value && value in PROFILE_LABELS;

function resolveProfile(settings: FiscalSettingsRow | null | undefined, projectedIncome: number) {
  if (!settings || !validProfile(settings.taxpayer_type)) return { profile: null, reason: null, threshold: null };
  const configured = settings.taxpayer_type;
  if (configured === "persona_fisica_lucrativa") {
    return { profile: configured, reason: "Perfil registrado para esta empresa y período.", threshold: null };
  }
  const rawThreshold = Number(asConfig(settings).umbral_renta_bruta);
  const threshold = Number.isFinite(rawThreshold) && rawThreshold > 0 ? rawThreshold : LEGAL_GROSS_INCOME_THRESHOLD;
  const profile: TaxpayerProfile = projectedIncome > threshold ? "persona_juridica_general" : "persona_juridica_pyme";
  const reason = projectedIncome > threshold
    ? `La renta bruta proyectada supera el umbral de ${formatMoney(threshold, "", { showSymbol: false })}.`
    : `La renta bruta proyectada no supera el umbral de ${formatMoney(threshold, "", { showSymbol: false })}.`;
  return { profile, reason, threshold };
}

const variation = (current: number, previous: number) => previous === 0 ? null : (current - previous) / Math.abs(previous);
const priorComparable = (projection: YearProjection, months: number) => {
  const slice = projection.months.slice(0, months);
  const income = slice.reduce((sum, month) => sum + month.income, 0);
  const expenses = slice.reduce((sum, month) => sum + month.expenses, 0);
  return { income, expenses, profit: income - expenses };
};

const MetricCard = ({ label, value, subtitle, variationValue, favorableWhenUp = true, tone = "ink", alert = false }: {
  label: string; value: string; subtitle?: string; variationValue?: number | null; favorableWhenUp?: boolean;
  tone?: "ink" | "green" | "red" | "gold"; alert?: boolean;
}) => {
  const favorable = variationValue == null ? null : variationValue === 0 || (variationValue > 0) === favorableWhenUp;
  return (
    <div className={`rounded-xl border border-executive-line bg-card p-5 ${alert ? "border-l-4 border-l-executive-red" : ""}`}>
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-50">{label}</p>
      <p className={`mt-3 text-2xl font-semibold tabular-nums md:text-3xl ${tone === "green" ? "text-executive-green" : tone === "red" ? "text-executive-red" : tone === "gold" ? "text-gold" : "text-ink"}`}>{value}</p>
      {variationValue != null && (
        <span className={`mt-3 inline-flex text-xs font-semibold tabular-nums ${favorable ? "text-executive-green" : "text-executive-red"}`}>
          {variationValue >= 0 ? "▲" : "▼"} {formatPct(Math.abs(variationValue))} vs año anterior
        </span>
      )}
      {subtitle && <p className="mt-2 text-xs leading-relaxed text-ink-50">{subtitle}</p>}
    </div>
  );
};

const MoneyTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return <div className="rounded border border-executive-line bg-card p-3 text-xs"><p className="mb-2 font-semibold text-ink">{label}</p>{payload.map((item) => <p key={item.name} className="tabular-nums text-ink-70">{item.name}: {formatMoney(item.value, "", { showSymbol: false })}</p>)}</div>;
};

const WaterfallRow = ({ label, value, kind = "normal" }: { label: string; value: string; kind?: "normal" | "sub" | "total" }) => <div className={`flex items-baseline justify-between gap-6 py-2.5 ${kind === "total" ? "border-t border-gold pt-3" : "border-b border-ink/10"}`}><span className={`text-sm ${kind === "sub" ? "pl-4 text-ink-50" : "text-ink-70"}`}>{label}</span><span className={`tabular-nums ${kind === "total" ? "text-base font-semibold text-ink" : "text-sm text-ink"}`}>{value}</span></div>;

const FiscalControls = ({ canEdit, fiscalPeriod, settings, profile, save, form, setForm, openForm, submit }: {
  canEdit: boolean; fiscalPeriod: string; settings: FiscalSettingsRow | null | undefined; profile: TaxpayerProfile | null;
  save: ReturnType<typeof useSaveFiscalCredits>;
  form: FiscalForm | null; setForm: (form: FiscalForm | null) => void; openForm: () => void; submit: () => Promise<void>;
}) => canEdit ? (
  <Dialog open={!!form} onOpenChange={(open) => (open ? openForm() : setForm(null))}>
    <DialogTrigger asChild><Button variant="outline" size="sm" className="rounded-sm border-gold text-ink"><SlidersHorizontal className="mr-2 h-4 w-4" strokeWidth={1.4} />Registrar anticipos y créditos</Button></DialogTrigger>
    <DialogContent className="sm:max-w-md dashboard-sans">
      <DialogHeader><DialogTitle>Datos fiscales {fiscalPeriod}</DialogTitle><DialogDescription>Registre los datos fiscales de la empresa. El saldo se recalcula de inmediato.</DialogDescription></DialogHeader>
      {form && <div className="space-y-3">
        <div className="space-y-1.5"><Label className="text-xs">Tipo de contribuyente</Label>
          <Select value={form.profile} onValueChange={(value) => setForm({ ...form, profile: value as TaxpayerProfile })}>
            <SelectTrigger className="rounded-sm"><SelectValue placeholder="Seleccione un perfil" /></SelectTrigger>
            <SelectContent>{Object.entries(PROFILE_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {([ ["fiscalAdjustments", "Ajustes fiscales (+/−)"], ["advances", "Anticipos de renta pagados"], ["withholdings", "Retenciones acreditables de plataformas"], ["otherCredits", "Otros créditos fiscales aplicables"] ] as const).map(([key, label]) => <div key={key} className="space-y-1.5"><Label htmlFor={key} className="text-xs">{label}</Label><Input id={key} inputMode="decimal" className="rounded-sm tabular-nums" value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></div>)}
        <div className="space-y-1.5"><Label htmlFor="notes" className="text-xs">Notas</Label><Input id="notes" className="rounded-sm" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></div>
        <div className="flex items-center justify-between gap-4 border-t border-executive-line pt-3"><Label htmlFor="client-view" className="text-sm">Mostrar vista por pestañas al cliente</Label><Switch id="client-view" checked={form.clientViewEnabled} onCheckedChange={(checked) => setForm({ ...form, clientViewEnabled: checked })} /></div>
      </div>}
      <DialogFooter><Button variant="ghost" onClick={() => setForm(null)}>Cancelar</Button><Button onClick={submit} disabled={save.isPending || !form?.profile}>Guardar</Button></DialogFooter>
    </DialogContent>
  </Dialog>
) : null;

type FiscalForm = { fiscalAdjustments: string; advances: string; withholdings: string; otherCredits: string; notes: string; profile: TaxpayerProfile | ""; clientViewEnabled: boolean };

const FiscalAccordion = ({ projection, fiscal, brackets, profile, profileReason }: { projection: YearProjection; fiscal: FiscalResult; brackets: TaxBracket[]; profile: TaxpayerProfile | null; profileReason: string | null }) => (
  <Accordion type="single" collapsible>
    <AccordionItem value="calculo" className="border-b-0"><AccordionTrigger className="text-sm text-ink-70">Ver cómo se calculó</AccordionTrigger><AccordionContent>
      {profile ? <div className="mb-4 rounded border border-executive-line bg-card p-3 text-xs leading-relaxed text-ink-70"><strong className="text-ink">Perfil aplicado:</strong> {PROFILE_LABELS[profile]}. {profileReason}</div> : <p className="mb-4 text-xs text-ink-50">No existe una configuración fiscal para esta empresa y período. No se asumió un perfil.</p>}
      <p className="text-xs leading-relaxed text-ink-70">Los meses restantes se proyectan con el promedio mensual real: {formatMoney(projection.monthlyAverageIncome, "", { showSymbol: false })} de ingresos y {formatMoney(projection.monthlyAverageExpenses, "", { showSymbol: false })} de gastos. Los tramos configurados se aplican a la renta neta imponible proyectada.</p>
      {brackets.length ? <table className="mt-3 w-full text-xs tabular-nums"><thead><tr className="border-b border-gold text-left text-[0.68rem] uppercase tracking-[0.14em] text-ink-50"><th className="py-2 font-semibold">Tramo de renta imponible</th><th className="py-2 text-right font-semibold">Tarifa</th></tr></thead><tbody>{brackets.map((bracket, index) => <tr key={bracket.id ?? index} className="border-b border-ink/10"><td className="py-2 text-ink-70">{bracket.upper_limit === null ? `Exceso sobre ${formatMoney(bracket.lower_limit, "", { showSymbol: false })}` : bracket.lower_limit === 0 ? `Hasta ${formatMoney(bracket.upper_limit, "", { showSymbol: false })}` : `Exceso de ${formatMoney(bracket.lower_limit, "", { showSymbol: false })} a ${formatMoney(bracket.upper_limit, "", { showSymbol: false })}`}</td><td className="py-2 text-right text-ink">{formatPct(bracket.rate)}</td></tr>)}</tbody></table> : <p className="mt-3 text-xs text-ink-50">Sin tramos configurados para este período y perfil.</p>}
      {fiscal.effectiveRate !== null && <p className="mt-3 text-xs text-ink-50">Tarifa efectiva estimada: {formatPct(fiscal.effectiveRate)}.</p>}
    </AccordionContent></AccordionItem>
  </Accordion>
);

export const ExecutiveOnePager = ({ companyId, companyName, isConnected, year }: Props) => {
  const fiscalYear = year ?? new Date().getFullYear();
  const fiscalPeriod = String(fiscalYear);
  const previousYear = fiscalYear - 1;
  const currentData = useYearData(companyId, fiscalYear, isConnected);
  const previousData = useYearData(companyId, previousYear, isConnected);
  const settings = useFiscalSettings(companyId, fiscalPeriod);
  const previousSettings = useFiscalSettings(companyId, String(previousYear));
  const save = useSaveFiscalCredits(companyId, fiscalPeriod);
  const { isStaff: canEdit } = useUserRole();
  const projection = useMemo(() => buildYearProjection(currentData.data?.monthly?.series ?? [], fiscalYear), [currentData.data?.monthly?.series, fiscalYear]);
  const previousProjection = useMemo(() => buildYearProjection(previousData.data?.monthly?.series ?? [], previousYear, new Date(previousYear + 1, 0, 1)), [previousData.data?.monthly?.series, previousYear]);
  const profileResolution = useMemo(() => resolveProfile(settings.data, projection.projectedIncome), [settings.data, projection.projectedIncome]);
  const brackets = useTaxBrackets(fiscalPeriod, profileResolution.profile);
  const credits = useMemo(() => creditsFromSettings(settings.data), [settings.data]);
  const fiscal = useMemo(() => computeFiscal(projection, brackets.data ?? [], credits), [projection, brackets.data, credits]);
  const expenses = useMemo(() => topExpenses(currentData.data?.pnl?.expenseCategories ?? []).map((item) => ({ ...item, name: cleanExpenseName(item.name) })), [currentData.data?.pnl?.expenseCategories]);
  const enhancedView = asConfig(settings.data).client_view_enabled === true;
  const money = (value: number | null | undefined) => value == null ? "Pendiente" : formatMoney(value, "", { showSymbol: false });
  const [form, setForm] = useState<FiscalForm | null>(null);
  const openForm = () => setForm({
    fiscalAdjustments: String(credits.fiscalAdjustments ?? 0), advances: String(credits.advances ?? 0),
    withholdings: String(credits.withholdings ?? 0), otherCredits: String(credits.otherCredits ?? 0), notes: settings.data?.notes ?? "",
    profile: validProfile(settings.data?.taxpayer_type) ? settings.data.taxpayer_type : "", clientViewEnabled: enhancedView,
  });
  const submit = async () => {
    if (!form || !form.profile) return;
    const number = (value: string) => Number(value.replace(/[^\d.-]/g, "")) || 0;
    try {
      await save.mutateAsync({ fiscalAdjustments: number(form.fiscalAdjustments), advances: number(form.advances), withholdings: number(form.withholdings), otherCredits: number(form.otherCredits), notes: form.notes || null, profile: form.profile, clientViewEnabled: form.clientViewEnabled });
      setForm(null);
      toast({ title: "Datos fiscales actualizados", description: "El saldo pendiente se recalculó." });
    } catch (error) { toast({ title: "No fue posible guardar", description: error instanceof Error ? error.message : "Intente de nuevo.", variant: "destructive" }); }
  };
  if (!isConnected) return null;
  if (currentData.isLoading || settings.isLoading) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  const noData = !projection.hasRealData || currentData.data?.monthly?.status !== "ok";
  const controls = <FiscalControls canEdit={canEdit} fiscalPeriod={fiscalPeriod} settings={settings.data} profile={profileResolution.profile} save={save} form={form} setForm={setForm} openForm={openForm} submit={submit} />;
  const accordion = <FiscalAccordion projection={projection} fiscal={fiscal} brackets={brackets.data ?? []} profile={profileResolution.profile} profileReason={profileResolution.reason} />;
  if (noData) return <section className="dashboard-sans bg-paper"><header className="bg-ink px-6 py-8 text-primary-foreground"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">{companyName}</p><h1 className="mt-2 text-2xl font-semibold">Su situación financiera y fiscal {fiscalYear}</h1></header><p className="px-6 py-10 text-sm text-ink-50">Aún no hay información mensual sincronizada para {fiscalYear}.</p></section>;

  if (!enhancedView) {
    return <LegacyView companyName={companyName} fiscalYear={fiscalYear} currencyLabel={currentData.data?.currency === "USD" ? "dólares" : "colones"} projection={projection} fiscal={fiscal} expenses={expenses} money={money} controls={controls} accordion={accordion} />;
  }

  const previousComparable = previousProjection.hasRealData ? priorComparable(previousProjection, projection.lastClosedMonth) : null;
  const taxToday = fiscal.configured ? fiscal.tax * projection.realMonths / 12 : null;
  const pendingToday = taxToday == null ? null : taxToday - fiscal.totalCredits;
  const advancedShare = taxToday && taxToday > 0 ? fiscal.totalCredits / taxToday : null;
  const currentMargin = projection.realIncome ? projection.realProfit / projection.realIncome : null;
  const previousMargin = previousComparable?.income ? previousComparable.profit / previousComparable.income : null;
  const previousConfig = asConfig(previousSettings.data);
  const declaredTax = typeof previousConfig.declared_tax === "number" ? previousConfig.declared_tax : null;
  const declaredAfterCredits = typeof previousConfig.declared_tax_after_credits === "number" ? previousConfig.declared_tax_after_credits : null;
  const monthWord = projection.lastClosedLabel ?? "el último cierre";
  const lineData = projection.months.slice(0, projection.lastClosedMonth).map((month, index) => ({
    label: month.label, ingresos: month.income, utilidad: month.income - month.expenses,
    anteriores: previousProjection.hasRealData ? previousProjection.months[index]?.income ?? null : null,
  }));
  const maxExpense = expenses[0]?.amount ?? 0;

  return <section className="dashboard-sans bg-paper text-ink">
    <header className="border-b border-executive-line bg-card px-6 py-7 md:px-10"><h1 className="text-2xl font-semibold text-ink md:text-3xl">{companyName}</h1><p className="mt-2 text-sm text-ink-50">Acumulado enero – {monthWord} {fiscalYear} · {projection.realMonths} de 12 meses · Montos expresados en {currentData.data?.currency === "USD" ? "dólares" : "colones"}</p></header>
    <div className="px-4 py-6 md:px-10 md:py-8">
      <Tabs defaultValue="resumen">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl border border-executive-line bg-card p-1 md:grid-cols-4">
          {[["resumen", "Resumen"], ["ingresos", "Ingresos"], ["gastos", "Gastos"], ["impuestos", "Impuestos"]].map(([value, label]) => <TabsTrigger key={value} value={value} className="rounded-lg px-4 py-2.5 data-[state=active]:bg-ink data-[state=active]:text-primary-foreground data-[state=active]:shadow-none">{label}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="resumen" className="mt-6 space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Ingresos acumulados" value={money(projection.realIncome)} variationValue={previousComparable ? variation(projection.realIncome, previousComparable.income) : null} /><MetricCard label="Gastos acumulados" value={money(projection.realExpenses)} variationValue={previousComparable ? variation(projection.realExpenses, previousComparable.expenses) : null} favorableWhenUp={false} /><MetricCard label="Utilidad acumulada" value={money(projection.realProfit)} tone={projection.realProfit >= 0 ? "green" : "red"} variationValue={previousComparable ? variation(projection.realProfit, previousComparable.profit) : null} /><MetricCard label="Saldo de renta por pagar" value={money(pendingToday)} tone="red" alert subtitle={taxToday == null ? "Pendiente de configuración" : `Impuesto a hoy ${money(taxToday)} · adelantado ${advancedShare == null ? "Pendiente" : formatPct(advancedShare)}`} /></div>
          {previousProjection.hasRealData && <div><h2 className="mb-4 text-lg font-semibold">Así cerró {previousYear}</h2><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Ingresos" value={money(previousProjection.realIncome)} /><MetricCard label="Gastos" value={money(previousProjection.realExpenses)} /><MetricCard label="Ganancia" value={money(previousProjection.realProfit)} tone={previousProjection.realProfit >= 0 ? "green" : "red"} />{declaredTax != null && <MetricCard label={`Renta ${previousYear}`} value={money(declaredTax)} subtitle={declaredAfterCredits == null ? undefined : `Pagó ${money(declaredAfterCredits)} tras retenciones`} />}</div></div>}
        </TabsContent>
        <TabsContent value="ingresos" className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2"><MetricCard label="Ingresos" value={money(projection.realIncome)} variationValue={previousComparable ? variation(projection.realIncome, previousComparable.income) : null} /><MetricCard label="Utilidad" value={money(projection.realProfit)} tone={projection.realProfit >= 0 ? "green" : "red"} variationValue={previousComparable ? variation(projection.realProfit, previousComparable.profit) : null} /></div>
          <div className="rounded-xl border border-executive-line bg-card p-4 md:p-6"><h2 className="text-sm font-semibold uppercase tracking-[0.14em]">Comportamiento mensual</h2><div className="mt-5 h-[340px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={lineData} margin={{ top: 10, right: 90, left: 18, bottom: 0 }}><CartesianGrid vertical={false} stroke="hsl(var(--executive-line))" /><XAxis dataKey="label" tickLine={false} axisLine={false} /><YAxis width={100} tickLine={false} axisLine={false} tickFormatter={(value: number) => money(value)} /><Tooltip content={<MoneyTooltip />} />{previousProjection.hasRealData && <Line name={`Ingresos ${previousYear}`} type="monotone" dataKey="anteriores" stroke="hsl(var(--ink-50) / .45)" strokeDasharray="5 5" dot={false} strokeWidth={2}><LabelList dataKey="anteriores" content={(props) => props.index === lineData.length - 1 ? <text x={Number(props.x) + 12} y={Number(props.y)} fill="hsl(var(--ink-50))" fontSize="11">{previousYear}</text> : null} /></Line>}<Line name="Ingresos" type="monotone" dataKey="ingresos" stroke="hsl(var(--ink))" dot={{ r: 3 }} strokeWidth={2.5}><LabelList dataKey="ingresos" content={(props) => props.index === lineData.length - 1 ? <text x={Number(props.x) + 12} y={Number(props.y)} fill="hsl(var(--ink))" fontSize="11">Ingresos</text> : null} /></Line><Line name="Utilidad" type="monotone" dataKey="utilidad" stroke="hsl(var(--gold))" dot={{ r: 3 }} strokeWidth={2.5}><LabelList dataKey="utilidad" content={(props) => props.index === lineData.length - 1 ? <text x={Number(props.x) + 12} y={Number(props.y)} fill="hsl(var(--gold))" fontSize="11">Utilidad</text> : null} /></Line></LineChart></ResponsiveContainer></div></div>
        </TabsContent>
        <TabsContent value="gastos" className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-3"><MetricCard label="Utilidad del período" value={money(projection.realProfit)} tone={projection.realProfit >= 0 ? "green" : "red"} subtitle={`Margen neto ${formatPct(currentMargin)}`} /><MetricCard label="Disponible después de renta" value={money(taxToday == null ? null : projection.realProfit - taxToday)} subtitle={taxToday == null ? "Pendiente de configuración" : `Utilidad menos impuesto estimado ${money(taxToday)}`} /><MetricCard label="Rendimiento sobre ingresos" value={formatPct(currentMargin)} subtitle={previousMargin == null ? undefined : `Año anterior, mismos meses: ${formatPct(previousMargin)}`} /></div>
          <div className="rounded-xl border border-executive-line bg-card p-5 md:p-6"><h2 className="text-sm font-semibold uppercase tracking-[0.14em]">Principales gastos</h2>{expenses.length ? <div className="mt-6 space-y-5">{expenses.map((expense) => <div key={expense.name}><div className="mb-2 flex items-baseline justify-between gap-4 text-sm"><span className="text-ink-70">{expense.name}</span><span className="shrink-0 tabular-nums">{money(expense.amount)} · {formatPct(expense.share)}</span></div><div className="h-2.5 rounded-sm bg-executive-track"><div className="h-full rounded-sm bg-ink" style={{ width: `${maxExpense ? expense.amount / maxExpense * 100 : 0}%` }} /></div></div>)}</div> : <p className="mt-4 text-sm text-ink-50">Sin detalle de gastos disponible.</p>}</div>
        </TabsContent>
        <TabsContent value="impuestos" className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-3"><MetricCard label="Renta estimada a hoy" value={money(taxToday)} subtitle={profileResolution.profile ? profileResolution.profile === "persona_juridica_general" ? "30 % sobre la utilidad" : PROFILE_LABELS[profileResolution.profile] : "Pendiente de configuración"} /><MetricCard label="Ya adelantado / retenido" value={money(fiscal.totalCredits)} tone="gold" subtitle={advancedShare == null ? "Pendiente de configuración" : `${formatPct(advancedShare)} del impuesto a hoy`} /><MetricCard label="Saldo estimado por pagar" value={money(pendingToday)} tone="red" alert /></div>
          <div className="rounded-xl border border-executive-line bg-card p-5"><div className="flex items-center justify-between gap-4"><h2 className="text-sm font-semibold">Cobertura del impuesto</h2><span className="text-sm font-semibold tabular-nums text-gold">{advancedShare == null ? "Pendiente" : `${formatPct(advancedShare)} adelantado`}</span></div><div className="mt-4 h-3 overflow-hidden rounded-sm bg-executive-track"><div className="h-full bg-gold" style={{ width: `${Math.min(100, Math.max(0, (advancedShare ?? 0) * 100))}%` }} /></div><div className="mt-2 flex justify-between text-xs tabular-nums text-ink-50"><span>0 %</span><span>{advancedShare == null ? "—" : `${formatPct(advancedShare)} adelantado`}</span><span>100 %</span></div></div>
          <div className="grid gap-4 md:grid-cols-3"><MetricCard label="Proyección a diciembre" value={fiscal.configured ? money(fiscal.tax) : "Pendiente de configuración"} subtitle="Si el año sigue al mismo ritmo" /><MetricCard label="Reserva mensual recomendada" value={fiscal.configured ? money(fiscal.monthlyReserve) : "Pendiente de configuración"} /><MetricCard label="Retenciones disponibles" value={settings.data ? money(fiscal.withholdings) : "Pendiente"} /></div>
          <div className="flex justify-end">{controls}</div><div className="rounded-xl border border-executive-line bg-card px-5">{accordion}</div>
        </TabsContent>
      </Tabs>
      <footer className="mt-8 border-t border-executive-line pt-4 text-xs text-ink-50">Estimación con registros al cierre de {monthWord}; no sustituye la declaración D-101.</footer>
    </div>
  </section>;
};

const LegacyView = ({ companyName, fiscalYear, currencyLabel, projection, fiscal, expenses, money, controls, accordion }: { companyName: string; fiscalYear: number; currencyLabel: string; projection: YearProjection; fiscal: FiscalResult; expenses: ReturnType<typeof topExpenses>; money: (value: number | null | undefined) => string; controls: React.ReactNode; accordion: React.ReactNode }) => {
  const chartData = projection.months.map((month) => ({ label: month.label, ingresosReales: month.projected ? null : month.income, gastosReales: month.projected ? null : month.expenses, ingresosProyectados: month.projected ? month.income : null, gastosProyectados: month.projected ? month.expenses : null }));
  const insights = buildInsights(projection, fiscal, expenses, "");
  return <section className="dashboard-sans bg-paper"><header className="bg-ink px-6 py-8 md:px-10 md:py-10"><p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-gold">{companyName}</p><h1 className="mt-2 text-2xl font-semibold leading-tight text-primary-foreground md:text-[2rem]">Su situación financiera y fiscal {fiscalYear}</h1><div className="mt-3 h-[5px] w-24 border-y border-gold" /><p className="mt-3 text-sm text-primary-foreground/70">Información real acumulada a {projection.lastClosedLabel} de {fiscalYear} · Montos expresados en {currencyLabel}</p></header>
    <div className="space-y-12 px-6 py-10 md:px-10"><div className="grid gap-8 lg:grid-cols-[1.45fr_1fr]"><div className="grid gap-5 sm:grid-cols-3"><MetricCard label="Ingresos acumulados" value={money(projection.realIncome)} /><MetricCard label="Gastos acumulados" value={money(projection.realExpenses)} /><MetricCard label="Ganancia acumulada" value={money(projection.realProfit)} tone={projection.realProfit >= 0 ? "green" : "red"} /></div><div className="bg-ink p-7 text-primary-foreground"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Impuesto de renta proyectado pendiente</p><p className="mt-3 text-3xl font-semibold tabular-nums">{fiscal.configured ? money(Math.max(0, fiscal.pending)) : "Pendiente de configuración"}</p><p className="mt-4 border-t border-primary-foreground/15 pt-3 text-xs text-primary-foreground/60">Estimación informativa sujeta a revisión contable y fiscal.</p></div></div>
      <div><h2 className="text-lg font-semibold text-ink">Así va su año</h2><div className="mt-4 h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid vertical={false} stroke="hsl(var(--ink) / .08)" /><XAxis dataKey="label" tickLine={false} axisLine={false} /><YAxis width={105} tickLine={false} axisLine={false} tickFormatter={(value: number) => money(value)} /><Tooltip content={<MoneyTooltip />} /><Bar name="Ingresos" dataKey="ingresosReales" stackId="income" fill="hsl(var(--royal))" /><Bar name="Ingresos proyectados" dataKey="ingresosProyectados" stackId="income" fill="hsl(var(--royal) / .3)" /><Bar name="Gastos" dataKey="gastosReales" stackId="expense" fill="hsl(var(--gold))" /><Bar name="Gastos proyectados" dataKey="gastosProyectados" stackId="expense" fill="hsl(var(--gold) / .3)" /></BarChart></ResponsiveContainer></div></div>
      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]"><div><div className="flex items-center justify-between gap-4"><h2 className="text-lg font-semibold text-ink">Cómo se llega al impuesto pendiente</h2>{controls}</div><div className="mt-4"><WaterfallRow label={`Ingresos proyectados al 31/12/${fiscalYear}`} value={money(projection.projectedIncome)} /><WaterfallRow label={`Gastos proyectados al 31/12/${fiscalYear}`} value={money(-projection.projectedExpenses)} /><WaterfallRow label="Ganancia proyectada" value={money(projection.projectedProfit)} /><WaterfallRow label="Ajustes fiscales" value={money(fiscal.fiscalAdjustments)} kind="sub" /><WaterfallRow label="Renta neta imponible proyectada" value={money(fiscal.taxableBase)} /><WaterfallRow label="Impuesto estimado del período" value={fiscal.configured ? money(fiscal.tax) : "Pendiente de configuración"} /><WaterfallRow label="Anticipos de renta" value={money(-fiscal.advances)} kind="sub" /><WaterfallRow label="Retenciones acreditables de plataformas" value={money(-fiscal.withholdings)} kind="sub" /><WaterfallRow label="Otros créditos fiscales aplicables" value={money(-fiscal.otherCredits)} kind="sub" /><WaterfallRow label="Impuesto proyectado pendiente" value={fiscal.configured ? money(fiscal.pending) : "Pendiente de configuración"} kind="total" /></div><div className="mt-4">{accordion}</div></div><div><h2 className="text-lg font-semibold text-ink">¿Dónde se está yendo su dinero?</h2><div className="mt-4 space-y-4">{expenses.map((expense) => <div key={expense.name}><div className="flex justify-between gap-4 text-sm"><span>{cleanExpenseName(expense.name)}</span><span className="tabular-nums">{money(expense.amount)} · {formatPct(expense.share)}</span></div><div className="mt-1.5 h-2 bg-ink/5"><div className="h-full bg-royal" style={{ width: `${Math.max(1, expense.share * 100)}%` }} /></div></div>)}</div></div></div>
      <div className="border-t border-gold pt-6"><h2 className="text-lg font-semibold text-ink">Lo que debe saber este mes</h2><ul className="mt-3 space-y-2.5">{insights.map((text, index) => <li key={index} className="flex gap-3 text-sm leading-relaxed text-ink-70"><span className="mt-[0.45rem] h-px w-4 shrink-0 bg-gold" /><span>{text}</span></li>)}</ul></div>
    </div></section>;
};

export default ExecutiveOnePager;
