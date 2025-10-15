import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const QuickBooksConnect = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const clientId = import.meta.env.VITE_QUICKBOOKS_CLIENT_ID || '';
  const redirectUri = `${window.location.origin}/quickbooks-callback`;
  const realmId = '9341452542460825';

  const handleConnect = () => {
    setIsConnecting(true);
    
    const authUrl = new URL('https://appcenter.intuit.com/connect/oauth2');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('scope', 'com.intuit.quickbooks.accounting');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('state', Math.random().toString(36).substring(7));

    // Open in same window to allow callback
    window.location.href = authUrl.toString();
  };

  const handleSync = async () => {
    setIsSyncing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('quickbooks-sync', {
        body: {},
      });

      if (error) throw error;

      toast({
        title: "Sincronización completada",
        description: "Los datos de QuickBooks se han actualizado correctamente.",
      });
    } catch (error: any) {
      console.error('Sync error:', error);
      toast({
        title: "Error al sincronizar",
        description: error.message || "No se pudieron sincronizar los datos de QuickBooks.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conexión QuickBooks</CardTitle>
        <CardDescription>
          Conecta tu cuenta de QuickBooks para sincronizar automáticamente tus datos financieros
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button 
            onClick={handleConnect} 
            disabled={isConnecting}
            className="flex-1"
          >
            {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Conectar QuickBooks
          </Button>
          
          <Button 
            onClick={handleSync} 
            disabled={isSyncing}
            variant="outline"
            className="flex-1"
          >
            {isSyncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sincronizar Ahora
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Realm ID: {realmId}
        </p>
      </CardContent>
    </Card>
  );
};