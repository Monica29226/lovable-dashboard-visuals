import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Returns true if the user is a global admin (row in user_roles with role='admin')
 * OR has explicit access to the company (row in company_users for that company_id).
 * Uses the service-role client so it bypasses RLS for a reliable check.
 */
export async function userHasCompanyAccess(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string,
  companyId: string,
): Promise<boolean> {
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: adminRole } = await admin
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();

  if (adminRole) return true;

  const { data: access } = await admin
    .from('company_users')
    .select('id')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .maybeSingle();

  return !!access;
}

/**
 * Returns true when the request comes from a trusted server-to-server caller
 * (e.g. the nightly cron) that presents the SUPABASE_SERVICE_ROLE_KEY as bearer token.
 */
export function isServiceRoleRequest(authHeader: string | null): boolean {
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '').trim();
  const serviceKey = (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '').trim();
  return !!token && !!serviceKey && token === serviceKey;
}

/**
 * Inserts a row into sync_logs. Adapts to the real schema:
 * (realm_id, sync_type, status, error_message, records_synced).
 */
export async function logSync(
  supabase: any,
  params: {
    realmId: string;
    syncType: string;
    status: 'success' | 'error';
    errorMessage?: string | null;
    recordsSynced?: number;
  },
): Promise<void> {
  try {
    await supabase.from('sync_logs').insert({
      realm_id: params.realmId,
      sync_type: params.syncType,
      status: params.status,
      error_message: params.errorMessage ?? null,
      records_synced: params.recordsSynced ?? 0,
    });
  } catch (e) {
    console.error('Failed to write sync_logs entry:', e);
  }
}
