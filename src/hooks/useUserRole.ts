import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'admin' | 'contador' | 'cliente' | 'user' | 'viewer';

export function useUserRole() {
  const { user } = useAuth();

  const { data: role = null, isLoading } = useQuery({
    queryKey: ['user-role', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AppRole | null> => {
      if (!user) return null;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      return (data?.role as AppRole) ?? null;
    },
  });

  const isAdmin = role === 'admin';
  const isContador = role === 'contador';
  // Staff = ACL team members who can see the corporate panel.
  const isStaff = isAdmin || isContador;

  return { role, isAdmin, isContador, isStaff, isLoading };
}
