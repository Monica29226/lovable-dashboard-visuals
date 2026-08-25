CREATE POLICY "Accountants manage tax settings"
ON public.tax_estimate_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'contador') AND public.user_has_company_access(company_id))
WITH CHECK (public.has_role(auth.uid(), 'contador') AND public.user_has_company_access(company_id));