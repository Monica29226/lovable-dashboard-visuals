import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Settings } from "lucide-react";

const QuickBooksCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get all URL parameters for debugging
        const allParams = Object.fromEntries(searchParams.entries());
        
        const code = searchParams.get('code');
        const realmId = searchParams.get('realmId');
        const companyId = searchParams.get('state'); // companyId is passed as state in OAuth flow
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
          setErrorMessage('Faltan parámetros requeridos en la URL de callback (code, realmId o companyId)');
          return;
        }

        // NOTE: Do NOT require supabase.auth.getUser() here. This popup/public
        // callback window may not carry a normal UI session. The edge function
        // handles the secure token exchange using companyId + realmId.

        console.log('Calling quickbooks-callback edge function...');

        // Call the secure edge function to handle token exchange
        const { data, error: callbackError } = await supabase.functions.invoke('quickbooks-callback', {
          body: {
            code,
            realmId,
            companyId
          }
        });

        if (callbackError) {
          console.error('Callback error:', callbackError);
          setStatus('error');
          setErrorMessage(`Error al conectar: ${callbackError.message}`);
          return;
        }

        if (!data.success) {
          console.error('Callback failed:', data);
          setStatus('error');
          setErrorMessage(data.error || 'Error desconocido al procesar la conexión');
          return;
        }

        console.log('QuickBooks connection successful!');

        // Success!
        setCompanyName(data.companyName || 'QuickBooks');
        setStatus('success');

        // Communicate success to the main screen via localStorage (no window.opener dependency)
        try {
          localStorage.setItem('quickbooks_auth_result', JSON.stringify({
            success: true,
            companyName: data.companyName || 'QuickBooks',
            companyId,
            realmId,
            timestamp: Date.now(),
          }));
        } catch (e) {
          console.error('Could not write quickbooks_auth_result to localStorage', e);
        }

        // Close the popup if possible, otherwise redirect
        setTimeout(() => {
          try {
            window.close();
          } catch (e) {
            // ignore
          }
          navigate('/quickbooks');
        }, 2000);

      } catch (error) {
        console.error('Callback exception:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Error desconocido');
        setDebugInfo({ ...debugInfo, catchError: String(error) });
        try {
          localStorage.setItem('quickbooks_auth_result', JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
            timestamp: Date.now(),
          }));
        } catch (e) {
          // ignore
        }
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
                  onClick={() => navigate('/quickbooks')}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                >
                  Volver a QuickBooks
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
            <p className="text-muted-foreground">{companyName} se conectó correctamente con QuickBooks.</p>
            <p className="text-muted-foreground mt-2">Redirigiendo...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default QuickBooksCallback;
