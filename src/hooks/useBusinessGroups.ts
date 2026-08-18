import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface GroupCompanyLink {
  company_id: string;
  display_order: number;
  include_in_consolidation: boolean;
}

export interface BusinessGroup {
  id: string;
  name: string;
  default_currency: string;
  companies: GroupCompanyLink[];
}

/**
 * Grupos empresariales visibles para el usuario actual (RLS decide la visibilidad).
 * No reemplaza el acceso por empresa (company_users); solo lo agrupa.
 */
export function useBusinessGroups() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['business-groups', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<{ groups: BusinessGroup[]; isMember: boolean }> => {
      const [{ data: access }, { data: staffRole }] = await Promise.all([
        supabase.from('user_group_access').select('group_id').eq('user_id', user!.id),
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user!.id)
          .in('role', ['admin', 'contador'])
          .maybeSingle(),
      ]);

      const isStaff = !!staffRole;
      const groupIds = (access ?? []).map((a) => a.group_id);
      const isMember = groupIds.length > 0;
      if (!isStaff && !isMember) return { groups: [], isMember: false };

      let query = supabase
        .from('business_groups')
        .select('id, name, default_currency, active')
        .eq('active', true)
        .order('name');
      if (!isStaff) query = query.in('id', groupIds);

      const { data: groupRows, error } = await query;

      if (error || !groupRows?.length) return { groups: [], isMember };

      const { data: links } = await supabase
        .from('business_group_companies')
        .select('group_id, company_id, display_order, include_in_consolidation')
        .in('group_id', groupRows.map((g) => g.id))
        .order('display_order');

      return {
        isMember,
        groups: groupRows.map((g) => ({
          id: g.id,
          name: g.name,
          default_currency: g.default_currency,
          companies: (links ?? [])
            .filter((l) => l.group_id === g.id)
            .map((l) => ({
              company_id: l.company_id,
              display_order: l.display_order,
              include_in_consolidation: l.include_in_consolidation,
            })),
        })),
      };
    },
  });

  const groups = data?.groups ?? [];

  return {
    groups,
    isLoading,
    hasGroups: groups.length > 0,
    // Solo los clientes asignados a un grupo abren por defecto en "Vista global".
    isGroupMember: !!data?.isMember,
  };
}

