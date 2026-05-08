-- Create a non-exposed schema for authorization helpers used by RLS
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION private.user_has_company_access(target_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.company_users
    WHERE user_id = auth.uid()
      AND company_id = target_company_id
  ) OR private.has_role(auth.uid(), 'admin'::public.app_role);
END;
$$;

REVOKE EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.user_has_company_access(uuid) FROM PUBLIC, anon, authenticated;

-- budget_2026 policies
DROP POLICY IF EXISTS "Users can view budgets from their companies" ON public.budget_2026;
CREATE POLICY "Users can view budgets from their companies"
ON public.budget_2026
FOR SELECT
USING ((auth.uid() IS NOT NULL) AND ((company_id IS NULL) OR private.user_has_company_access(company_id)));

DROP POLICY IF EXISTS "Users can insert budgets for their companies" ON public.budget_2026;
CREATE POLICY "Users can insert budgets for their companies"
ON public.budget_2026
FOR INSERT
WITH CHECK ((auth.uid() IS NOT NULL) AND ((company_id IS NULL) OR private.user_has_company_access(company_id)));

DROP POLICY IF EXISTS "Users can update budgets for their companies" ON public.budget_2026;
CREATE POLICY "Users can update budgets for their companies"
ON public.budget_2026
FOR UPDATE
USING ((auth.uid() IS NOT NULL) AND ((company_id IS NULL) OR private.user_has_company_access(company_id)));

DROP POLICY IF EXISTS "Users can delete budgets for their companies" ON public.budget_2026;
CREATE POLICY "Users can delete budgets for their companies"
ON public.budget_2026
FOR DELETE
USING ((auth.uid() IS NOT NULL) AND ((company_id IS NULL) OR private.user_has_company_access(company_id)));

-- budget_2026_audit policies
DROP POLICY IF EXISTS "Users can view audit logs for their companies" ON public.budget_2026_audit;
CREATE POLICY "Users can view audit logs for their companies"
ON public.budget_2026_audit
FOR SELECT
USING ((auth.uid() IS NOT NULL) AND ((company_id IS NULL) OR private.user_has_company_access(company_id)));

DROP POLICY IF EXISTS "Users can insert audit logs for their companies" ON public.budget_2026_audit;
CREATE POLICY "Users can insert audit logs for their companies"
ON public.budget_2026_audit
FOR INSERT
WITH CHECK ((auth.uid() IS NOT NULL) AND ((company_id IS NULL) OR private.user_has_company_access(company_id)));

-- company_users policies
DROP POLICY IF EXISTS "Users can view their own company associations" ON public.company_users;
CREATE POLICY "Users can view their own company associations"
ON public.company_users
FOR SELECT
USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can insert company associations" ON public.company_users;
CREATE POLICY "Admins can insert company associations"
ON public.company_users
FOR INSERT
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can delete company associations" ON public.company_users;
CREATE POLICY "Admins can delete company associations"
ON public.company_users
FOR DELETE
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- domains policies
DROP POLICY IF EXISTS "Admins can manage domains" ON public.domains;
CREATE POLICY "Admins can manage domains"
ON public.domains
FOR ALL
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- profiles policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- QuickBooks read policies
DROP POLICY IF EXISTS "Users can view balance sheets from their companies" ON public.quickbooks_balance_sheet;
CREATE POLICY "Users can view balance sheets from their companies"
ON public.quickbooks_balance_sheet
FOR SELECT
USING ((auth.uid() IS NOT NULL) AND ((company_id IS NULL) OR private.user_has_company_access(company_id)));

DROP POLICY IF EXISTS "Users can view budgets from their companies" ON public.quickbooks_budgets;
CREATE POLICY "Users can view budgets from their companies"
ON public.quickbooks_budgets
FOR SELECT
USING ((auth.uid() IS NOT NULL) AND ((company_id IS NULL) OR private.user_has_company_access(company_id)));

DROP POLICY IF EXISTS "Users can view their assigned companies" ON public.quickbooks_companies;
CREATE POLICY "Users can view their assigned companies"
ON public.quickbooks_companies
FOR SELECT
USING ((auth.uid() IS NOT NULL) AND (private.user_has_company_access(id) OR private.has_role(auth.uid(), 'admin'::public.app_role)));

DROP POLICY IF EXISTS "Users can view customers from their companies" ON public.quickbooks_customers;
CREATE POLICY "Users can view customers from their companies"
ON public.quickbooks_customers
FOR SELECT
USING ((auth.uid() IS NOT NULL) AND ((company_id IS NULL) OR private.user_has_company_access(company_id)));

DROP POLICY IF EXISTS "Users can view expenses from their companies" ON public.quickbooks_expenses;
CREATE POLICY "Users can view expenses from their companies"
ON public.quickbooks_expenses
FOR SELECT
USING ((auth.uid() IS NOT NULL) AND ((company_id IS NULL) OR private.user_has_company_access(company_id)));

DROP POLICY IF EXISTS "Users can view invoices from their companies" ON public.quickbooks_invoices;
CREATE POLICY "Users can view invoices from their companies"
ON public.quickbooks_invoices
FOR SELECT
USING ((auth.uid() IS NOT NULL) AND ((company_id IS NULL) OR private.user_has_company_access(company_id)));

DROP POLICY IF EXISTS "Users can view profit/loss from their companies" ON public.quickbooks_profit_loss;
CREATE POLICY "Users can view profit/loss from their companies"
ON public.quickbooks_profit_loss
FOR SELECT
USING ((auth.uid() IS NOT NULL) AND ((company_id IS NULL) OR private.user_has_company_access(company_id)));

-- user_roles policies
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Remove direct execution access to the old public authorization helpers
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.user_has_company_access(uuid) FROM PUBLIC, anon, authenticated;