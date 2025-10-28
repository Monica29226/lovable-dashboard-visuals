-- Step 1: Remove all dangerous public read policies
DROP POLICY IF EXISTS "Allow public read access to customers" ON public.quickbooks_customers;
DROP POLICY IF EXISTS "Allow public read access to invoices" ON public.quickbooks_invoices;
DROP POLICY IF EXISTS "Allow public read access to expenses" ON public.quickbooks_expenses;
DROP POLICY IF EXISTS "Allow public read access to profit_loss" ON public.quickbooks_profit_loss;
DROP POLICY IF EXISTS "Allow public read access to balance_sheet" ON public.quickbooks_balance_sheet;
DROP POLICY IF EXISTS "Allow public read access to budgets" ON public.quickbooks_budgets;

-- Step 2: Create user roles system for proper authorization
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'viewer');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Step 4: Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Add authentication-based RLS policies for QuickBooks tables
-- Only authenticated users with admin or user role can read financial data
CREATE POLICY "Authenticated admins and users can view customers"
ON public.quickbooks_customers
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'user')
);

CREATE POLICY "Authenticated admins and users can view invoices"
ON public.quickbooks_invoices
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'user')
);

CREATE POLICY "Authenticated admins and users can view expenses"
ON public.quickbooks_expenses
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'user')
);

CREATE POLICY "Authenticated admins and users can view profit_loss"
ON public.quickbooks_profit_loss
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'user')
);

CREATE POLICY "Authenticated admins and users can view balance_sheet"
ON public.quickbooks_balance_sheet
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'user')
);

CREATE POLICY "Authenticated admins and users can view budgets"
ON public.quickbooks_budgets
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'user')
);

-- Step 6: RLS policies for user_roles table
-- Only admins can manage roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Step 7: RLS policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Step 8: Create trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();