-- ============================================
-- CRITICAL SECURITY FIXES FOR QUICKBOOKS INTEGRATION
-- ============================================

-- 1. Fix QuickBooks Companies Table - Remove public access
DROP POLICY IF EXISTS "Anyone can view companies" ON public.quickbooks_companies;

CREATE POLICY "Only authenticated admins can view companies"
  ON public.quickbooks_companies
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND (
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'::app_role
      )
    )
  );

-- 2. Fix QuickBooks Tokens - Ensure only service role can access
DROP POLICY IF EXISTS "Tokens only accessible by service role" ON public.quickbooks_tokens;
DROP POLICY IF EXISTS "Service role can manage QuickBooks tokens" ON public.quickbooks_tokens;

CREATE POLICY "Only service role can manage tokens"
  ON public.quickbooks_tokens
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 3. Add company_id to financial tables for proper isolation
-- Add company_id to quickbooks_customers
ALTER TABLE public.quickbooks_customers 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.quickbooks_companies(id);

-- Add company_id to quickbooks_invoices
ALTER TABLE public.quickbooks_invoices 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.quickbooks_companies(id);

-- Add company_id to quickbooks_expenses
ALTER TABLE public.quickbooks_expenses 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.quickbooks_companies(id);

-- Add company_id to quickbooks_balance_sheet
ALTER TABLE public.quickbooks_balance_sheet 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.quickbooks_companies(id);

-- Add company_id to quickbooks_profit_loss
ALTER TABLE public.quickbooks_profit_loss 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.quickbooks_companies(id);

-- Add company_id to quickbooks_budgets
ALTER TABLE public.quickbooks_budgets 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.quickbooks_companies(id);

-- 4. Update RLS policies to include company-level isolation
-- Helper function to check if user has access to a company
CREATE OR REPLACE FUNCTION public.user_has_company_access(target_company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.company_users 
    WHERE user_id = auth.uid() 
    AND company_id = target_company_id
  ) OR EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update customers policy
DROP POLICY IF EXISTS "Authenticated admins and users can view customers" ON public.quickbooks_customers;

CREATE POLICY "Users can view customers from their companies"
  ON public.quickbooks_customers
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND (company_id IS NULL OR public.user_has_company_access(company_id))
  );

-- Update invoices policy
DROP POLICY IF EXISTS "Authenticated admins and users can view invoices" ON public.quickbooks_invoices;

CREATE POLICY "Users can view invoices from their companies"
  ON public.quickbooks_invoices
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND (company_id IS NULL OR public.user_has_company_access(company_id))
  );

-- Update expenses policy
DROP POLICY IF EXISTS "Authenticated admins and users can view expenses" ON public.quickbooks_expenses;

CREATE POLICY "Users can view expenses from their companies"
  ON public.quickbooks_expenses
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND (company_id IS NULL OR public.user_has_company_access(company_id))
  );

-- Update balance_sheet policy
DROP POLICY IF EXISTS "Authenticated admins and users can view balance_sheet" ON public.quickbooks_balance_sheet;

CREATE POLICY "Users can view balance sheets from their companies"
  ON public.quickbooks_balance_sheet
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND (company_id IS NULL OR public.user_has_company_access(company_id))
  );

-- Update profit_loss policy
DROP POLICY IF EXISTS "Authenticated admins and users can view profit_loss" ON public.quickbooks_profit_loss;

CREATE POLICY "Users can view profit/loss from their companies"
  ON public.quickbooks_profit_loss
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND (company_id IS NULL OR public.user_has_company_access(company_id))
  );

-- Update budgets policy
DROP POLICY IF EXISTS "Authenticated admins and users can view budgets" ON public.quickbooks_budgets;

CREATE POLICY "Users can view budgets from their companies"
  ON public.quickbooks_budgets
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND (company_id IS NULL OR public.user_has_company_access(company_id))
  );