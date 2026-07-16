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
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

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

// Ajustes contables de la firma: asientos que NO deben dolarizarse (se mantienen
// en la vista en colones, pero se excluyen del cálculo USD). Enero 2026 tiene
// un asiento de ₡52,130,597.73 en "4006 Ingresos Gravables" que la contadora
// no dolariza.
const DOLARIZATION_EXCLUSIONS: { monthKey: string; accountMatch: string; amountCRC: number }[] = [
  { monthKey: '2026-01', accountMatch: 'ingresos gravables', amountCRC: 52130597.73 },
];

// Cuentas que NO se traducen a USD (diferencial cambiario en CRC no aplica
// en la reexpresión). Se ocultan de la tabla USD y se excluyen de los totales.
const EXCLUDED_ACCOUNTS_USD: string[] = ['ganancias o perdidas de cambio'];

const isExcludedAccount = (name: string): boolean => {
  const n = normalizeName(name);
  return EXCLUDED_ACCOUNTS_USD.some((m) => n.includes(m));
};

// Fila del Estado de Resultados en dólares. Conversión simple: valor CRC del
// mes ÷ tipo de cambio del mes. Sin tasa => "—".
const IncomeRowUSD = ({
  row,
  months,
  level = 0,
  visibleMonths,
  rates,
  adjustCRC,
  monthKeys,
  excludedRows,
}: {
  row: ProcessedRow;
  months: string[];
  level?: number;
  visibleMonths: boolean[];
  rates: (number | null)[];
  adjustCRC: (row: ProcessedRow, monthIdx: number, raw: number) => number;
  monthKeys: string[];
  excludedRows: Set<ProcessedRow>;
}) => {
  const [isOpen, setIsOpen] = useState(level < 2);
  if (excludedRows.has(row)) return null;
  const visibleChildren = (row.children || []).filter((c) => !excludedRows.has(c));
  const hasChildren = visibleChildren.length > 0;
  const paddingLeft = `${level * 1.5}rem`;

  const isTotal = row.type === 'Summary' || row.type === 'TotalIncome' || row.type === 'TotalExpenses';
  const isSection = row.type === 'Section';

  const rowClass = isTotal
    ? "bg-muted/50 font-bold border-t-2 border-t-primary"
    : isSection
    ? "font-semibold bg-muted/20"
    : "hover:bg-muted/10";

  const convert = (idx: number): number | null => {
    const rate = rates[idx] ?? null;
    if (!rate) return null;
    const raw = row.monthlyValues[idx] || 0;
    const adj = adjustCRC(row, idx, raw);
    return adj / rate;
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
      {isOpen && visibleChildren.map((child, idx) => (
        <IncomeRowUSD key={idx} row={child} months={months} level={level + 1} visibleMonths={visibleMonths} rates={rates} adjustCRC={adjustCRC} monthKeys={monthKeys} excludedRows={excludedRows} />
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
    if (companyId) { fetchIncome(); }
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
      baseMonth = m - 1;
    } else {
      baseYear = new Date().getFullYear();
      baseMonth = 0;
    }
    return incomeData.months.map((_: string, idx: number) => {
      const d = new Date(baseYear, baseMonth + idx, 1);
      return lastDayOfMonth(d.getFullYear(), d.getMonth());
    });
  }, [incomeData]);

  const usdRates = useMemo<(number | null)[]>(
    () => monthRateDates.map((rd) => (rd in rateMap ? rateMap[rd] : null)),
    [monthRateDates, rateMap]
  );

  const previewRates = useMemo<(number | null)[]>(
    () =>
      monthRateDates.map((rd) => {
        const typed = parseFloat(rateInputs[rd]);
        if (rd in rateInputs && !isNaN(typed) && typed > 0) return typed;
        return rd in rateMap ? rateMap[rd] : null;
      }),
    [monthRateDates, rateMap, rateInputs]
  );

  const monthKeys = useMemo<string[]>(() => {
    if (!incomeData?.months?.length) return [];
    let baseYear: number;
    let baseMonth: number;
    if (incomeData?.startDate) {
      const [y, m] = incomeData.startDate.split('-').map(Number);
      baseYear = y;
      baseMonth = m - 1;
    } else {
      baseYear = new Date().getFullYear();
      baseMonth = 0;
    }
    return incomeData.months.map((_: string, idx: number) => {
      const d = new Date(baseYear, baseMonth + idx, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
  }, [incomeData]);

  // Filas ocultas en la vista USD: solo las cuentas que no se traducen a
  // dólares (EXCLUDED_ACCOUNTS_USD). La utilidad neta se muestra normalmente.
  const excludedRows = useMemo<Set<ProcessedRow>>(() => {
    const set = new Set<ProcessedRow>();
    const walk = (r: ProcessedRow) => {
      if (isExcludedAccount(r.name)) set.add(r);
      (r.children || []).forEach(walk);
    };
    (incomeData?.sections || []).forEach((s: ProcessedRow) => walk(s));
    return set;
  }, [incomeData]);

  // CRC por mes de las cuentas excluidas (para ajustar totales/ancestros).
  const excludedAccountCRCByMonth = useMemo<number[]>(() => {
    const len = incomeData?.months?.length || 0;
    const out = new Array(len).fill(0);
    const walk = (r: ProcessedRow) => {
      if (isExcludedAccount(r.name)) {
        for (let i = 0; i < len; i++) out[i] += r.monthlyValues[i] || 0;
        return; // no recurrer para no doblar
      }
      (r.children || []).forEach(walk);
    };
    (incomeData?.sections || []).forEach((s: ProcessedRow) => walk(s));
    return out;
  }, [incomeData]);

  // Identifica filas afectadas por los distintos tipos de ajuste.
  const { exclusionAffected, excludedAncestors, totalExpensesRows, netIncomeMatchRows } = useMemo(() => {
    const exclusionAff = new Set<ProcessedRow>();
    const ancestors = new Set<ProcessedRow>();
    const totalExp = new Set<ProcessedRow>();
    const netMatch = new Set<ProcessedRow>();
    const totalIncomeMonthly: number[] | undefined = incomeData?.totalIncome?.monthlyValues;
    const netIncomeMonthly: number[] | undefined = incomeData?.netIncome?.monthlyValues;

    const walk = (r: ProcessedRow, ancs: ProcessedRow[]) => {
      const n = normalizeName(r.name);
      if (DOLARIZATION_EXCLUSIONS.some(e => n.includes(e.accountMatch))) {
        exclusionAff.add(r);
        ancs.forEach(a => exclusionAff.add(a));
      }
      if (r.type === 'TotalIncome') exclusionAff.add(r);
      if (totalIncomeMonthly && arraysClose(r.monthlyValues, totalIncomeMonthly)) exclusionAff.add(r);
      if (netIncomeMonthly && arraysClose(r.monthlyValues, netIncomeMonthly)) { netMatch.add(r); exclusionAff.add(r); }

      if (isExcludedAccount(r.name)) {
        ancs.forEach(a => ancestors.add(a));
      }
      if (r.type === 'TotalExpenses') totalExp.add(r);
      (r.children || []).forEach(c => walk(c, [...ancs, r]));
    };

    (incomeData?.sections || []).forEach((s: ProcessedRow) => walk(s, []));
    return { exclusionAffected: exclusionAff, excludedAncestors: ancestors, totalExpensesRows: totalExp, netIncomeMatchRows: netMatch };
  }, [incomeData]);

  const adjustCRC = useMemo(() => {
    return (row: ProcessedRow, monthIdx: number, raw: number): number => {
      if (raw === 0) return raw; // filas de título/celdas vacías no reciben ajustes
      let v = raw;
      // 1) Ajuste enero 2026 (ingresos gravables no dolarizables)
      if (exclusionAffected.has(row)) {
        const mk = monthKeys[monthIdx];
        for (const ex of DOLARIZATION_EXCLUSIONS) {
          if (mk === ex.monthKey) v -= ex.amountCRC;
        }
      }
      // 2) Cuentas excluidas del USD (diferencial cambiario): restar de
      //    ancestros y totales de gastos, sumar de vuelta en utilidad neta.
      const excl = excludedAccountCRCByMonth[monthIdx] || 0;
      if (excl !== 0) {
        if (excludedAncestors.has(row) || totalExpensesRows.has(row)) {
          v -= excl;
        }
        if (netIncomeMatchRows.has(row)) {
          v += excl;
        }
      }
      return v;
    };
  }, [exclusionAffected, excludedAncestors, totalExpensesRows, netIncomeMatchRows, monthKeys, excludedAccountCRCByMonth]);

  // Exclusión CRC total por mes (para tarjetas resumen de Ingresos y Neto).
  const exclusionCRCByMonth = useMemo<number[]>(() => {
    return monthKeys.map((mk) =>
      DOLARIZATION_EXCLUSIONS.filter(e => e.monthKey === mk).reduce((s, e) => s + e.amountCRC, 0)
    );
  }, [monthKeys]);

  // Ingresos USD (tarjeta): sumatoria de meses visibles con tasa, aplicando
  // la exclusión contable al total en colones antes de dividir.
  const incomeUsdTotal = useMemo<number>(() => {
    const crc: number[] = incomeData?.totalIncome?.monthlyValues || [];
    return crc.reduce((sum, v, i) => {
      const rate = previewRates[i] ?? null;
      if (!monthMask[i] || !rate) return sum;
      return sum + (v - (exclusionCRCByMonth[i] || 0)) / rate;
    }, 0);
  }, [incomeData, previewRates, monthMask, exclusionCRCByMonth]);

  const yearOptions = useMemo<string[]>(() => {
    const now = new Date().getFullYear();
    const set = new Set<string>(["2024", "2025", "2026", String(now), String(now + 1)]);
    return Array.from(set).sort();
  }, []);

  const chartData = useMemo(() => {
    if (!incomeData?.months?.length) return [];
    const months: string[] = incomeData.months;
    const totIncCrc: number[] = incomeData?.totalIncome?.monthlyValues || [];
    const totExpCrc: number[] = incomeData?.totalExpenses?.monthlyValues || [];
    const netCrc: number[] = incomeData?.netIncome?.monthlyValues || [];
    return months
      .map((m, i) => {
        const rate = previewRates[i] ?? null;
        if (!rate) return null;
        if (!(visibleMonths[i] ?? true)) return null;
        const excl = exclusionCRCByMonth[i] || 0;
        const exclAcc = excludedAccountCRCByMonth[i] || 0;
        const ingresos = ((totIncCrc[i] || 0) - excl) / rate;
        const gastos = Math.abs(((totExpCrc[i] || 0) - exclAcc) / rate);
        const neto = ((netCrc[i] || 0) - excl + exclAcc) / rate;
        return { month: m, ingresos, gastos, neto };
      })
      .filter((x): x is { month: string; ingresos: number; gastos: number; neto: number } => x !== null);
  }, [incomeData, previewRates, visibleMonths, exclusionCRCByMonth, excludedAccountCRCByMonth]);


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
                </CardContent>
              </Card>

            )}
            {incomeData.totalExpenses && (
              <Card>
                <CardHeader><CardTitle className="text-lg">{t.expenses}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-600">
                    {formatUSD(Math.abs(incomeData.totalExpenses.monthlyValues.reduce((s: number, v: number, i: number) => {
                      const rate = previewRates[i] ?? null;
                      if (!monthMask[i] || !rate) return s;
                      return s + (v - (excludedAccountCRCByMonth[i] || 0)) / rate;
                    }, 0)))}
                  </p>
                </CardContent>
              </Card>
            )}
            {incomeData.netIncome && (
              <Card>
                <CardHeader><CardTitle className="text-lg">{t.netIncome}</CardTitle></CardHeader>
                <CardContent>
                  {(() => {
                    const net = incomeData.netIncome.monthlyValues.reduce((s: number, v: number, i: number) => {
                      const rate = previewRates[i] ?? null;
                      if (!monthMask[i] || !rate) return s;
                      return s + (v - (exclusionCRCByMonth[i] || 0) + (excludedAccountCRCByMonth[i] || 0)) / rate;
                    }, 0);
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
                          adjustCRC={adjustCRC}
                          monthKeys={monthKeys}
                          excludedRows={excludedRows}
                        />

                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{language === 'es' ? 'Evolución mensual (USD)' : 'Monthly evolution (USD)'}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => formatUSD(v)} width={100} />
                    <Tooltip
                      formatter={(value: number) => formatUSD(value)}
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Bar dataKey="ingresos" name={t.income} fill="hsl(var(--chart-1))" />
                    <Bar dataKey="gastos" name={t.expenses} fill="hsl(var(--chart-2))" />
                    <Line type="monotone" dataKey="neto" name={t.netIncome} stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
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
