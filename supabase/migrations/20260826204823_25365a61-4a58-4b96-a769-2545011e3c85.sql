-- business_groups
DROP POLICY IF EXISTS "Admins manage groups" ON public.business_groups;
CREATE POLICY "Admins manage groups" ON public.business_groups FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- business_group_companies
DROP POLICY IF EXISTS "Admins manage group companies" ON public.business_group_companies;
CREATE POLICY "Admins manage group companies" ON public.business_group_companies FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- user_group_access
DROP POLICY IF EXISTS "Admins manage group access" ON public.user_group_access;
CREATE POLICY "Admins manage group access" ON public.user_group_access FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Users can view their own group access" ON public.user_group_access;
CREATE POLICY "Users can view their own group access" ON public.user_group_access FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role));

-- tax_estimate_settings
DROP POLICY IF EXISTS "Admins manage tax settings" ON public.tax_estimate_settings;
CREATE POLICY "Admins manage tax settings" ON public.tax_estimate_settings FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Accountants manage tax settings" ON public.tax_estimate_settings;
CREATE POLICY "Accountants manage tax settings" ON public.tax_estimate_settings FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'contador'::public.app_role) AND private.user_has_company_access(company_id))
  WITH CHECK (private.has_role(auth.uid(), 'contador'::public.app_role) AND private.user_has_company_access(company_id));

DROP POLICY IF EXISTS "Company members can view tax settings" ON public.tax_estimate_settings;
CREATE POLICY "Company members can view tax settings" ON public.tax_estimate_settings FOR SELECT TO authenticated
  USING (private.user_has_company_access(company_id));

-- tax_brackets
DROP POLICY IF EXISTS "Staff can insert tax brackets" ON public.tax_brackets;
CREATE POLICY "Staff can insert tax brackets" ON public.tax_brackets FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'contador'::public.app_role));

DROP POLICY IF EXISTS "Staff can update tax brackets" ON public.tax_brackets;
CREATE POLICY "Staff can update tax brackets" ON public.tax_brackets FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'contador'::public.app_role));

DROP POLICY IF EXISTS "Staff can delete tax brackets" ON public.tax_brackets;
CREATE POLICY "Staff can delete tax brackets" ON public.tax_brackets FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'contador'::public.app_role));