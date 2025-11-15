import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, CheckCircle, XCircle, Clock, Database } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function QuickBooksSync() {
  const { selectedCompanyId, companies } = useCompany();
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  const { data: syncStatus, refetch } = useQuery({
    queryKey: ['sync-status', selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return null;

      const [balanceSheet, profitLoss, budgets] = await Promise.all([
        supabase
          .from('quickbooks_balance_sheet')
          .select('synced_at')
          .eq('company_id', selectedCompanyId)
          .order('synced_at', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('quickbooks_profit_loss')
          .select('synced_at')
          .eq('company_id', selectedCompanyId)
          .order('synced_at', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('quickbooks_budgets')
          .select('synced_at')
          .eq('company_id', selectedCompanyId)
          .order('synced_at', { ascending: false })
          .limit(1)
      ]);

      return {
        balanceSheet: balanceSheet.data?.synced_at || null,
        profitLoss: profitLoss.data?.synced_at || null,
        budgets: budgets.data?.[0]?.synced_at || null,
      };
    },
    enabled: !!selectedCompanyId,
  });

  const handleSyncAll = async () => {
    if (!selectedCompanyId || !selectedCompany) {
      toast({
        title: "Error",
        description: "No hay empresa seleccionada",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCompany.is_connected || !selectedCompany.realm_id) {
      toast({
        title: "Error",
        description: "La empresa no está conectada a QuickBooks. Por favor conéctala primero.",
        variant: "destructive",
      });
      return;
    }

    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('quickbooks-sync-all', {
        body: { companyId: selectedCompanyId }
      });

      if (error) throw error;

      const result = data.results[0];
      const successCount = [
        result.balanceSheet.success,
        result.profitLoss.success,
        result.budgets.success
      ].filter(Boolean).length;

      toast({
        title: "Sincronización completada",
        description: `${successCount} de 3 reportes sincronizados correctamente`,
      });

      refetch();
    } catch (error: any) {
      console.error('Sync error:', error);
      toast({
        title: "Error en sincronización",
        description: error.message || "No se pudo sincronizar con QuickBooks",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncIndividual = async (type: 'balance' | 'profit-loss' | 'budgets') => {
    if (!selectedCompanyId || !selectedCompany) return;

    if (!selectedCompany.is_connected || !selectedCompany.realm_id) {
      toast({
        title: "Error",
        description: "La empresa no está conectada a QuickBooks",
        variant: "destructive",
      });
      return;
    }

    setSyncing(true);
    try {
      const functionName = `quickbooks-sync-${type}`;
      const { error } = await supabase.functions.invoke(functionName, {
        body: { companyId: selectedCompanyId }
      });

      if (error) throw error;

      toast({
        title: "Sincronización completada",
        description: `Datos de ${type === 'balance' ? 'Balance' : type === 'profit-loss' ? 'Estado de Resultados' : 'Presupuestos'} sincronizados`,
      });

      refetch();
    } catch (error: any) {
      console.error('Sync error:', error);
      toast({
        title: "Error en sincronización",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca";
    return new Date(dateString).toLocaleString('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Sincronización QuickBooks</h1>
              <p className="text-muted-foreground mt-2">
                Gestiona la sincronización de datos desde QuickBooks
              </p>
            </div>
            {selectedCompany?.is_connected && selectedCompany?.realm_id && (
              <Button
                onClick={handleSyncAll}
                disabled={syncing}
                size="lg"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Sincronizar Todo
                  </>
                )}
              </Button>
            )}
          </div>

          {!selectedCompany?.is_connected || !selectedCompany?.realm_id ? (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-destructive" />
                  Empresa no conectada
                </CardTitle>
                <CardDescription>
                  La empresa {selectedCompany?.company_name} no está conectada a QuickBooks.
                  Por favor, conéctala desde la página de Configuración de Empresas.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Balance General</span>
                    {syncStatus?.balanceSheet ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </CardTitle>
                  <CardDescription>Estado de Posición Financiera</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Última sincronización:</span>
                  </div>
                  <p className="text-sm font-medium">
                    {formatDate(syncStatus?.balanceSheet || null)}
                  </p>
                  <Button
                    onClick={() => handleSyncIndividual('balance')}
                    disabled={syncing}
                    variant="outline"
                    className="w-full"
                  >
                    <Database className="mr-2 h-4 w-4" />
                    Sincronizar Balance
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Estado de Resultados</span>
                    {syncStatus?.profitLoss ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </CardTitle>
                  <CardDescription>Profit & Loss Statement</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Última sincronización:</span>
                  </div>
                  <p className="text-sm font-medium">
                    {formatDate(syncStatus?.profitLoss || null)}
                  </p>
                  <Button
                    onClick={() => handleSyncIndividual('profit-loss')}
                    disabled={syncing}
                    variant="outline"
                    className="w-full"
                  >
                    <Database className="mr-2 h-4 w-4" />
                    Sincronizar P&L
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Presupuestos</span>
                    {syncStatus?.budgets ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </CardTitle>
                  <CardDescription>Budgets de QuickBooks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Última sincronización:</span>
                  </div>
                  <p className="text-sm font-medium">
                    {formatDate(syncStatus?.budgets || null)}
                  </p>
                  <Button
                    onClick={() => handleSyncIndividual('budgets')}
                    disabled={syncing}
                    variant="outline"
                    className="w-full"
                  >
                    <Database className="mr-2 h-4 w-4" />
                    Sincronizar Budgets
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Sincronización Automática</CardTitle>
              <CardDescription>
                Los datos se sincronizan automáticamente todos los días a las 2:00 AM
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-2">
                  <Clock className="h-3 w-3" />
                  Programada: Diaria a las 2:00 AM
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
