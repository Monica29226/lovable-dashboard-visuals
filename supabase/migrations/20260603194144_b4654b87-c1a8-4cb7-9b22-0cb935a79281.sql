CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

  -- Assign user to all existing QuickBooks companies EXCEPT Horizonte Positivo
  -- (Horizonte access is granted manually)
  INSERT INTO public.company_users (user_id, company_id, role)
  SELECT NEW.id, id, 'user'::app_role
  FROM public.quickbooks_companies
  WHERE company_name <> 'Horizonte Positivo';

  RETURN NEW;
END;
$function$;