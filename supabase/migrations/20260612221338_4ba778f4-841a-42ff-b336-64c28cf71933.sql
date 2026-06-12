-- 1. Add data_source column to companies
ALTER TABLE public.quickbooks_companies
  ADD COLUMN IF NOT EXISTS data_source text NOT NULL DEFAULT 'quickbooks';

-- 2. Rewrite handle_new_user to NOT auto-assign companies (strict isolation)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );

  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  -- NOTE: Company access is now granted explicitly by an admin.
  -- New users do NOT receive automatic access to any company.

  RETURN NEW;
END;
$function$;