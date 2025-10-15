import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const QuickBooksCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        toast({
          title: "Error de conexión",
          description: `No se pudo conectar con QuickBooks: ${error}`,
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      if (!code) {
        toast({
          title: "Error",
          description: "No se recibió el código de autorización",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      try {
        const redirectUri = `${window.location.origin}/quickbooks-callback`;
        
        const { data, error: functionError } = await supabase.functions.invoke('quickbooks-oauth', {
          body: { code, redirectUri },
        });

        if (functionError) throw functionError;

        toast({
          title: "¡Conexión exitosa!",
          description: "QuickBooks se ha conectado correctamente. Los datos se sincronizarán automáticamente.",
        });

        // Start initial sync
        await supabase.functions.invoke('quickbooks-sync', { body: {} });

        navigate('/');
      } catch (error: any) {
        console.error('OAuth callback error:', error);
        toast({
          title: "Error al conectar",
          description: error.message || "No se pudo completar la conexión con QuickBooks",
          variant: "destructive",
        });
        navigate('/');
      }
    };

    handleCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="text-lg">Conectando con QuickBooks...</p>
      </div>
    </div>
  );
};

export default QuickBooksCallback;