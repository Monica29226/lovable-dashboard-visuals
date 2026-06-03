import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useIsAdmin() {
  const { user } = useAuth();

  const { data: isAdmin = false, isLoading } = useQuery({
    queryKey: ['is-admin', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      return !!data;
    },
  });

  return { isAdmin, isLoading };
}
