-- 1. Hide QuickBooks OAuth credentials from authenticated/anon (only service_role/backend may read)
REVOKE SELECT (client_id, client_secret) ON public.quickbooks_companies FROM authenticated;
REVOKE SELECT (client_id, client_secret) ON public.quickbooks_companies FROM anon;

-- 2. Enforce user_id = auth.uid() on budget audit inserts
DROP POLICY IF EXISTS "Users can insert audit logs for their companies" ON public.budget_2026_audit;
CREATE POLICY "Users can insert audit logs for their companies"
ON public.budget_2026_audit
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND private.user_has_company_access(company_id)
);

-- 3. Enforce company membership for financial_data reads
DROP POLICY IF EXISTS "Users can view financial data for their realm" ON public.financial_data;
CREATE POLICY "Users can view financial data for their realm"
ON public.financial_data
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.quickbooks_companies qc
    WHERE qc.realm_id = financial_data.realm_id
      AND private.user_has_company_access(qc.id)
  )
);

-- 4. Enforce company membership for sync_logs reads
DROP POLICY IF EXISTS "Users can view sync logs for their realm" ON public.sync_logs;
CREATE POLICY "Users can view sync logs for their realm"
ON public.sync_logs
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.quickbooks_companies qc
    WHERE qc.realm_id = sync_logs.realm_id
      AND private.user_has_company_access(qc.id)
  )
);

-- 5. Lock down internal email-queue helper functions (fixed search_path + backend-only execution)
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;

REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated;