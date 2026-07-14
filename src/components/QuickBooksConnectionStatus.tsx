import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";

interface ConnectionStatus {
  isConnected: boolean;
  authenticated?: boolean;
  realmId?: string;
  lastSync?: string;
  expiresAt?: string;
}

const QuickBooksConnectionStatus = () => {
  const { selectedCompanyId } = useCompany();
  const [status, setStatus] = useState<ConnectionStatus>({ isConnected: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!selectedCompanyId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const { data: companyData, error: companyError } = await supabase
          .from('quickbooks_companies')
          .select('realm_id, is_connected')
          .eq('id', selectedCompanyId)
          .maybeSingle();

        if (companyError) {
          console.error('Error fetching company status:', companyError);
        }

        const { data: tokenData, error: tokenError } = await supabase
          .from('quickbooks_tokens')
          .select('realm_id, token_expiry')
          .eq('company_id', selectedCompanyId)
          .maybeSingle();

        if (tokenError) {
          console.error('Error fetching QuickBooks token:', tokenError);
        }

        // Check last sync
        const { data: syncData } = await supabase
          .from('sync_logs')
          .select('created_at')
          .eq('realm_id', tokenData?.realm_id || companyData?.realm_id || '')
          .eq('status', 'success')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Check live auth (without mutating is_connected)
        let authenticated: boolean | undefined = undefined;
        try {
          const { data: authData } = await supabase.functions.invoke('quickbooks-check-auth', {
            body: { companyId: selectedCompanyId },
          });
          authenticated = !!authData?.authenticated;
        } catch (e) {
          console.error('check-auth failed:', e);
        }

        setStatus({
          isConnected: !!companyData?.is_connected && !!tokenData?.realm_id,
          authenticated,
          realmId: tokenData?.realm_id || companyData?.realm_id,
          expiresAt: tokenData?.token_expiry,
          lastSync: syncData?.created_at,
        });
      } catch (error) {
        console.error('Error fetching connection status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    // Set up realtime subscription for sync_logs
    const channel = supabase
      .channel('sync-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sync_logs',
        },
        () => {
          fetchStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCompanyId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estado de Conexión</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('es-CR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const isTokenExpiringSoon = () => {
    if (!status.expiresAt) return false;
    const expiresAt = new Date(status.expiresAt);
    const now = new Date();
    const hoursDiff = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 24;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Estado de Conexión
          {status.isConnected ? (
            status.authenticated === false ? (
              <Badge variant="outline" className="text-yellow-700 border-yellow-600">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Desconectado temporalmente
              </Badge>
            ) : (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Conectado
              </Badge>
            )
          ) : (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              Desconectado
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status.isConnected ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Realm ID</p>
                <p className="text-sm font-mono">{status.realmId || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Última Sincronización</p>
                <p className="text-sm">{formatDate(status.lastSync)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Token Expira</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm">{formatDate(status.expiresAt)}</p>
                  {isTokenExpiringSoon() && (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      <Clock className="h-3 w-3 mr-1" />
                      Próximo a expirar
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No hay conexión activa con QuickBooks. Usa el botón de abajo para conectar.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickBooksConnectionStatus;
