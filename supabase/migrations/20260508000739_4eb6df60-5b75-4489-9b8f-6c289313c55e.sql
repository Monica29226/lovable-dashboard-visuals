-- Restrict client-side access to sensitive QuickBooks OAuth credentials
REVOKE ALL ON TABLE public.quickbooks_companies FROM anon, authenticated;

GRANT SELECT (id, company_name, realm_id, is_connected, created_at, updated_at)
ON public.quickbooks_companies
TO authenticated;

-- Keep anonymous users without direct access to QuickBooks company metadata
REVOKE ALL ON TABLE public.quickbooks_companies FROM anon;