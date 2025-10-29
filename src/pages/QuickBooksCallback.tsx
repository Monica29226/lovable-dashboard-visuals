import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const QuickBooksCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Log all URL parameters for debugging
        const allParams = Object.fromEntries(searchParams.entries());
        console.log('QuickBooks callback - All URL params:', allParams);

        const code = searchParams.get('code');
        const realmId = searchParams.get('realmId');
        const companyId = searchParams.get('state'); // Company ID is in state parameter

        console.log('QuickBooks callback - Parsed params:', { 
          code: code ? 'present' : 'missing', 
          realmId, 
          companyId 
        });

        if (!code || !realmId || !companyId) {
          console.error('Missing required parameters', { code: !!code, realmId: !!realmId, companyId: !!companyId });
          navigate('/quickbooks-hub');
          return;
        }

        // Call the callback edge function with company ID
        console.log('Calling quickbooks-callback function...');
        const { data, error } = await supabase.functions.invoke('quickbooks-callback', {
          body: { code, realmId, companyId }
        });

        if (error) {
          console.error('Error processing callback:', error);
        } else {
          console.log('Callback successful:', data);
        }

        // Redirect to QuickBooks Hub
        navigate('/quickbooks-hub');
      } catch (error) {
        console.error('Callback error:', error);
        // Show the actual error to the user
        if (error instanceof Error) {
          alert(`Error: ${error.message}`);
        }
        navigate('/quickbooks-hub');
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
