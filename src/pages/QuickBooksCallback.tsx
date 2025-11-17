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
        const state = searchParams.get('state'); // User ID from OAuth
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        setDebugInfo({
          allParams,
          code: code ? 'presente' : 'falta',
          realmId: realmId || 'falta',
          state: state || 'falta',
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
        if (!code || !realmId) {
          setStatus('error');
          setErrorMessage('Faltan parámetros requeridos en la URL de callback');
          return;
        }

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setStatus('error');
          setErrorMessage('Usuario no autenticado');
          return;
        }

        // Exchange code for tokens
        const { data: company } = await supabase
          .from('quickbooks_companies')
          .select('client_id, client_secret')
          .eq('realm_id', realmId)
          .single();

        if (!company) {
          setStatus('error');
          setErrorMessage('Empresa no encontrada');
          return;
        }

        const credentials = btoa(`${company.client_id}:${company.client_secret}`);
        const redirectUri = `${window.location.origin}/auth/quickbooks/callback`;

        const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri,
          }),
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json();
          setStatus('error');
          setErrorMessage(`Error al obtener tokens: ${errorData.error || 'Error desconocido'}`);
          return;
        }

        const tokens = await tokenResponse.json();
        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

        // Save tokens to database
        const { error: insertError } = await supabase
          .from('oauth_tokens')
          .upsert({
            user_id: user.id,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            realm_id: realmId,
            expires_at: expiresAt.toISOString(),
          });

        if (insertError) {
          setStatus('error');
          setErrorMessage(`Error al guardar tokens: ${insertError.message}`);
          return;
        }

        // Mark company as connected
        await supabase
          .from('quickbooks_companies')
          .update({ is_connected: true })
          .eq('realm_id', realmId);

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
