import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";
import { format, endOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, ChevronDown, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BalanceItem {
  name: string;
  value: number;
  type: string;
  level: number;
  children?: BalanceItem[];
}

interface BalanceData {
  assets: BalanceItem[];
  liabilities: BalanceItem[];
  equity: BalanceItem[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  reportDate: string;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currencySign: 'accounting',
    currency: 'CRC',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Collapsible row component inspired by QuickBooks design
const BalanceItemRow = ({ item, depth = 0 }: { item: BalanceItem; depth?: number }) => {
  const [isOpen, setIsOpen] = useState(depth <= 1);
  const hasChildren = item.children && item.children.length > 0;
  const paddingLeft = depth * 20;

  const isTotal = item.type === 'Summary' || item.name.toLowerCase().includes('total');
  const isSection = item.type === 'Section';

  if (!hasChildren) {
    return (
      <div
        className={cn(
          "flex justify-between py-2 px-3 border-b border-border/50 hover:bg-accent/30 transition-colors",
          isTotal && "font-semibold bg-muted/50 border-t-2 border-primary/20"
        )}
        style={{ paddingLeft: `${paddingLeft + 12}px` }}
      >
        <span className={cn("text-sm", isTotal && "text-primary")}>{item.name}</span>
        <span className={cn("font-mono text-sm", isTotal && "text-primary font-bold")}>
          {formatCurrency(item.value)}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        className={cn(
          "flex items-center justify-between py-2 px-3 cursor-pointer hover:bg-accent/50 transition-colors border-b border-border/50",
          isSection && depth === 0 && "bg-muted/30 font-semibold",
          isTotal && "font-bold bg-muted/50"
        )}
        style={{ paddingLeft: `${paddingLeft + 12}px` }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {hasChildren && (
            isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className={cn("text-sm", isSection && "font-medium")}>{item.name}</span>
        </div>
        <span className={cn("font-mono text-sm", isSection && "font-semibold")}>
          {formatCurrency(item.value)}
        </span>
      </div>
      {isOpen && hasChildren && (
        <div>
          {item.children!.map((child, idx) => (
            <BalanceItemRow key={idx} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

// Quick date selector options
const getQuickDates = () => {
  const today = new Date();
  const dates = [];
  
  // Last day of current month
  dates.push({
    label: format(endOfMonth(today), "MMMM yyyy", { locale: es }),
    date: endOfMonth(today),
  });
  
  // Last 6 months
  for (let i = 1; i <= 6; i++) {
    const date = endOfMonth(subMonths(today, i));
    dates.push({
      label: format(date, "MMMM yyyy", { locale: es }),
      date,
    });
  }
  
  return dates;
};

export const BalanceSheet = () => {
  const { t } = useLanguage();
  const { selectedCompanyId, companies } = useCompany();
  const [selectedDate, setSelectedDate] = useState<Date>(endOfMonth(new Date()));
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);
  const quickDates = getQuickDates();

  // Check QuickBooks connection
  useEffect(() => {
    const checkConnection = async () => {
      if (!selectedCompanyId) return;
      
      try {
        const { data } = await supabase.functions.invoke('quickbooks-check-auth', {
          body: { companyId: selectedCompanyId }
        });
        setIsConnected(data?.authenticated || false);
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsConnected(false);
      }
    };
    
    checkConnection();
  }, [selectedCompanyId]);

  // Fetch balance data
  const fetchBalance = async () => {
    if (!selectedCompanyId || !isConnected) return;
    
    try {
      setLoading(true);
      const asOfDate = format(selectedDate, 'yyyy-MM-dd');
      
      const { data, error } = await supabase.functions.invoke('quickbooks-balance', {
        body: { 
          companyId: selectedCompanyId,
          asOfDate 
        }
      });

      if (error) throw error;
      
      setBalanceData(data);
    } catch (error) {
      console.error('Error fetching balance:', error);
      toast.error('Error al cargar el balance');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when date changes
  useEffect(() => {
    if (isConnected) {
      fetchBalance();
    }
  }, [selectedCompanyId, isConnected, selectedDate]);

  // Handle date selection from calendar
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Always use end of month for the selected date's month
      setSelectedDate(endOfMonth(date));
      setCalendarOpen(false);
    }
  };

  // If not connected, show connection message
  if (!isConnected) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            Balance General
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Conecta QuickBooks Online para ver el Balance General en tiempo real.
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/quickbooks'}>
              Ir a QuickBooks Online
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-foreground">
              Balance General
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedCompany?.company_name || 'Empresa'} • Valores en Colones (CRC)
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Date Selector */}
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal min-w-[200px]",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    <span>Al {format(selectedDate, "d 'de' MMMM yyyy", { locale: es })}</span>
                  ) : (
                    <span>Seleccionar fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="flex">
                  {/* Quick date options */}
                  <div className="border-r border-border p-2 space-y-1 min-w-[160px]">
                    <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                      Fechas rápidas
                    </p>
                    {quickDates.map((item, idx) => (
                      <Button
                        key={idx}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "w-full justify-start text-sm capitalize",
                          format(selectedDate, 'yyyy-MM') === format(item.date, 'yyyy-MM') && "bg-primary/10 text-primary"
                        )}
                        onClick={() => {
                          setSelectedDate(item.date);
                          setCalendarOpen(false);
                        }}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Calendar */}
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                    className="p-3 pointer-events-auto"
                    locale={es}
                  />
                </div>
              </PopoverContent>
            </Popover>

            {/* Refresh button */}
            <Button 
              variant="outline" 
              size="icon"
              onClick={fetchBalance}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {loading && !balanceData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : balanceData ? (
          <div className="space-y-6">
            {/* Assets Section */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="bg-primary/10 px-4 py-3 border-b border-border">
                <h3 className="font-bold text-lg text-primary">ACTIVOS</h3>
              </div>
              <div>
                {balanceData.assets.map((item, idx) => (
                  <BalanceItemRow key={idx} item={item} depth={0} />
                ))}
              </div>
              <div className="flex justify-between px-4 py-3 bg-primary/15 font-bold text-lg border-t-2 border-primary">
                <span className="text-primary">Total Activos</span>
                <span className="text-primary font-mono">{formatCurrency(balanceData.totalAssets)}</span>
              </div>
            </div>

            {/* Liabilities Section */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="bg-secondary/10 px-4 py-3 border-b border-border">
                <h3 className="font-bold text-lg text-secondary">PASIVOS</h3>
              </div>
              <div>
                {balanceData.liabilities.map((item, idx) => (
                  <BalanceItemRow key={idx} item={item} depth={0} />
                ))}
              </div>
              <div className="flex justify-between px-4 py-3 bg-secondary/15 font-bold text-lg border-t-2 border-secondary">
                <span className="text-secondary">Total Pasivos</span>
                <span className="text-secondary font-mono">{formatCurrency(balanceData.totalLiabilities)}</span>
              </div>
            </div>

            {/* Equity Section */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="bg-chart-4/10 px-4 py-3 border-b border-border">
                <h3 className="font-bold text-lg text-chart-4">PATRIMONIO</h3>
              </div>
              <div>
                {balanceData.equity.map((item, idx) => (
                  <BalanceItemRow key={idx} item={item} depth={0} />
                ))}
              </div>
              <div className="flex justify-between px-4 py-3 bg-chart-4/15 font-bold text-lg border-t-2 border-chart-4">
                <span className="text-chart-4">Total Patrimonio</span>
                <span className="text-chart-4 font-mono">{formatCurrency(balanceData.totalEquity)}</span>
              </div>
            </div>

            {/* Total Liabilities + Equity */}
            <div className="rounded-lg border-2 border-foreground/20 overflow-hidden">
              <div className="flex justify-between px-4 py-4 bg-muted font-bold text-xl">
                <span>TOTAL PASIVO + PATRIMONIO</span>
                <span className="font-mono">{formatCurrency(balanceData.totalLiabilities + balanceData.totalEquity)}</span>
              </div>
            </div>

            {/* Balance Check */}
            {Math.abs(balanceData.totalAssets - (balanceData.totalLiabilities + balanceData.totalEquity)) > 1 && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive font-medium">
                  ⚠️ El balance no cuadra. Diferencia: {formatCurrency(balanceData.totalAssets - (balanceData.totalLiabilities + balanceData.totalEquity))}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No hay datos disponibles para la fecha seleccionada.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
