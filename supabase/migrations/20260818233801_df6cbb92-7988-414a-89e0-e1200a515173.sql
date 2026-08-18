-- 1. Business groups
CREATE TABLE public.business_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  default_currency text NOT NULL DEFAULT 'CRC',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_groups TO authenticated;
GRANT ALL ON public.business_groups TO service_role;
ALTER TABLE public.business_groups ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.business_group_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.business_groups(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.quickbooks_companies(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  include_in_consolidation boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, company_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_group_companies TO authenticated;
GRANT ALL ON public.business_group_companies TO service_role;
ALTER TABLE public.business_group_companies ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_group_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.business_groups(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'cliente',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, group_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_group_access TO authenticated;
GRANT ALL ON public.user_group_access TO service_role;
ALTER TABLE public.user_group_access ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tax_estimate_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.quickbooks_companies(id) ON DELETE CASCADE,
  fiscal_period text NOT NULL,
  taxpayer_type text,
  calculation_rule text NOT NULL DEFAULT 'flat_rate',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  manual_adjustments numeric NOT NULL DEFAULT 0,
  partial_payments numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, fiscal_period)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tax_estimate_settings TO authenticated;
GRANT ALL ON public.tax_estimate_settings TO service_role;
ALTER TABLE public.tax_estimate_settings ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_tax_estimate_settings_updated_at
BEFORE UPDATE ON public.tax_estimate_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Access helper (security definer, avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.user_has_group_access(target_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_group_access
    WHERE user_id = auth.uid() AND group_id = target_group_id
  ) OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'contador'::public.app_role)
$$;

-- 3. Policies
CREATE POLICY "Group members and staff can view groups"
ON public.business_groups FOR SELECT TO authenticated
USING (public.user_has_group_access(id));

CREATE POLICY "Admins manage groups"
ON public.business_groups FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Group members and staff can view group companies"
ON public.business_group_companies FOR SELECT TO authenticated
USING (public.user_has_group_access(group_id));

CREATE POLICY "Admins manage group companies"
ON public.business_group_companies FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users can view their own group access"
ON public.user_group_access FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins manage group access"
ON public.user_group_access FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Company members can view tax settings"
ON public.tax_estimate_settings FOR SELECT TO authenticated
USING (public.user_has_company_access(company_id));

CREATE POLICY "Admins manage tax settings"
ON public.tax_estimate_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));