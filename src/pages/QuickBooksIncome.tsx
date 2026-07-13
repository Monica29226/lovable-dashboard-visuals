import { useState, useEffect, useMemo } from "react";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, RefreshCw, ArrowLeft, ChevronDown, ChevronRight, Receipt, DollarSign, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

type DisplayCurrency = 'CRC' | 'USD';

const formatCRC = (value: number): string => {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatUSD = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Último día del mes en formato YYYY-MM-DD
const lastDayOfMonth = (year: number, month0: number): string => {
  const d = new Date(year, month0 + 1, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

interface ProcessedRow {
  name: string;
  monthlyValues: number[];
  total: number;
  type: string;
  level: number;
  children?: ProcessedRow[];
}

interface CurrencyCtx {
  displayCurrency: DisplayCurrency;
  rates: (number | null)[]; // tasa por índice de mes (null = pendiente)
}

// Convierte un valor mensual (CRC) al valor a mostrar según moneda/tasa.
// Devuelve null cuando falta la tasa en modo USD (columna pendiente).
const convertCell = (crc: number, idx: number, ctx: CurrencyCtx): number | null => {
  if (ctx.displayCurrency === 'CRC') return crc;
  const rate = ctx.rates[idx] ?? null;
  if (!rate) return null;
  return crc / rate;
};

// Total por fila: en USD se suma cada mensual ya convertido (nunca dividir el total CRC entre una tasa).
const rowTotal = (row: ProcessedRow, ctx: CurrencyCtx): number => {
  if (ctx.displayCurrency === 'CRC') return row.total;
  return row.monthlyValues.reduce((acc, v, idx) => {
    const conv = convertCell(v, idx, ctx);
    return acc + (conv ?? 0);
  }, 0);
};

const fmt = (value: number, ctx: CurrencyCtx): string =>
  ctx.displayCurrency === 'USD' ? formatUSD(value) : formatCRC(value);

const IncomeRow = ({ row, months, ctx, level = 0 }: { row: ProcessedRow; months: string[]; ctx: CurrencyCtx; level?: number }) => {
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

  const renderCell = (value: number, idx: number) => {
    if (ctx.displayCurrency === 'USD' && (ctx.rates[idx] ?? null) === null) {
      return '—';
    }
    const conv = convertCell(value, idx, ctx);
    return conv !== null && conv !== 0 ? fmt(conv, ctx) : '-';
  };

  if (!hasChildren) {
    return (
      <tr className={rowClass}>
        <td className="border border-border px-4 py-2 whitespace-nowrap" style={{ paddingLeft }}>
          {row.name}
        </td>
        {row.monthlyValues.map((value, idx) => (
          <td key={idx} className="border border-border px-4 py-2 text-right whitespace-nowrap min-w-[120px]">
            {renderCell(value, idx)}
          </td>
        ))}
        <td className="border border-border px-4 py-2 text-right font-semibold whitespace-nowrap min-w-[120px] bg-muted/20">
          {fmt(rowTotal(row, ctx), ctx)}
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
        {months.map((_, idx) => (
          <td key={idx} className="border border-border px-4 py-2 text-right text-muted-foreground whitespace-nowrap min-w-[120px]">
            -
          </td>
        ))}
        <td className="border border-border px-4 py-2 text-right font-semibold whitespace-nowrap min-w-[120px] bg-muted/20">
          {isTotal ? fmt(rowTotal(row, ctx), ctx) : '-'}
        </td>
      </tr>
      {isOpen && row.children!.map((child, idx) => (
        <IncomeRow key={idx} row={child} months={months} ctx={ctx} level={level + 1} />
      ))}
    </>
  );
};

const QuickBooksIncomeContent = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { selectedCompanyId, companies } = useCompany();
  const { user } = useAuth();
  const { isStaff } = useUserRole();
  const [loading, setLoading] = useState(false);
  const [incomeData, setIncomeData] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('CRC');
  const [rateMap, setRateMap] = useState<Record<string, number>>({});
  const [rateInputs, setRateInputs] = useState<Record<string, string>>({});
  const [savingRate, setSavingRate] = useState<string | null>(null);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  const texts = {
    es: {
      title: 'Pérdidas y Ganancias por Mes',
      connectButton: 'Conectar QuickBooks',
      updateButton: 'Actualizar',
      income: 'Ingresos',
      expenses: 'Gastos',
      netIncome: 'Utilidad Neta',
      total: 'Total',
      account: 'Cuenta',
      noData: 'No hay datos disponibles',
      period: 'Período',
      pending: 'Tipo de cambio pendiente',
      save: 'Guardar'
    },
    en: {
      title: 'Profit and Loss by Month',
      connectButton: 'Connect QuickBooks',
      updateButton: 'Update',
      income: 'Income',
      expenses: 'Expenses',
      netIncome: 'Net Income',
      total: 'Total',
      account: 'Account',
      noData: 'No data available',
      period: 'Period',
      pending: 'Exchange rate pending',
      save: 'Save'
    }
  };

  const t = texts[language];

  // Fecha (YYYY-MM-DD) de fin de mes para cada columna, usando startDate como ancla.
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

  const rates = useMemo<(number | null)[]>(
    () => monthRateDates.map((rd) => (rd in rateMap ? rateMap[rd] : null)),
    [monthRateDates, rateMap]
  );

  const ctx: CurrencyCtx = { displayCurrency, rates };

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

  useEffect(() => {
    fetchRates();
  }, []);

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

  const handleAuth = async () => {
    if (!selectedCompanyId) {
      toast.error(language === 'es' ? 'Por favor selecciona una empresa' : 'Please select a company');
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('quickbooks-auth', {
        body: { companyId: selectedCompanyId }
      });

      if (error) throw error;

      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(language === 'es' ? 'Error al autenticar con QuickBooks' : 'Error authenticating with QuickBooks');
    } finally {
      setLoading(false);
    }
  };

  const fetchIncome = async () => {
    if (!selectedCompanyId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('quickbooks-income', {
        body: { companyId: selectedCompanyId }
      });

      if (error) throw error;

      console.log('Income data received:', data);
      setIncomeData(data);
      setLastUpdate(new Date());
      toast.success(language === 'es' ? 'Datos actualizados' : 'Data updated');
    } catch (error) {
      console.error('Error fetching income:', error);
      toast.error(language === 'es' ? 'Error al cargar datos' : 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedCompanyId) return;
    const checkAuth = async () => {
      try {
        const { data } = await supabase.functions.invoke('quickbooks-check-auth', {
          body: { companyId: selectedCompanyId }
        });
        setIsAuthenticated(data?.authenticated || false);
        if (data?.authenticated) {
          fetchIncome();
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };
    checkAuth();

    const interval = setInterval(() => {
      if (isAuthenticated) {
        fetchIncome();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [selectedCompanyId, isAuthenticated]);

  const CurrencyToggle = () => (
    <div className="flex items-center rounded-md border border-border overflow-hidden">
      <button
        onClick={() => setDisplayCurrency('CRC')}
        className={`px-3 py-1.5 text-sm font-medium transition-colors ${displayCurrency === 'CRC' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
      >
        ₡
      </button>
      <button
        onClick={() => setDisplayCurrency('USD')}
        className={`px-3 py-1.5 text-sm font-medium transition-colors ${displayCurrency === 'USD' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
      >
        $
      </button>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <header className="bg-card rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/quickbooks-hub')}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-primary mb-2">{t.title}</h1>
                  <p className="text-muted-foreground">{selectedCompany?.company_name || '-'}</p>
                </div>
              </div>
              <LanguageToggle />
            </div>
          </header>

          {/* Quick Navigation */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => navigate('/quickbooks-balance')}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Balance General
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/quickbooks-accounts-payable')}>
                  <Receipt className="h-4 w-4 mr-2" />
                  Cuentas por Pagar
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/quickbooks-accounts-receivable')}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Cuentas por Cobrar
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <header className="bg-card rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/quickbooks-hub')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-primary mb-2">{t.title}</h1>
                <p className="text-muted-foreground">
                  {selectedCompany?.company_name || '-'}
                  {incomeData?.startDate && incomeData?.endDate && (
                    <> • {t.period}: {incomeData.startDate} - {incomeData.endDate}</>
                  )}
                  {lastUpdate && <> • Actualizado: {lastUpdate.toLocaleTimeString('es-CR')}</>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CurrencyToggle />
              <Button
                variant="outline"
                size="icon"
                onClick={fetchIncome}
                disabled={loading}
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <LanguageToggle />
            </div>
          </div>
        </header>

        {/* Quick Navigation */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => navigate('/quickbooks-balance')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Balance General
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/quickbooks-accounts-payable')}>
                <Receipt className="h-4 w-4 mr-2" />
                Cuentas por Pagar
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/quickbooks-accounts-receivable')}>
                <DollarSign className="h-4 w-4 mr-2" />
                Cuentas por Cobrar
              </Button>
            </div>
          </CardContent>
        </Card>

        {incomeData ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {incomeData.totalIncome && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t.income}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-600">
                      {fmt(rowTotal(incomeData.totalIncome, ctx), ctx)}
                    </p>
                  </CardContent>
                </Card>
              )}

              {incomeData.totalExpenses && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t.expenses}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-red-600">
                      {fmt(Math.abs(rowTotal(incomeData.totalExpenses, ctx)), ctx)}
                    </p>
                  </CardContent>
                </Card>
              )}

              {incomeData.netIncome && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t.netIncome}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-3xl font-bold ${rowTotal(incomeData.netIncome, ctx) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {fmt(rowTotal(incomeData.netIncome, ctx), ctx)}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Reporte Detallado */}
            {incomeData.sections && incomeData.sections.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse table-fixed">
                      <colgroup>
                        <col style={{ width: '300px', minWidth: '250px' }} />
                        {incomeData.months?.map((_: string, idx: number) => (
                          <col key={idx} style={{ width: '120px', minWidth: '120px' }} />
                        ))}
                        <col style={{ width: '120px', minWidth: '120px' }} />
                      </colgroup>
                      <thead>
                        <tr className="bg-primary/10">
                          <th className="border border-border px-4 py-3 text-left font-bold sticky left-0 bg-primary/10 z-10">{t.account}</th>
                          {incomeData.months?.map((month: string, idx: number) => {
                            const monthNames: { [key: string]: string } = {
                              'jan': 'Enero', 'ene': 'Enero',
                              'feb': 'Febrero',
                              'mar': 'Marzo',
                              'apr': 'Abril', 'abr': 'Abril',
                              'may': 'Mayo',
                              'jun': 'Junio',
                              'jul': 'Julio',
                              'aug': 'Agosto', 'ago': 'Agosto',
                              'sep': 'Septiembre',
                              'oct': 'Octubre',
                              'nov': 'Noviembre',
                              'dec': 'Diciembre', 'dic': 'Diciembre'
                            };

                            const monthKey = month.toLowerCase().substring(0, 3);
                            const fullMonthName = monthNames[monthKey] || month;
                            const rateDate = monthRateDates[idx];
                            const missingRate = displayCurrency === 'USD' && (rates[idx] ?? null) === null;

                            return (
                              <th key={idx} className="border border-border px-4 py-3 text-center font-bold whitespace-nowrap bg-primary/10 align-top">
                                <div>{fullMonthName}</div>
                                {missingRate && (
                                  isStaff ? (
                                    <div className="mt-2 flex flex-col gap-1 font-normal">
                                      <Input
                                        type="number"
                                        step="0.0001"
                                        placeholder="T.C. venta"
                                        value={rateInputs[rateDate] ?? ''}
                                        onChange={(e) => setRateInputs((prev) => ({ ...prev, [rateDate]: e.target.value }))}
                                        className="h-7 text-xs"
                                      />
                                      <Button
                                        size="sm"
                                        className="h-6 text-xs"
                                        disabled={savingRate === rateDate}
                                        onClick={() => handleSaveRate(rateDate)}
                                      >
                                        {savingRate === rateDate ? <Loader2 className="h-3 w-3 animate-spin" /> : t.save}
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="mt-1 text-[10px] font-normal text-muted-foreground whitespace-normal">
                                      {t.pending}
                                    </div>
                                  )
                                )}
                              </th>
                            );
                          })}
                          <th className="border border-border px-4 py-3 text-center font-bold whitespace-nowrap bg-primary/20">
                            {t.total}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {incomeData.sections.map((section: ProcessedRow, idx: number) => (
                          <IncomeRow key={idx} row={section} months={incomeData.months} ctx={ctx} />
                        ))}

                        {/* Totales finales */}
                        {incomeData.totalIncome && (
                          <tr className="bg-green-100 dark:bg-green-900/20 font-bold border-t-4 border-t-primary">
                            <td className="border border-border px-4 py-3 sticky left-0 bg-green-100 dark:bg-green-900/20">
                              {incomeData.totalIncome.name || t.income}
                            </td>
                            {incomeData.totalIncome.monthlyValues.map((value: number, idx: number) => (
                              <td key={idx} className="border border-border px-4 py-3 text-right whitespace-nowrap">
                                {displayCurrency === 'USD' && (rates[idx] ?? null) === null
                                  ? '—'
                                  : fmt(convertCell(value, idx, ctx) ?? 0, ctx)}
                              </td>
                            ))}
                            <td className="border border-border px-4 py-3 text-right text-green-600 dark:text-green-400 whitespace-nowrap bg-green-200 dark:bg-green-900/40">
                              {fmt(rowTotal(incomeData.totalIncome, ctx), ctx)}
                            </td>
                          </tr>
                        )}

                        {incomeData.totalExpenses && (
                          <tr className="bg-red-100 dark:bg-red-900/20 font-bold">
                            <td className="border border-border px-4 py-3 sticky left-0 bg-red-100 dark:bg-red-900/20">
                              {incomeData.totalExpenses.name || t.expenses}
                            </td>
                            {incomeData.totalExpenses.monthlyValues.map((value: number, idx: number) => (
                              <td key={idx} className="border border-border px-4 py-3 text-right whitespace-nowrap">
                                {displayCurrency === 'USD' && (rates[idx] ?? null) === null
                                  ? '—'
                                  : fmt(convertCell(value, idx, ctx) ?? 0, ctx)}
                              </td>
                            ))}
                            <td className="border border-border px-4 py-3 text-right text-red-600 dark:text-red-400 whitespace-nowrap bg-red-200 dark:bg-red-900/40">
                              {fmt(rowTotal(incomeData.totalExpenses, ctx), ctx)}
                            </td>
                          </tr>
                        )}

                        {incomeData.netIncome && (
                          <tr className="bg-primary/30 font-bold text-lg border-t-4 border-t-primary">
                            <td className="border border-border px-4 py-4 sticky left-0 bg-primary/30">
                              {incomeData.netIncome.name || t.netIncome}
                            </td>
                            {incomeData.netIncome.monthlyValues.map((value: number, idx: number) => (
                              <td key={idx} className="border border-border px-4 py-4 text-right whitespace-nowrap">
                                {displayCurrency === 'USD' && (rates[idx] ?? null) === null
                                  ? '—'
                                  : fmt(convertCell(value, idx, ctx) ?? 0, ctx)}
                              </td>
                            ))}
                            <td className={`border border-border px-4 py-4 text-right whitespace-nowrap font-bold ${rowTotal(incomeData.netIncome, ctx) >= 0 ? 'text-green-600 dark:text-green-400 bg-green-200 dark:bg-green-900/40' : 'text-red-600 dark:text-red-400 bg-red-200 dark:bg-red-900/40'}`}>
                              {fmt(rowTotal(incomeData.netIncome, ctx), ctx)}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

const QuickBooksIncome = () => {
  return (
    <LanguageProvider>
      <QuickBooksIncomeContent />
    </LanguageProvider>
  );
};

export default QuickBooksIncome;
