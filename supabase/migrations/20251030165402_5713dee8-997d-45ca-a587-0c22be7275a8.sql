-- Fix search_path for security definer function
CREATE OR REPLACE FUNCTION public.user_has_company_access(target_company_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO ''
AS $$
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
$$;