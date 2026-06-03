import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { isHorizonte } from "@/lib/company";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Loader2, CheckCircle2, XCircle, Plug, RefreshCw, Clock, Database, 
  BarChart3, FileText, Receipt, DollarSign, ChevronDown, ChevronRight,
  Eye, EyeOff, Calendar, Filter
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Balance Sheet Item Component
interface BalanceItem {
  name: string;
  value: number;
  type: string;
  level: number;
  children?: BalanceItem[];
}

const BalanceItemRow = ({ item, depth = 0 }: { item: BalanceItem; depth?: number }) => {
  const [isOpen, setIsOpen] = useState(depth <= 2);
  const hasChildren = item.children && item.children.length > 0;
  const paddingLeft = `${depth * 24 + 8}px`;
  
  if (!hasChildren) {
    return (
      <div 
        className={`flex justify-between py-2 px-2 hover:bg-accent/50 rounded ${
          item.type === 'Summary' ? 'font-bold border-t-2 mt-2 pt-3 bg-accent/30' : ''
        }`}
        style={{ paddingLeft }}
      >
        <span>{item.name}</span>
        <span className="font-mono">{formatCurrency(item.value)}</span>
      </div>
    );
  }
  
  return (
    <div className="mb-1">
      <div 
        className={`flex items-center justify-between py-2 px-2 cursor-pointer hover:bg-accent rounded transition-colors ${
          item.type === 'Section' ? 'font-semibold' : ''
        } ${item.type === 'Summary' ? 'font-bold border-t-2 mt-2 pt-3 bg-accent/30' : ''}`}
        style={{ paddingLeft }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {hasChildren && (isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
          <span>{item.name}</span>
        </div>
        <span className="font-mono">{formatCurrency(item.value)}</span>
      </div>
      {isOpen && hasChildren && (
        <div className="ml-2">
          {item.children!.map((child, idx) => (
            <BalanceItemRow key={idx} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

// Income Statement Row Component
interface ProcessedRow {
  name: string;
  monthlyValues: number[];
  total: number;
  type: string;
  level: number;
  children?: ProcessedRow[];
}

const IncomeRow = ({ 
  row, 
  months, 
  level = 0, 
  visibleMonths 
}: { 
  row: ProcessedRow; 
  months: string[]; 
  level?: number;
  visibleMonths: boolean[];
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

  // Calculate visible total based on visible months
  // If no months are visible (Solo Total mode), show the full year total
  const anyMonthVisible = visibleMonths.some(v => v);
  const visibleTotal = anyMonthVisible 
    ? row.monthlyValues.reduce((sum, val, idx) => visibleMonths[idx] ? sum + val : sum, 0)
    : row.total;

  if (!hasChildren) {
    return (
      <tr className={rowClass}>
        <td className="border border-border px-4 py-2 whitespace-nowrap" style={{ paddingLeft }}>
          {row.name}
        </td>
        {row.monthlyValues.map((value, idx) => 
          visibleMonths[idx] && (
            <td key={idx} className="border border-border px-4 py-2 text-right whitespace-nowrap min-w-[120px]">
              {value !== 0 ? formatCurrency(value) : '-'}
            </td>
          )
        )}
        <td className="border border-border px-4 py-2 text-right font-semibold whitespace-nowrap min-w-[120px] bg-muted/20">
          {formatCurrency(visibleTotal)}
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
          {isTotal ? formatCurrency(visibleTotal) : '-'}
        </td>
      </tr>
      {isOpen && row.children!.map((child, idx) => (
        <IncomeRow key={idx} row={child} months={months} level={level + 1} visibleMonths={visibleMonths} />
      ))}
    </>
  );
};

const QuickBooksOnline = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { selectedCompanyId, companies, selectCompany, isLoading } = useCompany();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState("control");
  
  // Data states
  const [balanceData, setBalanceData] = useState<any>(null);
  const [incomeData, setIncomeData] = useState<any>(null);
  const [receivableData, setReceivableData] = useState<any>(null);
  const [payableData, setPayableData] = useState<any>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [loadingIncome, setLoadingIncome] = useState(false);
  const [loadingReceivable, setLoadingReceivable] = useState(false);
  const [loadingPayable, setLoadingPayable] = useState(false);
  
  // Income statement filter states
  const [visibleMonths, setVisibleMonths] = useState<boolean[]>([]);
  const [showMonthsSelector, setShowMonthsSelector] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("2025");

  const { data: syncStatus, refetch: refetchSync } = useQuery({
    queryKey: ['sync-status', selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return null;
      const [balanceSheet, profitLoss, budgets] = await Promise.all([
        supabase.from('quickbooks_balance_sheet').select('synced_at').eq('company_id', selectedCompanyId).order('synced_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('quickbooks_profit_loss').select('synced_at').eq('company_id', selectedCompanyId).order('synced_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('quickbooks_budgets').select('synced_at').eq('company_id', selectedCompanyId).order('synced_at', { ascending: false }).limit(1)
      ]);
      return {
        balanceSheet: balanceSheet.data?.synced_at || null,
        profitLoss: profitLoss.data?.synced_at || null,
        budgets: budgets.data?.[0]?.synced_at || null,
      };
    },
    enabled: !!selectedCompanyId && isAuthenticated,
  });

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  const texts = {
    es: {
      title: 'QuickBooks Online',
      subtitle: 'Horizonte Positivo',
      connected: 'Conectado',
      disconnected: 'Desconectado',
      connectButton: 'Conectar con QuickBooks',
      controlCenter: 'Centro de Control',
      balanceSheet: 'Balance General',
      incomeStatement: 'Estado de Resultados',
      accountsReceivable: 'Cuentas por Cobrar',
      accountsPayable: 'Cuentas por Pagar',
      lastSync: 'Última sincronización',
      never: 'Nunca',
      syncAll: 'Sincronizar Todo',
      syncing: 'Sincronizando...',
      connectionStatus: 'Estado de Conexión',
      company: 'Empresa',
      update: 'Actualizar',
      total: 'Total',
      current: 'Corriente',
      overdue: 'Vencido',
      customer: 'Cliente',
      vendor: 'Proveedor',
      totalReceivable: 'Total por Cobrar',
      totalPayable: 'Total por Pagar',
      income: 'Ingresos',
      expenses: 'Gastos',
      netIncome: 'Utilidad Neta',
      noData: 'No hay datos disponibles',
    },
    en: {
      title: 'QuickBooks Online',
      subtitle: 'Horizonte Positivo',
      connected: 'Connected',
      disconnected: 'Disconnected',
      connectButton: 'Connect to QuickBooks',
      controlCenter: 'Control Center',
      balanceSheet: 'Balance Sheet',
      incomeStatement: 'Income Statement',
      accountsReceivable: 'Accounts Receivable',
      accountsPayable: 'Accounts Payable',
      lastSync: 'Last sync',
      never: 'Never',
      syncAll: 'Sync All',
      syncing: 'Syncing...',
      connectionStatus: 'Connection Status',
      company: 'Company',
      update: 'Update',
      total: 'Total',
      current: 'Current',
      overdue: 'Overdue',
      customer: 'Customer',
      vendor: 'Vendor',
      totalReceivable: 'Total Receivable',
      totalPayable: 'Total Payable',
      income: 'Income',
      expenses: 'Expenses',
      netIncome: 'Net Income',
      noData: 'No data available',
    }
  };

  const t = texts[language];

  const handleAuth = async () => {
    const companyId = selectedCompanyId;
    if (!companyId) {
      toast.error(language === 'es' ? 'No hay empresa seleccionada' : 'No company selected');
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('quickbooks-auth', {
        body: { companyId }
      });
      
      if (error) throw error;
      
      if (data?.authUrl) {
        // Open in a new window to avoid iframe restrictions from QuickBooks OAuth
        // QuickBooks blocks OAuth in iframes with X-Frame-Options
        const authWindow = window.open(data.authUrl, '_blank', 'noopener,noreferrer');
        
        if (!authWindow) {
          // If popup was blocked, fallback to top-level navigation
          // This breaks out of the Lovable preview iframe
          if (window.top) {
            window.top.location.href = data.authUrl;
          } else {
            window.location.href = data.authUrl;
          }
        } else {
          toast.info(
            language === 'es' 
              ? 'Se abrió una ventana para conectar con QuickBooks. Completa la autorización y regresa aquí.' 
              : 'A window opened to connect with QuickBooks. Complete authorization and return here.',
            { duration: 10000 }
          );
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(language === 'es' ? 'Error al autenticar con QuickBooks' : 'Error authenticating with QuickBooks');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAll = async () => {
    if (!selectedCompanyId || !selectedCompany) {
      toast.error(language === 'es' ? 'No hay empresa seleccionada' : 'No company selected');
      return;
    }

    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('quickbooks-sync-all', {
        body: { companyId: selectedCompanyId }
      });

      if (error) throw error;

      toast.success(language === 'es' ? 'Sincronización completada' : 'Sync completed');
      refetchSync();
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error(language === 'es' ? 'Error en sincronización' : 'Sync error');
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return t.never;
    return new Date(dateString).toLocaleString(language === 'es' ? 'es-CR' : 'en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  // Fetch Balance Data
  const fetchBalance = async () => {
    if (!selectedCompanyId) return;
    try {
      setLoadingBalance(true);
      const { data, error } = await supabase.functions.invoke('quickbooks-balance', {
        body: { companyId: selectedCompanyId }
      });
      if (error) throw error;
      setBalanceData(data);
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setLoadingBalance(false);
    }
  };

  // Fetch Income Data
  const fetchIncome = async (year?: string) => {
    if (!selectedCompanyId) return;
    const targetYear = year || selectedYear;
    try {
      setLoadingIncome(true);
      const { data, error } = await supabase.functions.invoke('quickbooks-income', {
        body: { companyId: selectedCompanyId, year: targetYear }
      });
      if (error) throw error;
      setIncomeData(data);
      // Initialize all months as visible
      if (data?.months) {
        setVisibleMonths(new Array(data.months.length).fill(true));
      }
    } catch (error) {
      console.error('Error fetching income:', error);
    } finally {
      setLoadingIncome(false);
    }
  };

  // Toggle month visibility
  const toggleMonth = (idx: number) => {
    setVisibleMonths(prev => {
      const updated = [...prev];
      updated[idx] = !updated[idx];
      return updated;
    });
  };

  // Show/hide all months
  const toggleAllMonths = (show: boolean) => {
    if (incomeData?.months) {
      setVisibleMonths(new Array(incomeData.months.length).fill(show));
    }
  };

  // Handle year change
  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    fetchIncome(year);
  };

  // Fetch Accounts Receivable
  const fetchReceivable = async () => {
    if (!selectedCompanyId) return;
    try {
      setLoadingReceivable(true);
      const { data, error } = await supabase.functions.invoke('quickbooks-accounts-receivable', {
        body: { companyId: selectedCompanyId }
      });
      if (error) throw error;
      setReceivableData(data);
    } catch (error) {
      console.error('Error fetching receivable:', error);
    } finally {
      setLoadingReceivable(false);
    }
  };

  // Fetch Accounts Payable
  const fetchPayable = async () => {
    if (!selectedCompanyId) return;
    try {
      setLoadingPayable(true);
      const { data, error } = await supabase.functions.invoke('quickbooks-accounts-payable', {
        body: { companyId: selectedCompanyId }
      });
      if (error) throw error;
      setPayableData(data);
    } catch (error) {
      console.error('Error fetching payable:', error);
    } finally {
      setLoadingPayable(false);
    }
  };

  // Company selection is managed globally in CompanyContext; do not force a default here.


  // Listen for auth success from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'QUICKBOOKS_AUTH_SUCCESS') {
        toast.success(
          language === 'es' 
            ? `¡Conexión exitosa con ${event.data.companyName}!` 
            : `Successfully connected to ${event.data.companyName}!`
        );
        setIsAuthenticated(true);
        // Reload data
        fetchBalance();
        fetchIncome();
        fetchReceivable();
        fetchPayable();
        refetchSync();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [language]);

  useEffect(() => {
    if (!selectedCompanyId) return;

    const checkAuth = async (loadData = true) => {
      try {
        const { data } = await supabase.functions.invoke('quickbooks-check-auth', {
          body: { companyId: selectedCompanyId }
        });
        const authenticated = data?.authenticated || false;
        setIsAuthenticated(authenticated);
        
        if (authenticated && loadData) {
          // Load data for all tabs
          fetchBalance();
          fetchIncome();
          fetchReceivable();
          fetchPayable();
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsAuthenticated(false);
      }
    };
    
    // Initial auth check with data load
    checkAuth(true);
    
    // Check auth every 5 minutes to keep token fresh (proactive refresh)
    const intervalId = setInterval(() => {
      console.log('Periodic auth check - keeping QuickBooks connection alive');
      checkAuth(false); // Don't reload data on periodic checks
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(intervalId);
  }, [selectedCompanyId]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <header className="bg-card rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-primary">{t.title}</h1>
              <p className="text-muted-foreground">{t.subtitle}</p>
            </div>
            <Badge 
              variant={isAuthenticated ? 'default' : 'secondary'}
              className="text-base px-6 py-2 h-10"
            >
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  {t.connected}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  {t.disconnected}
                </div>
              )}
            </Badge>
          </div>
        </header>

        {!isAuthenticated ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle>{t.connectionStatus}</CardTitle>
              <CardDescription>
                {t.company}: {selectedCompany?.company_name || '-'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={handleAuth} disabled={loading} size="lg">
                {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                <Plug className="mr-2 h-5 w-5" />
                {t.connectButton}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-5 w-full max-w-4xl mx-auto">
              <TabsTrigger value="control" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span className="hidden sm:inline">{t.controlCenter}</span>
              </TabsTrigger>
              <TabsTrigger value="balance" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">{t.balanceSheet}</span>
              </TabsTrigger>
              <TabsTrigger value="income" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">{t.incomeStatement}</span>
              </TabsTrigger>
              <TabsTrigger value="receivable" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">{t.accountsReceivable}</span>
              </TabsTrigger>
              <TabsTrigger value="payable" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                <span className="hidden sm:inline">{t.accountsPayable}</span>
              </TabsTrigger>
            </TabsList>

            {/* Control Center Tab */}
            <TabsContent value="control" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      {t.balanceSheet}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t.lastSync}: {formatDate(syncStatus?.balanceSheet)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {t.incomeStatement}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t.lastSync}: {formatDate(syncStatus?.profitLoss)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Presupuestos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t.lastSync}: {formatDate(syncStatus?.budgets)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-center">
                <Button onClick={handleSyncAll} disabled={syncing} size="lg">
                  {syncing ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{t.syncing}</>
                  ) : (
                    <><RefreshCw className="mr-2 h-5 w-5" />{t.syncAll}</>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Balance Sheet Tab */}
            <TabsContent value="balance" className="space-y-6">
              <div className="flex justify-end">
                <Button onClick={fetchBalance} disabled={loadingBalance} variant="outline">
                  {loadingBalance && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t.update}
                </Button>
              </div>

              {balanceData ? (
                <div className="grid gap-6">
                  <Card>
                    <CardHeader><CardTitle className="text-2xl">Activos</CardTitle></CardHeader>
                    <CardContent>
                      {balanceData.assets?.map((item: BalanceItem, idx: number) => (
                        <BalanceItemRow key={idx} item={item} depth={0} />
                      ))}
                      <div className="flex justify-between py-4 font-bold text-xl mt-4 border-t-4 border-primary">
                        <span>Total Activos</span>
                        <span className="text-primary font-mono">{formatCurrency(balanceData.totalAssets)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-2xl">Pasivos</CardTitle></CardHeader>
                    <CardContent>
                      {balanceData.liabilities?.map((item: BalanceItem, idx: number) => (
                        <BalanceItemRow key={idx} item={item} depth={0} />
                      ))}
                      <div className="flex justify-between py-4 font-bold text-xl mt-4 border-t-4 border-primary">
                        <span>Total Pasivos</span>
                        <span className="text-primary font-mono">{formatCurrency(balanceData.totalLiabilities)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-2xl">Patrimonio</CardTitle></CardHeader>
                    <CardContent>
                      {balanceData.equity?.map((item: BalanceItem, idx: number) => (
                        <BalanceItemRow key={idx} item={item} depth={0} />
                      ))}
                      <div className="flex justify-between py-4 font-bold text-xl mt-4 border-t-4 border-primary">
                        <span>Total Patrimonio</span>
                        <span className="text-primary font-mono">{formatCurrency(balanceData.totalEquity)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-lg text-muted-foreground">{t.noData}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Income Statement Tab */}
            <TabsContent value="income" className="space-y-6">
              <div className="flex flex-wrap gap-4 justify-between items-center">
                <div className="flex gap-2 items-center">
                  {/* Year Selector */}
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

                  {/* Month Filter Popover */}
                  {incomeData?.months && incomeData.months.length > 0 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Filter className="h-4 w-4 mr-2" />
                          {language === 'es' ? 'Filtrar Meses' : 'Filter Months'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 bg-card" align="start">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">{language === 'es' ? 'Seleccionar Meses' : 'Select Months'}</h4>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => toggleAllMonths(true)}>
                                <Eye className="h-3 w-3 mr-1" />
                                {language === 'es' ? 'Todos' : 'All'}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => toggleAllMonths(false)}>
                                <EyeOff className="h-3 w-3 mr-1" />
                                {language === 'es' ? 'Ninguno' : 'None'}
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {incomeData.months.map((month: string, idx: number) => (
                              <div key={idx} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`month-${idx}`}
                                  checked={visibleMonths[idx] ?? true}
                                  onCheckedChange={() => toggleMonth(idx)}
                                />
                                <label
                                  htmlFor={`month-${idx}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                  {month.split(' ')[0]}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}

                  {/* Quick toggle buttons */}
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
                          <p className="text-3xl font-bold text-green-600">{formatCurrency(incomeData.totalIncome.total)}</p>
                        </CardContent>
                      </Card>
                    )}
                    {incomeData.totalExpenses && (
                      <Card>
                        <CardHeader><CardTitle className="text-lg">{t.expenses}</CardTitle></CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold text-red-600">{formatCurrency(Math.abs(incomeData.totalExpenses.total))}</p>
                        </CardContent>
                      </Card>
                    )}
                    {incomeData.netIncome && (
                      <Card>
                        <CardHeader><CardTitle className="text-lg">{t.netIncome}</CardTitle></CardHeader>
                        <CardContent>
                          <p className={`text-3xl font-bold ${incomeData.netIncome.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(incomeData.netIncome.total)}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {incomeData.sections && incomeData.sections.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{t.incomeStatement} - {selectedYear}</span>
                          <Badge variant="secondary">
                            {visibleMonths.filter(v => v).length} / {incomeData.months?.length || 0} {language === 'es' ? 'meses' : 'months'}
                          </Badge>
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
                            </thead>
                            <tbody>
                              {incomeData.sections.map((section: ProcessedRow, idx: number) => (
                                <IncomeRow 
                                  key={idx} 
                                  row={section} 
                                  months={incomeData.months} 
                                  visibleMonths={visibleMonths.length > 0 ? visibleMonths : new Array(incomeData.months?.length || 0).fill(true)}
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
                    <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-lg text-muted-foreground">{t.noData}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Accounts Receivable Tab */}
            <TabsContent value="receivable" className="space-y-6">
              <div className="flex justify-end">
                <Button onClick={fetchReceivable} disabled={loadingReceivable} variant="outline">
                  {loadingReceivable && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t.update}
                </Button>
              </div>

              {receivableData ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader><CardTitle className="text-lg">{t.totalReceivable}</CardTitle></CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-primary">{formatCurrency(receivableData.total || 0)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle className="text-lg">{t.current}</CardTitle></CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-green-600">{formatCurrency(receivableData.current || 0)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle className="text-lg">{t.overdue}</CardTitle></CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-red-600">{formatCurrency(receivableData.overdue || 0)}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {receivableData.customers && receivableData.customers.length > 0 && (
                    <Card>
                      <CardHeader><CardTitle>{t.customer}s</CardTitle></CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t.customer}</TableHead>
                              <TableHead className="text-right">{t.current}</TableHead>
                              <TableHead className="text-right">{t.overdue}</TableHead>
                              <TableHead className="text-right">{t.total}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {receivableData.customers.map((customer: any, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">{customer.name}</TableCell>
                                <TableCell className="text-right text-green-600">{formatCurrency(customer.current)}</TableCell>
                                <TableCell className="text-right text-red-600">{formatCurrency(customer.overdue)}</TableCell>
                                <TableCell className="text-right font-semibold">{formatCurrency(customer.total)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <DollarSign className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-lg text-muted-foreground">{t.noData}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Accounts Payable Tab */}
            <TabsContent value="payable" className="space-y-6">
              <div className="flex justify-end">
                <Button onClick={fetchPayable} disabled={loadingPayable} variant="outline">
                  {loadingPayable && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t.update}
                </Button>
              </div>

              {payableData ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader><CardTitle className="text-lg">{t.totalPayable}</CardTitle></CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-primary">{formatCurrency(payableData.total || 0)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle className="text-lg">{t.current}</CardTitle></CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-green-600">{formatCurrency(payableData.current || 0)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle className="text-lg">{t.overdue}</CardTitle></CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-red-600">{formatCurrency(payableData.overdue || 0)}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {payableData.vendors && payableData.vendors.length > 0 && (
                    <Card>
                      <CardHeader><CardTitle>{t.vendor}es</CardTitle></CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t.vendor}</TableHead>
                              <TableHead className="text-right">{t.current}</TableHead>
                              <TableHead className="text-right">{t.overdue}</TableHead>
                              <TableHead className="text-right">{t.total}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {payableData.vendors.map((vendor: any, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">{vendor.name}</TableCell>
                                <TableCell className="text-right text-green-600">{formatCurrency(vendor.current)}</TableCell>
                                <TableCell className="text-right text-red-600">{formatCurrency(vendor.overdue)}</TableCell>
                                <TableCell className="text-right font-semibold">{formatCurrency(vendor.total)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Receipt className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-lg text-muted-foreground">{t.noData}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

          </Tabs>
        )}
      </div>
    </div>
  );
};

export default QuickBooksOnline;
