REVOKE EXECUTE ON FUNCTION public.user_has_group_access(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.user_has_group_access(uuid) TO authenticated, service_role;