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

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['business-groups', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<BusinessGroup[]> => {
      const { data: access } = await supabase
        .from('user_group_access')
        .select('group_id')
        .eq('user_id', user!.id);

      const groupIds = (access ?? []).map((a) => a.group_id);
      if (groupIds.length === 0) return [];

      const { data: groupRows, error } = await supabase
        .from('business_groups')
        .select('id, name, default_currency, active')
        .in('id', groupIds)
        .eq('active', true)
        .order('name');

      if (error || !groupRows?.length) return [];

      const { data: links } = await supabase
        .from('business_group_companies')
        .select('group_id, company_id, display_order, include_in_consolidation')
        .in('group_id', groupRows.map((g) => g.id))
        .order('display_order');

      return groupRows.map((g) => ({
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
      }));
    },
  });

  return { groups, isLoading, hasGroups: groups.length > 0 };
}
