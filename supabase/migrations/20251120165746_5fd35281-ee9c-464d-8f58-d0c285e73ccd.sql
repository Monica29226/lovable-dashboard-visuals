-- Fix RLS policy on quickbooks_companies to restrict access to assigned users only
-- This prevents unauthorized access to sensitive QuickBooks credentials

DROP POLICY IF EXISTS "Authenticated users can view companies" ON public.quickbooks_companies;

CREATE POLICY "Users can view their assigned companies"
ON public.quickbooks_companies
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  (user_has_company_access(id) OR has_role(auth.uid(), 'admin'::public.app_role))
);

-- Service role still has full access for backend operations
-- The existing "Service role full access" policy remains unchanged