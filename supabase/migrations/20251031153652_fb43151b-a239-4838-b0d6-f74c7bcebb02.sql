-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function that assigns user to all QB companies
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  
  -- Assign user to all existing QuickBooks companies
  INSERT INTO public.company_users (user_id, company_id, role)
  SELECT NEW.id, id, 'user'::app_role
  FROM public.quickbooks_companies;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Manually assign current user to all QB companies (run as service role)
INSERT INTO public.company_users (user_id, company_id, role)
SELECT 
  u.id,
  qc.id,
  'user'::app_role
FROM auth.users u
CROSS JOIN public.quickbooks_companies qc
WHERE NOT EXISTS (
  SELECT 1 FROM public.company_users cu 
  WHERE cu.user_id = u.id AND cu.company_id = qc.id
)
ON CONFLICT DO NOTHING;