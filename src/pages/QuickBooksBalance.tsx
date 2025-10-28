import { useState, useEffect } from "react";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const QuickBooksBalanceContent = () => {
  const { t } = useLanguage();
  const { selectedCompanyId, companies } = useCompany();
  const [loading, setLoading] = useState(false);
  const [balanceData, setBalanceData] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  const handleAuth = async () => {
    if (!selectedCompanyId) {
      toast.error('Por favor selecciona una empresa');
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
      toast.error('Error al autenticar con QuickBooks');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    if (!selectedCompanyId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('quickbooks-balance', {
        body: { companyId: selectedCompanyId }
      });
      
      if (error) throw error;
      
      setBalanceData(data);
      toast.success('Balance cargado exitosamente');
    } catch (error) {
      console.error('Error fetching balance:', error);
      toast.error('Error al cargar el balance');
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
          fetchBalance();
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };
    checkAuth();
  }, [selectedCompanyId]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <header className="bg-card rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-primary">
                Balance QuickBooks - {selectedCompany?.company_name || 'Selecciona empresa'}
              </h1>
              <p className="text-sm text-muted-foreground">Datos en Colones (CRC)</p>
            </div>
            <LanguageToggle />
          </div>
        </header>

        {!isAuthenticated ? (
          <Card>
            <CardHeader>
              <CardTitle>Conectar con QuickBooks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground">
                Para ver el balance, primero debes conectar tu cuenta de QuickBooks.
              </p>
              <Button onClick={handleAuth} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Conectar QuickBooks
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <Button onClick={fetchBalance} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Actualizar Balance
              </Button>
            </div>

            {balanceData && (
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Activos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {balanceData.assets?.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between py-2 border-b">
                        <span>{item.name}</span>
                        <span className="font-semibold">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 font-bold text-lg mt-4">
                      <span>Total Activos</span>
                      <span>{formatCurrency(balanceData.totalAssets)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Pasivos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {balanceData.liabilities?.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between py-2 border-b">
                        <span>{item.name}</span>
                        <span className="font-semibold">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 font-bold text-lg mt-4">
                      <span>Total Pasivos</span>
                      <span>{formatCurrency(balanceData.totalLiabilities)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Patrimonio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between py-2 font-bold text-lg">
                      <span>Total Patrimonio</span>
                      <span>{formatCurrency(balanceData.totalEquity)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const QuickBooksBalance = () => {
  return (
    <LanguageProvider>
      <QuickBooksBalanceContent />
    </LanguageProvider>
  );
};

export default QuickBooksBalance;
