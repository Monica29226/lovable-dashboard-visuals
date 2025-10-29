import { useState, useEffect } from "react";
import { useLanguage, LanguageProvider } from "@/contexts/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft, FileText, RefreshCw, ChevronDown, Receipt, DollarSign, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Función para formatear valores monetarios en Colones
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 2
  }).format(value);
}

const QuickBooksAccountsPayableContent = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { selectedCompanyId } = useCompany();
  const [loading, setLoading] = useState(false);
  const [payableData, setPayableData] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const texts = {
    es: {
      title: 'Cuentas por Pagar',
      loading: 'Cargando datos...',
      backToHub: 'Volver al Hub',
      totalPayable: 'Total por Pagar',
      current: 'Corriente',
      overdue: 'Vencido',
      vendor: 'Proveedor',
      total: 'Total',
      details: 'Detalles por Proveedor',
      noData: 'No hay datos disponibles'
    },
    en: {
      title: 'Accounts Payable',
      loading: 'Loading data...',
      backToHub: 'Back to Hub',
      totalPayable: 'Total Payable',
      current: 'Current',
      overdue: 'Overdue',
      vendor: 'Vendor',
      total: 'Total',
      details: 'Details by Vendor',
      noData: 'No data available'
    }
  };

  const t = texts[language];

  const fetchPayable = async () => {
    if (!selectedCompanyId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('quickbooks-accounts-payable', {
        body: { companyId: selectedCompanyId }
      });
      
      if (error) throw error;
      setPayableData(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching payable:', error);
      toast.error(language === 'es' ? 'Error al cargar datos' : 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayable();
    
    // Auto-actualizar cada 30 segundos
    const interval = setInterval(() => {
      fetchPayable();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [selectedCompanyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <header className="bg-card rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/quickbooks-hub')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-primary mb-2">{t.title}</h1>
                <p className="text-muted-foreground">
                  {lastUpdate && `Última actualización: ${lastUpdate.toLocaleTimeString('es-CR')}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={fetchPayable}
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
              <Button variant="outline" size="sm" onClick={() => navigate('/quickbooks-income')}>
                <FileText className="h-4 w-4 mr-2" />
                Estado de Resultados
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/quickbooks-accounts-receivable')}>
                <DollarSign className="h-4 w-4 mr-2" />
                Cuentas por Cobrar
              </Button>
            </div>
          </CardContent>
        </Card>

        {payableData ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.totalPayable}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(payableData.total || 0)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.current}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(payableData.current || 0)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.overdue}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-600">
                    {formatCurrency(payableData.overdue || 0)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {payableData.vendors && payableData.vendors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t.details}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Collapsible defaultOpen>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between p-4 hover:bg-accent">
                        <span className="font-semibold">{t.details}</span>
                        <ChevronDown className="h-5 w-5" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
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
                              <TableCell className="text-right text-green-600">
                                {formatCurrency(vendor.current)}
                              </TableCell>
                              <TableCell className="text-right text-red-600">
                                {formatCurrency(vendor.overdue)}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatCurrency(vendor.total)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">{t.noData}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

const QuickBooksAccountsPayable = () => (
  <LanguageProvider>
    <QuickBooksAccountsPayableContent />
  </LanguageProvider>
);

export default QuickBooksAccountsPayable;
