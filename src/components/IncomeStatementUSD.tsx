import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2, RefreshCw, DollarSign, ChevronDown, ChevronRight, Eye, EyeOff, Calendar, ListFilter,
} from "lucide-react";

interface ProcessedRow {
  name: string;
  monthlyValues: number[];
  total: number;
  type: string;
  level: number;
  children?: ProcessedRow[];
}

const formatUSD = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currencySign: 'accounting',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

// Último día del mes (YYYY-MM-DD)
const lastDayOfMonth = (year: number, month0: number): string => {
  const d = new Date(year, month0 + 1, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Normaliza nombres de cuenta: minúsculas, sin tildes, sin espacios extra.
const normalizeName = (s: string): string =>
  (s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');

const arraysClose = (a: number[], b: number[]): boolean => {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (Math.abs((a[i] || 0) - (b[i] || 0)) > 0.005) return false;
  }
  return true;
};

interface IncomeOverride {
  crcMonthly: number[];
  values: (number | null)[];
  fallback: boolean[];
}

// Fila del Estado de Resultados en dólares. Convierte cada mes con la tasa del
// mes correspondiente y calcula el total sumando los meses ya convertidos.
// Para la fila de total de Ingresos usa montos exactos por factura (incomeOverride).
const IncomeRowUSD = ({
  row,
  months,
  level = 0,
  visibleMonths,
  rates,
  incomeOverride,
  incomeAccountUSD,
}: {
  row: ProcessedRow;
  months: string[];
  level?: number;
  visibleMonths: boolean[];
  rates: (number | null)[];
  incomeOverride?: IncomeOverride | null;
  incomeAccountUSD?: Map<string, { values: (number | null)[]; present: boolean[] }>;
}) => {
  const [isOpen, setIsOpen] = useState(level < 2);
  const hasChildren = row.children && row.children.length > 0;
  const paddingLeft = `${level * 1.5}rem`;

  const isTotal = row.type === 'Summary' || row.type === 'TotalIncome' || row.type === 'TotalExpenses';
  const isSection = row.type === 'Section';

  // ¿Es la fila "Total para Ingresos"? La identificamos comparando sus valores
  // mensuales (en colones) con los del total de ingresos del reporte.
  const isIncomeTotal = !!(
    incomeOverride && isTotal && arraysClose(row.monthlyValues, incomeOverride.crcMonthly)
  );

  const rowClass = isTotal
    ? "bg-muted/50 font-bold border-t-2 border-t-primary"
    : isSection
    ? "font-semibold bg-muted/20"
    : "hover:bg-muted/10";

  // Cuenta de ingreso con detalle preciso por factura para este mes.
  const invoiceEntry = incomeAccountUSD?.get(normalizeName(row.name));

  const convert = (idx: number): number | null => {
    if (isIncomeTotal) return incomeOverride!.values[idx];
    // Subcuenta de ingreso: usar monto exacto por factura si existe para el mes.
    if (invoiceEntry && invoiceEntry.present[idx]) return invoiceEntry.values[idx];
    const rate = rates[idx] ?? null;
    if (!rate) return null;
    return row.monthlyValues[idx] / rate;
  };

  const anyMonthVisible = visibleMonths.some(v => v);
  const usdTotal = (() => {
    const idxs = months
      .map((_, i) => i)
      .filter((i) => (anyMonthVisible ? visibleMonths[i] : true));
    return idxs.reduce((sum, i) => {
      const c = convert(i);
      return sum + (c ?? 0);
    }, 0);
  })();

  if (!hasChildren) {
    return (
      <tr className={rowClass}>
        <td className="border border-border px-4 py-2 whitespace-nowrap" style={{ paddingLeft }}>
          {row.name}
        </td>
        {row.monthlyValues.map((_, idx) =>
          visibleMonths[idx] && (
            <td key={idx} className="border border-border px-4 py-2 text-right whitespace-nowrap min-w-[120px]">
              {convert(idx) === null ? '—' : (convert(idx) !== 0 ? formatUSD(convert(idx) as number) : '-')}
              {isIncomeTotal && incomeOverride!.fallback[idx] && convert(idx) !== null && (
                <span className="text-amber-600 ml-0.5" title="Ingreso agregado (P&L), sin detalle de facturas">*</span>
              )}
            </td>
          )
        )}
        <td className="border border-border px-4 py-2 text-right font-semibold whitespace-nowrap min-w-[120px] bg-muted/20">
          {formatUSD(usdTotal)}
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr className={rowClass}>
        <td className="border border-border px-4 py-2 whitespace-nowrap" style={{ paddingLeft }}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 hover:text-primary w-full text-left transition-colors"
          >
            {isOpen ? <ChevronDown className="h-4 w-4 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 flex-shrink-0" />}
            <span>{row.name}</span>
          </button>
        </td>
        {months.map((_, idx) =>
          visibleMonths[idx] && (
            <td key={idx} className="border border-border px-4 py-2 text-right whitespace-nowrap min-w-[120px]">
              {(rates[idx] ?? null) === null ? '—' : (convert(idx) !== 0 && convert(idx) !== null ? formatUSD(convert(idx) as number) : '-')}
            </td>
          )
        )}
        <td className="border border-border px-4 py-2 text-right font-semibold whitespace-nowrap min-w-[120px] bg-muted/20">
          {(isTotal || usdTotal !== 0) ? formatUSD(usdTotal) : '-'}
        </td>
      </tr>
      {isOpen && row.children!.map((child, idx) => (
        <IncomeRowUSD key={idx} row={child} months={months} level={level + 1} visibleMonths={visibleMonths} rates={rates} incomeOverride={incomeOverride} incomeAccountUSD={incomeAccountUSD} />
      ))}
    </>
  );
};


interface IncomeStatementUSDProps {
  companyId: string | null;
  isConnected?: boolean;
}

export function IncomeStatementUSD({ companyId }: IncomeStatementUSDProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { isStaff } = useUserRole();

  const [incomeData, setIncomeData] = useState<any>(null);
  const [loadingIncome, setLoadingIncome] = useState(false);
  const [visibleMonths, setVisibleMonths] = useState<boolean[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));

  const [rateMap, setRateMap] = useState<Record<string, number>>({});
  const [rateInputs, setRateInputs] = useState<Record<string, string>>({});
  const [savingRate, setSavingRate] = useState<string | null>(null);

  const [invoices, setInvoices] = useState<{ total_amount: number; currency: string | null; txn_date: string | null; raw_data: any }[]>([]);

  const texts = {
    es: {
      update: 'Actualizar', total: 'Total', income: 'Ingresos', expenses: 'Gastos',
      netIncome: 'Utilidad Neta', noData: 'No hay datos disponibles',
      incomeStatementUSD: 'Estado de Resultados (USD)',
    },
    en: {
      update: 'Update', total: 'Total', income: 'Income', expenses: 'Expenses',
      netIncome: 'Net Income', noData: 'No data available',
      incomeStatementUSD: 'Income Statement (USD)',
    },
  };
  const t = texts[language];

  const fetchRates = async () => {
    const { data, error } = await supabase.from('exchange_rates').select('rate_date, sell_rate');
    if (error) {
      console.error('Error loading exchange rates:', error);
      return;
    }
    const map: Record<string, number> = {};
    (data || []).forEach((r: any) => { map[r.rate_date] = Number(r.sell_rate); });
    setRateMap(map);
  };

  const fetchInvoices = async () => {
    if (!companyId) { setInvoices([]); return; }
    const { data, error } = await supabase
      .from('quickbooks_invoices')
      .select('total_amount, currency, txn_date, raw_data')
      .eq('company_id', companyId);
    if (error) {
      console.error('Error loading invoices:', error);
      setInvoices([]);
      return;
    }
    setInvoices((data || []).map((r: any) => ({
      total_amount: Number(r.total_amount) || 0,
      currency: r.currency ?? null,
      txn_date: r.txn_date ?? null,
      raw_data: r.raw_data ?? null,
    })));
  };

  const fetchIncome = async (year?: string) => {

    if (!companyId) return;
    const targetYear = year || selectedYear;
    try {
      setLoadingIncome(true);
      const { data, error } = await supabase.functions.invoke('quickbooks-income', {
        body: { companyId, year: targetYear }
      });
      if (error) throw error;
      setIncomeData(data);
      if (data?.months) {
        setVisibleMonths(new Array(data.months.length).fill(true));
      }
    } catch (error) {
      console.error('Error fetching income:', error);
    } finally {
      setLoadingIncome(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  useEffect(() => {
    if (companyId) { fetchIncome(); fetchInvoices(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const toggleAllMonths = (show: boolean) => {
    if (incomeData?.months) {
      setVisibleMonths(new Array(incomeData.months.length).fill(show));
    }
  };

  const toggleMonth = (idx: number) => {
    setVisibleMonths((prev) => {
      const len = incomeData?.months?.length || prev.length;
      const base = prev.length === len ? [...prev] : new Array(len).fill(true);
      base[idx] = !base[idx];
      return base;
    });
  };

  const visibleMonthCount = visibleMonths.filter(Boolean).length;

  // Máscara efectiva: si no hay ningún mes seleccionado, se consideran todos.
  const monthMask = useMemo<boolean[]>(() => {
    const len = incomeData?.months?.length || 0;
    if (!len) return [];
    const vm = visibleMonths.length === len ? visibleMonths : new Array(len).fill(true);
    return vm.some(Boolean) ? vm : new Array(len).fill(true);
  }, [visibleMonths, incomeData]);

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    fetchIncome(year);
  };

  const monthRateDates = useMemo<string[]>(() => {
    if (!incomeData?.months?.length) return [];
    let baseYear: number;
    let baseMonth: number;
    if (incomeData?.startDate) {
      const [y, m] = incomeData.startDate.split('-').map(Number);
      baseYear = y;
      baseMonth = m - 1; // 0-indexed
    } else {
      baseYear = new Date().getFullYear();
      baseMonth = 0;
    }
    return incomeData.months.map((_: string, idx: number) => {
      const d = new Date(baseYear, baseMonth + idx, 1);
      return lastDayOfMonth(d.getFullYear(), d.getMonth());
    });
  }, [incomeData]);

  // Tasas confirmadas (persistidas en la base de datos).
  const usdRates = useMemo<(number | null)[]>(
    () => monthRateDates.map((rd) => (rd in rateMap ? rateMap[rd] : null)),
    [monthRateDates, rateMap]
  );

  // Tasas efectivas para el cálculo de la tabla: superpone el valor tentativo
  // que el usuario está escribiendo (vista previa en vivo) sobre las guardadas.
  const previewRates = useMemo<(number | null)[]>(
    () =>
      monthRateDates.map((rd) => {
        const typed = parseFloat(rateInputs[rd]);
        if (rd in rateInputs && !isNaN(typed) && typed > 0) return typed;
        return rd in rateMap ? rateMap[rd] : null;
      }),
    [monthRateDates, rateMap, rateInputs]
  );

  // Claves "YYYY-MM" de cada columna mensual del reporte.
  const monthKeys = useMemo<string[]>(() => {
    if (!incomeData?.months?.length) return [];
    let baseYear: number;
    let baseMonth: number;
    if (incomeData?.startDate) {
      const [y, m] = incomeData.startDate.split('-').map(Number);
      baseYear = y;
      baseMonth = m - 1; // 0-indexed
    } else {
      baseYear = new Date().getFullYear();
      baseMonth = 0;
    }
    return incomeData.months.map((_: string, idx: number) => {
      const d = new Date(baseYear, baseMonth + idx, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
  }, [incomeData]);

  // Mapa PRECISO por cuenta de ingreso (NIIF/IAS 21): recorre las líneas de
  // factura (SalesItemLineDetail) agrupando por nombre de cuenta EXACTO y mes.
  // Valor mensual USD = líneas en USD (monto exacto) + líneas en colones ÷ tasa
  // de fin de ese mes. `present` marca si hubo alguna factura para esa cuenta/mes.
  const incomeAccountUSD = useMemo<Map<string, { values: (number | null)[]; present: boolean[] }>>(() => {
    const result = new Map<string, { values: (number | null)[]; present: boolean[] }>();
    if (!monthKeys.length) return result;

    const acc = new Map<string, { usd: number[]; crc: number[]; present: boolean[] }>();
    const ensure = (key: string) => {
      if (!acc.has(key)) {
        acc.set(key, {
          usd: new Array(monthKeys.length).fill(0),
          crc: new Array(monthKeys.length).fill(0),
          present: new Array(monthKeys.length).fill(false),
        });
      }
      return acc.get(key)!;
    };

    for (const inv of invoices) {
      if (!inv.txn_date) continue;
      const mi = monthKeys.findIndex((k) => inv.txn_date!.startsWith(k));
      if (mi < 0) continue;
      const lines = inv.raw_data?.Line;
      if (!Array.isArray(lines)) continue;
      for (const line of lines) {
        if (line?.DetailType !== 'SalesItemLineDetail') continue;
        const acctName = line?.SalesItemLineDetail?.ItemAccountRef?.name;
        if (!acctName) continue;
        const amt = Number(line.Amount) || 0;
        const e = ensure(normalizeName(acctName));
        e.present[mi] = true;
        if (inv.currency === 'USD') e.usd[mi] += amt;
        else e.crc[mi] += amt;
      }
    }

    for (const [key, e] of acc) {
      const values = monthKeys.map((_, idx) => {
        const rate = previewRates[idx] ?? null;
        if (e.crc[idx] > 0 && !rate) return null;
        return e.usd[idx] + (e.crc[idx] > 0 && rate ? e.crc[idx] / rate : 0);
      });
      result.set(key, { values, present: e.present });
    }

    return result;
  }, [invoices, monthKeys, previewRates]);

  // Hojas (subcuentas) de la sección de Ingresos, para sumar el total exacto.
  const incomeLeaves = useMemo<ProcessedRow[]>(() => {
    const secs: ProcessedRow[] = incomeData?.sections || [];
    const totalMonthly: number[] | undefined = incomeData?.totalIncome?.monthlyValues;
    if (!secs.length) return [];

    const collectLeaves = (row: ProcessedRow): ProcessedRow[] => {
      const children = (row.children || []).filter((c) => c.type !== 'Summary');
      if (children.length === 0) return row.type === 'Summary' ? [] : [row];
      return children.flatMap(collectLeaves);
    };

    // Identifica la sección de Ingresos por su resumen que coincide con totalIncome.
    let incomeSection: ProcessedRow | null = null;
    if (totalMonthly) {
      for (const s of secs) {
        const summary = (s.children || []).find((c) => c.type === 'Summary');
        if (summary && arraysClose(summary.monthlyValues, totalMonthly)) {
          incomeSection = s;
          break;
        }
      }
    }
    if (!incomeSection) incomeSection = secs[0] || null;
    return incomeSection ? collectLeaves(incomeSection) : [];
  }, [incomeData]);

  // Ingreso mensual PRECISO: SUMA de los valores YA MOSTRADOS de cada subcuenta
  // de ingreso (factura exacta si existe, o P&L÷tasa como fallback). Así el total
  // cuadra siempre con el detalle de subcuentas.
  const incomeUSD = useMemo<IncomeOverride | null>(() => {
    const crcMonthly: number[] = incomeData?.totalIncome?.monthlyValues || [];
    if (!crcMonthly.length) return null;

    const values: (number | null)[] = [];
    const fallback: boolean[] = [];

    monthKeys.forEach((_key, idx) => {
      const rate = previewRates[idx] ?? null;
      let sum = 0;
      let usedFallback = false;
      for (const leaf of incomeLeaves) {
        const entry = incomeAccountUSD.get(normalizeName(leaf.name));
        if (entry && entry.present[idx]) {
          sum += entry.values[idx] ?? 0;
        } else {
          usedFallback = true;
          if (rate) sum += (leaf.monthlyValues[idx] || 0) / rate;
        }
      }
      values.push(sum);
      fallback.push(usedFallback);
    });

    return { crcMonthly, values, fallback };
  }, [incomeData, incomeLeaves, incomeAccountUSD, monthKeys, previewRates]);


  const incomeUsdTotal = useMemo<number>(
    () => (incomeUSD ? incomeUSD.values.reduce((s, v, i) => s + (monthMask[i] ? (v ?? 0) : 0), 0) : 0),
    [incomeUSD, monthMask]
  );

  const hasFallbackMonths = useMemo<boolean>(
    () => !!incomeUSD && incomeUSD.fallback.some(Boolean),
    [incomeUSD]
  );

  const handleSaveRate = async (rateDate: string) => {
    const raw = rateInputs[rateDate];
    const value = parseFloat(raw);
    if (!raw || isNaN(value) || value <= 0) {
      toast.error(language === 'es' ? 'Ingresa un tipo de cambio válido' : 'Enter a valid exchange rate');
      return;
    }
    try {
      setSavingRate(rateDate);
      const { data, error } = await supabase
        .from('exchange_rates')
        .upsert(
          { rate_date: rateDate, sell_rate: value, updated_by: user?.id ?? null, updated_at: new Date().toISOString() },
          { onConflict: 'rate_date' }
        )
        .select()
        .single();
      if (error) throw error;
      const savedRate = data?.sell_rate != null ? Number(data.sell_rate) : value;
      setRateMap((prev) => ({ ...prev, [rateDate]: savedRate }));
      setRateInputs((prev) => { const n = { ...prev }; delete n[rateDate]; return n; });
      toast.success(language === 'es' ? 'Tipo de cambio guardado' : 'Exchange rate saved');
    } catch (err: any) {
      console.error('Error saving exchange rate:', err);
      const msg = err?.message || (language === 'es' ? 'Error al guardar el tipo de cambio' : 'Error saving exchange rate');
      toast.error(msg);
    } finally {
      setSavingRate(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div className="flex gap-2 items-center">
          <Select value={selectedYear} onValueChange={handleYearChange}>
            <SelectTrigger className="w-[120px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {incomeData?.months && (
            <div className="flex gap-1">
              <Button
                variant={visibleMonths.every(v => v) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleAllMonths(true)}
              >
                <Eye className="h-4 w-4 mr-1" />
                {language === 'es' ? 'Ver Todo' : 'Show All'}
              </Button>
              <Button
                variant={visibleMonths.every(v => !v) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleAllMonths(false)}
              >
                <EyeOff className="h-4 w-4 mr-1" />
                {language === 'es' ? 'Solo Total' : 'Total Only'}
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ListFilter className="h-4 w-4 mr-1" />
                    {language === 'es' ? 'Meses' : 'Months'}
                    {visibleMonthCount > 0 && visibleMonthCount < incomeData.months.length && (
                      <span className="ml-1 rounded bg-primary/15 px-1.5 text-xs font-semibold">
                        {visibleMonthCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  <div className="flex items-center justify-between px-1 pb-2 mb-1 border-b">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {language === 'es' ? 'Seleccionar meses' : 'Select months'}
                    </span>
                    <button
                      className="text-xs text-primary hover:underline"
                      onClick={() => toggleAllMonths(true)}
                    >
                      {language === 'es' ? 'Todos' : 'All'}
                    </button>
                  </div>
                  <div className="space-y-0.5 max-h-64 overflow-auto">
                    {incomeData.months.map((month: string, idx: number) => (
                      <label
                        key={idx}
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm"
                      >
                        <Checkbox
                          checked={visibleMonths[idx] ?? true}
                          onCheckedChange={() => toggleMonth(idx)}
                        />
                        <span>{month}</span>
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        <Button onClick={() => fetchIncome()} disabled={loadingIncome} variant="outline">
          {loadingIncome && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <RefreshCw className="mr-2 h-4 w-4" />
          {t.update}
        </Button>
      </div>

      {incomeData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {incomeData.totalIncome && (
              <Card>
                <CardHeader><CardTitle className="text-lg">{t.income}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">
                    {formatUSD(incomeUsdTotal)}
                  </p>
                  {hasFallbackMonths && (
                    <p className="text-xs text-amber-600 mt-1">
                      {language === 'es'
                        ? '* Algunos meses usan ingreso agregado (P&L) por falta de facturas sincronizadas'
                        : '* Some months use aggregated P&L income (invoices not yet synced)'}
                    </p>
                  )}
                </CardContent>
              </Card>

            )}
            {incomeData.totalExpenses && (
              <Card>
                <CardHeader><CardTitle className="text-lg">{t.expenses}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-600">
                    {formatUSD(Math.abs(incomeData.totalExpenses.monthlyValues.reduce((s: number, v: number, i: number) => s + (monthMask[i] && (previewRates[i] ?? null) ? v / (previewRates[i] as number) : 0), 0)))}
                  </p>
                </CardContent>
              </Card>
            )}
            {incomeData.netIncome && (
              <Card>
                <CardHeader><CardTitle className="text-lg">{t.netIncome}</CardTitle></CardHeader>
                <CardContent>
                  {(() => {
                    const net = incomeData.netIncome.monthlyValues.reduce((s: number, v: number, i: number) => s + (monthMask[i] && (previewRates[i] ?? null) ? v / (previewRates[i] as number) : 0), 0);
                    return (
                      <p className={`text-3xl font-bold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatUSD(net)}
                      </p>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </div>

          {incomeData.sections && incomeData.sections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{t.incomeStatementUSD} - {selectedYear}</span>
                  <Badge variant="secondary">USD</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-primary/10">
                        <th className="border border-border px-4 py-3 text-left font-bold sticky left-0 bg-primary/10 z-10">Cuenta</th>
                        {incomeData.months?.map((month: string, idx: number) =>
                          (visibleMonths[idx] ?? true) && (
                            <th key={idx} className="border border-border px-4 py-3 text-center font-bold whitespace-nowrap">
                              {month}
                            </th>
                          )
                        )}
                        <th className="border border-border px-4 py-3 text-center font-bold whitespace-nowrap bg-primary/20">
                          {t.total}
                        </th>
                      </tr>
                      {/* Exchange rate row */}
                      <tr className="bg-muted/40 text-xs">
                        <th className="border border-border px-4 py-2 text-left font-medium sticky left-0 bg-muted/40 z-10">
                          {language === 'es' ? 'Tipo de cambio (venta)' : 'Exchange rate (sell)'}
                        </th>
                        {incomeData.months?.map((_: string, idx: number) =>
                          (visibleMonths[idx] ?? true) && (
                            <th key={idx} className="border border-border px-2 py-2 text-center font-normal whitespace-nowrap">
                              {(usdRates[idx] ?? null) !== null ? (
                                <span className="font-mono">{usdRates[idx]!.toFixed(2)}</span>
                              ) : isStaff ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    className="h-7 w-20 text-xs"
                                    placeholder="₡/$"
                                    value={rateInputs[monthRateDates[idx]] ?? ''}
                                    onChange={(e) =>
                                      setRateInputs((prev) => ({ ...prev, [monthRateDates[idx]]: e.target.value }))
                                    }
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2"
                                    disabled={savingRate === monthRateDates[idx]}
                                    onClick={() => handleSaveRate(monthRateDates[idx])}
                                  >
                                    {savingRate === monthRateDates[idx]
                                      ? <Loader2 className="h-3 w-3 animate-spin" />
                                      : (language === 'es' ? 'Guardar' : 'Save')}
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">
                                  {language === 'es' ? 'Tipo de cambio pendiente' : 'Exchange rate pending'}
                                </span>
                              )}
                            </th>
                          )
                        )}
                        <th className="border border-border px-4 py-2 text-center bg-muted/40">—</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomeData.sections.map((section: ProcessedRow, idx: number) => (
                        <IncomeRowUSD
                          key={idx}
                          row={section}
                          months={incomeData.months}
                          visibleMonths={visibleMonths.length > 0 ? visibleMonths : new Array(incomeData.months?.length || 0).fill(true)}
                          rates={previewRates}
                          incomeOverride={incomeUSD}
                          incomeAccountUSD={incomeAccountUSD}
                        />

                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">{t.noData}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default IncomeStatementUSD;
