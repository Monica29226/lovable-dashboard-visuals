/**
 * Vista ejecutiva de una sola página para profesionales independientes.
 * Reutiliza la Edge Function quickbooks-dashboard-data (año fiscal completo),
 * el motor de proyección de src/lib/executiveProjection.ts y la configuración
 * fiscal persistente (tax_brackets + tax_estimate_settings).
 * No hay cifras ni tramos hardcodeados en este componente.
 */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { SlidersHorizontal } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import {
  buildInsights, buildYearProjection, computeFiscal, currencySymbol,
  formatMoney, formatPct, topExpenses,
} from "@/lib/executiveProjection";
import {
  DEFAULT_TAXPAYER_PROFILE, creditsFromSettings, useFiscalSettings,
  useSaveFiscalCredits, useTaxBrackets,
} from "@/hooks/useExecutiveFiscal";

interface Props {
  companyId: string;
  companyName: string;
  isConnected: boolean;
  /** Año fiscal a proyectar. Por defecto el año en curso. */
  year?: number;
}

interface YearData {
  currency: string | null;
  connection: string;
  pnl: { status: string; expenseCategories: { name: string; amount: number | null }[] };
  monthly: { status: string; series: { label: string; income: number | null; expenses: number | null }[] };
}

const useYearData = (companyId: string, year: number, enabled: boolean) =>
  useQuery({
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

const Figure = ({ label, value, tone = "ink" }: { label: string; value: string; tone?: "ink" | "green" | "red" }) => (
  <div className="px-6 first:pl-0 last:pr-0">
    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-50">{label}</p>
    <p
      className={`mt-2 text-3xl xl:text-4xl font-semibold tabular-nums tracking-tight ${
        tone === "green" ? "text-[hsl(var(--green))]" : tone === "red" ? "text-[hsl(var(--red))]" : "text-ink"
      }`}
    >
      {value}
    </p>
  </div>
);

const WaterfallRow = ({
  label, value, kind = "normal",
}: { label: string; value: string; kind?: "normal" | "sub" | "total" }) => (
  <div
    className={`flex items-baseline justify-between gap-6 py-2.5 ${
      kind === "total" ? "border-t border-gold pt-3" : "border-b border-ink/10"
    }`}
  >
    <span className={`text-sm ${kind === "sub" ? "pl-4 text-ink-50" : "text-ink-70"}`}>{label}</span>
    <span className={`tabular-nums ${kind === "total" ? "text-base font-semibold text-ink" : "text-sm text-ink"}`}>
      {value}
    </span>
  </div>
);

export const ExecutiveOnePager = ({ companyId, companyName, isConnected, year }: Props) => {
  const fiscalYear = year ?? new Date().getFullYear();
  const fiscalPeriod = String(fiscalYear);

  const { data, isLoading } = useYearData(companyId, fiscalYear, isConnected);
  const brackets = useTaxBrackets(fiscalPeriod, DEFAULT_TAXPAYER_PROFILE);
  const settings = useFiscalSettings(companyId, fiscalPeriod);
  const save = useSaveFiscalCredits(companyId, fiscalPeriod);
  const { isStaff: canEdit } = useUserRole();

  const symbol = currencySymbol(data?.currency);
  const money = (v: number | null) => formatMoney(v, symbol);

  const projection = useMemo(
    () => buildYearProjection(data?.monthly?.series ?? [], fiscalYear),
    [data?.monthly?.series, fiscalYear],
  );

  const credits = useMemo(() => creditsFromSettings(settings.data), [settings.data]);
  const fiscal = useMemo(
    () => computeFiscal(projection, brackets.data ?? [], credits),
    [projection, brackets.data, credits],
  );
  const expenses = useMemo(
    () => topExpenses(data?.pnl?.expenseCategories ?? []),
    [data?.pnl?.expenseCategories],
  );
  const insights = useMemo(
    () => buildInsights(projection, fiscal, expenses, symbol),
    [projection, fiscal, expenses, symbol],
  );

  const chartData = useMemo(
    () => projection.months.map((m) => ({
      label: m.label,
      ingresosReales: m.projected ? null : m.income,
      gastosReales: m.projected ? null : m.expenses,
      ingresosProyectados: m.projected ? m.income : null,
      gastosProyectados: m.projected ? m.expenses : null,
    })),
    [projection.months],
  );

  const [form, setForm] = useState<null | {
    fiscalAdjustments: string; advances: string; withholdings: string; otherCredits: string; notes: string;
  }>(null);

  const openForm = () => setForm({
    fiscalAdjustments: String(credits.fiscalAdjustments ?? 0),
    advances: String(credits.advances ?? 0),
    withholdings: String(credits.withholdings ?? 0),
    otherCredits: String(credits.otherCredits ?? 0),
    notes: settings.data?.notes ?? "",
  });

  const submit = async () => {
    if (!form) return;
    const n = (v: string) => Number(String(v).replace(/[^\d.-]/g, "")) || 0;
    try {
      await save.mutateAsync({
        fiscalAdjustments: n(form.fiscalAdjustments),
        advances: n(form.advances),
        withholdings: n(form.withholdings),
        otherCredits: n(form.otherCredits),
        notes: form.notes || null,
      });
      setForm(null);
      toast({ title: "Datos fiscales actualizados", description: "El saldo pendiente se recalculó." });
    } catch (e) {
      toast({
        title: "No fue posible guardar",
        description: e instanceof Error ? e.message : "Intente de nuevo.",
        variant: "destructive",
      });
    }
  };

  if (!isConnected) return null;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const noData = !projection.hasRealData || data?.monthly?.status !== "ok";

  return (
    <section className="bg-paper">
      {/* ---------- Encabezado ---------- */}
      <header className="bg-ink px-6 py-8 md:px-10 md:py-10">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-gold">
          {companyName}
        </p>
        <h1 className="mt-2 text-2xl md:text-[2rem] font-semibold leading-tight text-white">
          Su situación financiera y fiscal {fiscalYear}
        </h1>
        <div className="mt-3 h-[5px] w-24 border-y border-gold" />
        <p className="mt-3 text-sm text-white/70">
          {projection.lastClosedLabel
            ? `Información real acumulada a ${projection.lastClosedLabel} de ${fiscalYear}`
            : `Sin meses cerrados con información en ${fiscalYear}`}
          {symbol === "₡" ? " · Montos expresados en colones" : symbol === "$" ? " · Montos expresados en dólares" : ""}
        </p>
      </header>

      {noData ? (
        <p className="px-6 py-10 text-sm text-ink-50 md:px-10">
          Aún no hay información mensual sincronizada para {fiscalYear}. La proyección se calculará
          automáticamente cuando exista al menos un mes cerrado.
        </p>
      ) : (
        <div className="space-y-12 px-6 py-10 md:px-10">
          {/* ---------- Resumen + impuesto protagonista ---------- */}
          <div className="grid gap-8 lg:grid-cols-[1.45fr_1fr] lg:items-stretch">
            <div className="flex flex-wrap items-start divide-x divide-ink/10 lg:flex-nowrap">
              <Figure label="Ingresos acumulados" value={money(projection.realIncome)} />
              <Figure label="Gastos acumulados" value={money(projection.realExpenses)} />
              <Figure
                label="Ganancia acumulada"
                value={money(projection.realProfit)}
                tone={projection.realProfit < 0 ? "red" : "green"}
              />
            </div>

            <div className="relative bg-ink px-7 py-7">
              <div className="absolute inset-x-4 top-3 h-[5px] border-y border-gold" />
              <p className="mt-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-gold">
                Impuesto de renta proyectado pendiente
              </p>
              {fiscal.configured ? (
                <>
                  <p className="mt-3 text-4xl xl:text-5xl font-semibold tabular-nums tracking-tight text-white">
                    {money(Math.max(0, fiscal.pending))}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-white/70">
                    {fiscal.pending > 0 && fiscal.remainingMonths > 0
                      ? `Reserva adicional recomendada: ${money(fiscal.monthlyReserve)} por mes durante los ${fiscal.remainingMonths} meses restantes.`
                      : fiscal.pending <= 0
                        ? `Con los créditos registrados quedaría un saldo a favor de ${money(Math.abs(fiscal.pending))}.`
                        : "Período fiscal completo: no quedan meses para distribuir la reserva."}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-3 text-2xl font-semibold text-white">Pendiente de configuración</p>
                  <p className="mt-3 text-xs leading-relaxed text-white/70">
                    No hay tramos vigentes para el período {fiscalPeriod} y el perfil de contribuyente
                    seleccionado. No se muestra una cifra estimada.
                  </p>
                </>
              )}
              <p className="mt-4 border-t border-white/15 pt-3 text-[0.68rem] leading-relaxed text-white/50">
                Estimación informativa sujeta a revisión contable y fiscal.
              </p>
            </div>
          </div>

          {/* ---------- Así va su año ---------- */}
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold text-ink">Así va su año</h2>
              <p className="text-xs text-ink-50">
                Barras sólidas: información real. Barras claras: proyección con el promedio mensual real.
              </p>
            </div>
            <div className="mt-4 h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="hsl(var(--ink) / 0.08)" />
                  <XAxis
                    dataKey="label" tickLine={false} axisLine={false}
                    tick={{ fontSize: 12, fill: "hsl(var(--ink-50))" }}
                  />
                  <YAxis
                    tickLine={false} axisLine={false} width={110}
                    tick={{ fontSize: 11, fill: "hsl(var(--ink-50))" }}
                    tickFormatter={(v: number) => formatMoney(v, symbol)}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [formatMoney(value, symbol), name]}
                    contentStyle={{
                      borderRadius: 4, border: "1px solid hsl(var(--ink) / 0.12)",
                      fontSize: 12, fontVariantNumeric: "tabular-nums",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar name="Ingresos" dataKey="ingresosReales" stackId="ing" fill="hsl(var(--royal))" />
                  <Bar name="Ingresos proyectados" dataKey="ingresosProyectados" stackId="ing" fill="hsl(var(--royal) / 0.3)" />
                  <Bar name="Gastos" dataKey="gastosReales" stackId="gas" fill="hsl(var(--gold))" />
                  <Bar name="Gastos proyectados" dataKey="gastosProyectados" stackId="gas" fill="hsl(var(--gold) / 0.3)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ---------- Bloque fiscal ---------- */}
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-lg font-semibold text-ink">Cómo se llega al impuesto pendiente</h2>
                {canEdit && (
                  <Dialog open={!!form} onOpenChange={(open) => (open ? openForm() : setForm(null))}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="rounded-sm border-gold text-ink">
                        <SlidersHorizontal className="mr-2 h-4 w-4" strokeWidth={1.4} />
                        Registrar anticipos y créditos
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Datos fiscales {fiscalPeriod}</DialogTitle>
                        <DialogDescription>
                          Registre los montos que no provienen automáticamente de la contabilidad. El
                          saldo pendiente se recalcula de inmediato.
                        </DialogDescription>
                      </DialogHeader>
                      {form && (
                        <div className="space-y-3">
                          {([
                            ["fiscalAdjustments", "Ajustes fiscales (+/−)"],
                            ["advances", "Anticipos de renta pagados"],
                            ["withholdings", "Retenciones acreditables de plataformas"],
                            ["otherCredits", "Otros créditos fiscales aplicables"],
                          ] as const).map(([key, label]) => (
                            <div key={key} className="space-y-1.5">
                              <Label htmlFor={key} className="text-xs">{label}</Label>
                              <Input
                                id={key} inputMode="decimal" className="rounded-sm tabular-nums"
                                value={form[key]}
                                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                              />
                            </div>
                          ))}
                          <div className="space-y-1.5">
                            <Label htmlFor="notes" className="text-xs">Notas</Label>
                            <Input
                              id="notes" className="rounded-sm" value={form.notes}
                              onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            />
                          </div>
                        </div>
                      )}
                      <DialogFooter>
                        <Button variant="ghost" onClick={() => setForm(null)}>Cancelar</Button>
                        <Button onClick={submit} disabled={save.isPending}>Guardar</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              <div className="mt-4">
                <WaterfallRow label={`Ingresos proyectados al 31/12/${fiscalYear}`} value={money(projection.projectedIncome)} />
                <WaterfallRow label={`Gastos proyectados al 31/12/${fiscalYear}`} value={money(-projection.projectedExpenses)} />
                <WaterfallRow label="Ganancia proyectada" value={money(projection.projectedProfit)} />
                <WaterfallRow label="Ajustes fiscales" value={money(fiscal.fiscalAdjustments)} kind="sub" />
                <WaterfallRow label="Renta neta imponible proyectada" value={money(fiscal.taxableBase)} />
                <WaterfallRow
                  label="Impuesto estimado del período"
                  value={fiscal.configured ? money(fiscal.tax) : "Pendiente de configuración"}
                />
                <WaterfallRow label="Anticipos de renta" value={money(-fiscal.advances)} kind="sub" />
                <WaterfallRow label="Retenciones acreditables de plataformas" value={money(-fiscal.withholdings)} kind="sub" />
                <WaterfallRow label="Otros créditos fiscales aplicables" value={money(-fiscal.otherCredits)} kind="sub" />
                <WaterfallRow
                  label="Impuesto proyectado pendiente"
                  value={fiscal.configured ? money(fiscal.pending) : "Pendiente de configuración"}
                  kind="total"
                />
              </div>

              <Accordion type="single" collapsible className="mt-4">
                <AccordionItem value="calculo" className="border-b-0">
                  <AccordionTrigger className="text-sm text-ink-70">Ver cómo se calculó</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-xs leading-relaxed text-ink-70">
                      Los meses cerrados se toman de la contabilidad sincronizada. Los meses restantes se
                      proyectan con el promedio mensual real del período
                      ({money(projection.monthlyAverageIncome)} de ingresos y {money(projection.monthlyAverageExpenses)} de
                      gastos por mes). Sobre la renta neta imponible proyectada se aplican los tramos
                      vigentes configurados para el período {fiscalPeriod}.
                    </p>
                    {brackets.data?.length ? (
                      <table className="mt-3 w-full text-xs tabular-nums">
                        <thead>
                          <tr className="border-b border-gold text-left text-[0.68rem] uppercase tracking-[0.14em] text-ink-50">
                            <th className="py-2 font-semibold">Tramo de renta imponible</th>
                            <th className="py-2 text-right font-semibold">Tarifa</th>
                          </tr>
                        </thead>
                        <tbody>
                          {brackets.data.map((b, i) => (
                            <tr key={b.id ?? i} className="border-b border-ink/10">
                              <td className="py-2 text-ink-70">
                                {b.upper_limit === null
                                  ? `Exceso sobre ${money(b.lower_limit)}`
                                  : b.lower_limit === 0
                                    ? `Hasta ${money(b.upper_limit)}`
                                    : `Exceso de ${money(b.lower_limit)} a ${money(b.upper_limit)}`}
                              </td>
                              <td className="py-2 text-right text-ink">{formatPct(b.rate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="mt-3 text-xs text-ink-50">
                        Sin tramos configurados para este período y perfil.
                      </p>
                    )}
                    {fiscal.effectiveRate !== null && (
                      <p className="mt-3 text-xs text-ink-50">
                        Tarifa efectiva estimada sobre la renta imponible: {formatPct(fiscal.effectiveRate)}.
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* ---------- Dónde se va el dinero ---------- */}
            <div>
              <h2 className="text-lg font-semibold text-ink">¿Dónde se está yendo su dinero?</h2>
              {expenses.length === 0 ? (
                <p className="mt-4 text-sm text-ink-50">Sin detalle de gastos disponible para {fiscalYear}.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {expenses.map((slice) => (
                    <div key={slice.name}>
                      <div className="flex items-baseline justify-between gap-4 text-sm">
                        <span className="text-ink-70">{slice.name}</span>
                        <span className="tabular-nums text-ink">
                          {money(slice.amount)} <span className="text-ink-50">· {formatPct(slice.share)}</span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 w-full bg-ink/5">
                        <div
                          className="h-2 bg-royal"
                          style={{ width: `${Math.max(1, slice.share * 100).toFixed(1)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ---------- Lo que debe saber ---------- */}
          <div className="border-t border-gold pt-6">
            <h2 className="text-lg font-semibold text-ink">Lo que debe saber este mes</h2>
            <ul className="mt-3 space-y-2.5">
              {insights.map((text, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink-70">
                  <span className="mt-[0.45rem] h-[1px] w-4 shrink-0 bg-gold" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
};

export default ExecutiveOnePager;
