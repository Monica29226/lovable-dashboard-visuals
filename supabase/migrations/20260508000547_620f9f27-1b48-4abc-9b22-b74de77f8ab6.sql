-- Backfill the only known unscoped budget row before enforcing company scoping
UPDATE public.budget_2026
SET company_id = 'aef35e69-a39c-4296-8220-4cc6263b1189'::uuid
WHERE company_id IS NULL;

-- Prevent future unscoped sensitive financial rows
ALTER TABLE public.budget_2026 ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.budget_2026_audit ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.quickbooks_expenses ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.quickbooks_invoices ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.quickbooks_customers ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.quickbooks_budgets ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.quickbooks_profit_loss ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.quickbooks_balance_sheet ALTER COLUMN company_id SET NOT NULL;

-- Remove NULL company bypass from budget_2026 policies
DROP POLICY IF EXISTS "Users can view budgets from their companies" ON public.budget_2026;
CREATE POLICY "Users can view budgets from their companies"
ON public.budget_2026
FOR SELECT
USING ((auth.uid() IS NOT NULL) AND private.user_has_company_access(company_id));

DROP POLICY IF EXISTS "Users can insert budgets for their companies" ON public.budget_2026;
CREATE POLICY "Users can insert budgets for their companies"
ON public.budget_2026
FOR INSERT
WITH CHECK ((auth.uid() IS NOT NULL) AND private.user_has_company_access(company_id));

DROP POLICY IF EXISTS "Users can update budgets for their companies" ON public.budget_2026;
CREATE POLICY "Users can update budgets for their companies"
ON public.budget_2026
FOR UPDATE
USING ((auth.uid() IS NOT NULL) AND private.user_has_company_access(company_id));

DROP POLICY IF EXISTS "Users can delete budgets for their companies" ON public.budget_2026;
CREATE POLICY "Users can delete budgets for their companies"
ON public.budget_2026
FOR DELETE
USING ((auth.uid() IS NOT NULL) AND private.user_has_company_access(company_id));

-- Remove NULL company bypass from budget audit policies
DROP POLICY IF EXISTS "Users can view audit logs for their companies" ON public.budget_2026_audit;
CREATE POLICY "Users can view audit logs for their companies"
ON public.budget_2026_audit
FOR SELECT
USING ((auth.uid() IS NOT NULL) AND private.user_has_company_access(company_id));

DROP POLICY IF EXISTS "Users can insert audit logs for their companies" ON public.budget_2026_audit;
CREATE POLICY "Users can insert audit logs for their companies"
ON public.budget_2026_audit
FOR INSERT
WITH CHECK ((auth.uid() IS NOT NULL) AND private.user_has_company_access(company_id));

-- Remove NULL company bypass from QuickBooks read policies
DROP POLICY IF EXISTS "Users can view balance sheets from their companies" ON public.quickbooks_balance_sheet;
CREATE POLICY "Users can view balance sheets from their companies"
ON public.quickbooks_balance_sheet
FOR SELECT
USING ((auth.uid() IS NOT NULL) AND private.user_has_company_access(company_id));

DROP POLICY IF EXISTS "Users can view budgets from their companies" ON public.quickbooks_budgets;
CREATE POLICY "Users can view budgets from their companies"
ON public.quickbooks_budgets
FOR SELECT
USING ((auth.uid() IS NOT NULL) AND private.user_has_company_access(company_id));

DROP POLICY IF EXISTS "Users can view customers from their companies" ON public.quickbooks_customers;
CREATE POLICY "Users can view customers from their companies"
ON public.quickbooks_customers
FOR SELECT
USING ((auth.uid() IS NOT NULL) AND private.user_has_company_access(company_id));

DROP POLICY IF EXISTS "Users can view expenses from their companies" ON public.quickbooks_expenses;
CREATE POLICY "Users can view expenses from their companies"
ON public.quickbooks_expenses
FOR SELECT
USING ((auth.uid() IS NOT NULL) AND private.user_has_company_access(company_id));

DROP POLICY IF EXISTS "Users can view invoices from their companies" ON public.quickbooks_invoices;
CREATE POLICY "Users can view invoices from their companies"
ON public.quickbooks_invoices
FOR SELECT
USING ((auth.uid() IS NOT NULL) AND private.user_has_company_access(company_id));

DROP POLICY IF EXISTS "Users can view profit/loss from their companies" ON public.quickbooks_profit_loss;
CREATE POLICY "Users can view profit/loss from their companies"
ON public.quickbooks_profit_loss
FOR SELECT
USING ((auth.uid() IS NOT NULL) AND private.user_has_company_access(company_id));