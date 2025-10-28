-- Create a junction table to link users with companies
CREATE TABLE public.company_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES quickbooks_companies(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, company_id)
);

ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

-- RLS policies for company_users
CREATE POLICY "Users can view their own company associations"
ON public.company_users FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert company associations"
ON public.company_users FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete company associations"
ON public.company_users FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Drop all existing policies from quickbooks_companies
DROP POLICY IF EXISTS "Anyone can view companies" ON quickbooks_companies;
DROP POLICY IF EXISTS "Service role can manage companies" ON quickbooks_companies;

-- Create new policies for quickbooks_companies
CREATE POLICY "Authenticated users view their companies"
ON quickbooks_companies FOR SELECT
USING (
  auth.role() = 'service_role' OR
  (auth.uid() IS NOT NULL AND (
    id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid()) OR
    has_role(auth.uid(), 'admin')
  ))
);

CREATE POLICY "Service role full access to companies"
ON quickbooks_companies FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');