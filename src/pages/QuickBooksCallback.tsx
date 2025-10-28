import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const QuickBooksCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const realmId = searchParams.get('realmId');

      if (!code || !realmId) {
        console.error('Missing authorization code or realm ID');
        navigate('/quickbooks-balance');
        return;
      }

      try {
        // Call the callback edge function with the authorization code
        const { data, error } = await supabase.functions.invoke('quickbooks-callback', {
          body: { code, realmId }
        });

        if (error) {
          console.error('Error processing callback:', error);
        }

        // Redirect to balance page
        navigate('/quickbooks-balance');
      } catch (error) {
        console.error('Callback error:', error);
        navigate('/quickbooks-balance');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Conectando con QuickBooks...</h2>
        <p className="text-muted-foreground">Por favor espera mientras procesamos tu autorización.</p>
      </div>
    </div>
  );
};

export default QuickBooksCallback;
