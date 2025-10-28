import { useState, useEffect } from "react";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
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

const QuickBooksIncomeContent = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [incomeData, setIncomeData] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuth = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('quickbooks-auth');
      
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

  const fetchIncome = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('quickbooks-income');
      
      if (error) throw error;
      
      setIncomeData(data);
      toast.success('Estado de resultados cargado exitosamente');
    } catch (error) {
      console.error('Error fetching income:', error);
      toast.error('Error al cargar el estado de resultados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if authenticated
    const checkAuth = async () => {
      try {
        const { data } = await supabase.functions.invoke('quickbooks-check-auth');
        setIsAuthenticated(data?.authenticated || false);
        if (data?.authenticated) {
          fetchIncome();
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };
    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <header className="bg-card rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-primary">Estado de Resultados QuickBooks</h1>
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
                Para ver el estado de resultados, primero debes conectar tu cuenta de QuickBooks.
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
              <Button onClick={fetchIncome} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Actualizar Estado
              </Button>
            </div>

            {incomeData && (
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Ingresos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {incomeData.income?.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between py-2 border-b">
                        <span>{item.name}</span>
                        <span className="font-semibold">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 font-bold text-lg mt-4">
                      <span>Total Ingresos</span>
                      <span>{formatCurrency(incomeData.totalIncome)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Gastos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {incomeData.expenses?.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between py-2 border-b">
                        <span>{item.name}</span>
                        <span className="font-semibold">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 font-bold text-lg mt-4">
                      <span>Total Gastos</span>
                      <span>{formatCurrency(incomeData.totalExpenses)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-primary/5">
                  <CardHeader>
                    <CardTitle>Resultado Neto</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between py-2 font-bold text-2xl">
                      <span>Utilidad/Pérdida</span>
                      <span className={incomeData.netIncome >= 0 ? "text-green-600" : "text-red-600"}>
                        {formatCurrency(incomeData.netIncome)}
                      </span>
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

const QuickBooksIncome = () => {
  return (
    <LanguageProvider>
      <QuickBooksIncomeContent />
    </LanguageProvider>
  );
};

export default QuickBooksIncome;
