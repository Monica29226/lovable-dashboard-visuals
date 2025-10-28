-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can view companies" ON quickbooks_companies;
DROP POLICY IF EXISTS "Admins can manage companies" ON quickbooks_companies;

-- Create new policy that allows anyone to view companies
CREATE POLICY "Anyone can view companies"
ON quickbooks_companies
FOR SELECT
USING (true);

-- Allow service role to manage companies (for edge functions)
CREATE POLICY "Service role can manage companies"
ON quickbooks_companies
FOR ALL
USING (auth.role() = 'service_role');