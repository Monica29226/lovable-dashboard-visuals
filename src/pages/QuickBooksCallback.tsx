import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Settings } from "lucide-react";

const QuickBooksCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get all URL parameters for debugging
        const allParams = Object.fromEntries(searchParams.entries());
        
        const code = searchParams.get('code');
        const realmId = searchParams.get('realmId');
        const companyId = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        setDebugInfo({
          allParams,
          code: code ? 'presente' : 'falta',
          realmId: realmId || 'falta',
          companyId: companyId || 'falta',
          error: error || 'ninguno',
          errorDescription: errorDescription || 'ninguna'
        });

        // Check if QuickBooks returned an error
        if (error) {
          setStatus('error');
          setErrorMessage(`Error de QuickBooks: ${error} - ${errorDescription || 'Sin descripción'}`);
          return;
        }

        // Validate required parameters
        if (!code || !realmId || !companyId) {
          setStatus('error');
          setErrorMessage('Faltan parámetros requeridos en la URL de callback');
          return;
        }

        // Call the callback edge function
        const { data, error: callbackError } = await supabase.functions.invoke('quickbooks-callback', {
          body: { code, realmId, companyId }
        });

        if (callbackError) {
          setStatus('error');
          setErrorMessage(`Error al procesar callback: ${callbackError.message || 'Error desconocido'}`);
          return;
        }

        if (data?.error) {
          setStatus('error');
          setErrorMessage(`Error del servidor: ${data.error}`);
          return;
        }

        // Success!
        setStatus('success');
        setTimeout(() => {
          navigate('/quickbooks-hub');
        }, 2000);

      } catch (error) {
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Error desconocido');
        setDebugInfo({ ...debugInfo, catchError: String(error) });
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="text-center max-w-2xl">
        {status === 'loading' && (
          <>
            <h2 className="text-2xl font-semibold mb-4">Conectando con QuickBooks...</h2>
            <p className="text-muted-foreground">Por favor espera mientras procesamos tu autorización.</p>
          </>
        )}
        
        {status === 'error' && (
            <>
              <h2 className="text-2xl font-semibold mb-4 text-red-500">Error en la conexión</h2>
              <p className="text-muted-foreground mb-4 font-semibold">{errorMessage}</p>
              {debugInfo && (
                <div className="mt-4 p-4 bg-muted rounded-lg text-left overflow-auto max-h-96">
                  <p className="text-xs font-semibold mb-2">Información de Debug:</p>
                  <p className="font-mono text-xs whitespace-pre-wrap break-all">
                    {JSON.stringify(debugInfo, null, 2)}
                  </p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                <button
                  onClick={() => navigate('/quickbooks-hub')}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                >
                  Volver al Hub
                </button>
                <button
                  onClick={() => navigate('/quickbooks-debug')}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:opacity-90 flex items-center justify-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Ver Diagnóstico
                </button>
              </div>
            </>
        )}
        
        {status === 'success' && (
          <>
            <h2 className="text-2xl font-semibold mb-4 text-green-500">¡Conexión exitosa!</h2>
            <p className="text-muted-foreground">Redirigiendo...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default QuickBooksCallback;
