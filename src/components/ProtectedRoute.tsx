import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setAccessChecked(false);
      setHasAccess(true);
      return;
    }

    const checkAccess = async () => {
      setAccessChecked(false);
      try {
        const [rolesRes, companiesRes] = await Promise.all([
          supabase.from('user_roles').select('id').eq('user_id', user.id).limit(1),
          supabase.from('company_users').select('id').eq('user_id', user.id).limit(1),
        ]);

        if (cancelled) return;

        if (rolesRes.error || companiesRes.error) {
          console.error('Error verificando acceso del usuario:', rolesRes.error ?? companiesRes.error);
          setHasAccess(true);
          setAccessChecked(true);
          return;
        }

        const allowed = (rolesRes.data?.length ?? 0) > 0 || (companiesRes.data?.length ?? 0) > 0;
        setHasAccess(allowed);
        setAccessChecked(true);

        if (!allowed) {
          toast.error('Su cuenta no tiene acceso asignado. Contacte al administrador de ACL.');
          await signOut();
          navigate('/auth');
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Error verificando acceso del usuario:', error);
        setHasAccess(true);
        setAccessChecked(true);
      }
    };

    checkAccess();

    return () => {
      cancelled = true;
    };
  }, [user, signOut, navigate]);

  if (loading || (user && !accessChecked)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !hasAccess) {
    return null;
  }

  return <>{children}</>;
};
