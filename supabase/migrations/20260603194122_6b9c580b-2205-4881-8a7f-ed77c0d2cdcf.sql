GRANT EXECUTE ON FUNCTION private.user_has_company_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;
GRANT SELECT, UPDATE ON public.quickbooks_companies TO authenticated;