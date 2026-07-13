import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2, RefreshCw, DollarSign, ChevronDown, ChevronRight, Eye, EyeOff, Calendar,
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

// Fila del Estado de Resultados en dólares. Convierte cada mes con la tasa del
// mes correspondiente y calcula el total sumando los meses ya convertidos.
const IncomeRowUSD = ({
  row,
  months,
  level = 0,
  visibleMonths,
  rates,
}: {
  row: ProcessedRow;
  months: string[];
  level?: number;
  visibleMonths: boolean[];
  rates: (number | null)[];
}) => {
  const [isOpen, setIsOpen] = useState(level < 2);
  const hasChildren = row.children && row.children.length > 0;
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
              {(rates[idx] ?? null) === null ? '—' : (convert(idx) !== 0 ? formatUSD(convert(idx) as number) : '-')}
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
            <td key={idx} className="border border-border px-4 py-2 text-right text-muted-foreground whitespace-nowrap min-w-[120px]">
              -
            </td>
          )
        )}
        <td className="border border-border px-4 py-2 text-right font-semibold whitespace-nowrap min-w-[120px] bg-muted/20">
          {isTotal ? formatUSD(usdTotal) : '-'}
        </td>
      </tr>
      {isOpen && row.children!.map((child, idx) => (
        <IncomeRowUSD key={idx} row={child} months={months} level={level + 1} visibleMonths={visibleMonths} rates={rates} />
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
  const [selectedYear, setSelectedYear] = useState<string>("2025");

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
    if (companyId) fetchIncome();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const toggleAllMonths = (show: boolean) => {
    if (incomeData?.months) {
      setVisibleMonths(new Array(incomeData.months.length).fill(show));
    }
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    fetchIncome(year);
  };

  const monthRateDates = useMemo<string[]>(() => {
    if (!incomeData?.months?.length) return [];
    const start = incomeData?.startDate ? new Date(incomeData.startDate) : null;
    const baseYear = start ? start.getFullYear() : new Date().getFullYear();
    const baseMonth = start ? start.getMonth() : 0;
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

  const handleSaveRate = async (rateDate: string) => {
    const raw = rateInputs[rateDate];
    const value = parseFloat(raw);
    if (!raw || isNaN(value) || value <= 0) {
      toast.error(language === 'es' ? 'Ingresa un tipo de cambio válido' : 'Enter a valid exchange rate');
      return;
    }
    try {
      setSavingRate(rateDate);
      const { error } = await supabase
        .from('exchange_rates')
        .upsert(
          { rate_date: rateDate, sell_rate: value, updated_by: user?.id ?? null, updated_at: new Date().toISOString() },
          { onConflict: 'rate_date' }
        );
      if (error) throw error;
      setRateMap((prev) => ({ ...prev, [rateDate]: value }));
      setRateInputs((prev) => { const n = { ...prev }; delete n[rateDate]; return n; });
      toast.success(language === 'es' ? 'Tipo de cambio guardado' : 'Exchange rate saved');
    } catch (err) {
      console.error('Error saving exchange rate:', err);
      toast.error(language === 'es' ? 'Error al guardar el tipo de cambio' : 'Error saving exchange rate');
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
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
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
                    {formatUSD(incomeData.totalIncome.monthlyValues.reduce((s: number, v: number, i: number) => s + ((usdRates[i] ?? null) ? v / (usdRates[i] as number) : 0), 0))}
                  </p>
                </CardContent>
              </Card>
            )}
            {incomeData.totalExpenses && (
              <Card>
                <CardHeader><CardTitle className="text-lg">{t.expenses}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-600">
                    {formatUSD(Math.abs(incomeData.totalExpenses.monthlyValues.reduce((s: number, v: number, i: number) => s + ((usdRates[i] ?? null) ? v / (usdRates[i] as number) : 0), 0)))}
                  </p>
                </CardContent>
              </Card>
            )}
            {incomeData.netIncome && (
              <Card>
                <CardHeader><CardTitle className="text-lg">{t.netIncome}</CardTitle></CardHeader>
                <CardContent>
                  {(() => {
                    const net = incomeData.netIncome.monthlyValues.reduce((s: number, v: number, i: number) => s + ((usdRates[i] ?? null) ? v / (usdRates[i] as number) : 0), 0);
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
                          rates={usdRates}
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
