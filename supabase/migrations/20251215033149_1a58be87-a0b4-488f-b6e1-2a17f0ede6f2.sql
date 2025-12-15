-- Add INSERT, UPDATE, DELETE policies for service role on quickbooks_balance_sheet
CREATE POLICY "Service role can manage balance sheets"
ON public.quickbooks_balance_sheet
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Add INSERT, UPDATE, DELETE policies for service role on quickbooks_profit_loss
CREATE POLICY "Service role can manage profit loss"
ON public.quickbooks_profit_loss
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Add INSERT, UPDATE, DELETE policies for service role on quickbooks_budgets
CREATE POLICY "Service role can manage budgets"
ON public.quickbooks_budgets
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');