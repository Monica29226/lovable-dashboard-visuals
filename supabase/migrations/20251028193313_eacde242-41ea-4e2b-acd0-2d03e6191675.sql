-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Service role can manage QuickBooks tokens" ON public.quickbooks_tokens;

-- Create policy to allow service role to manage tokens
CREATE POLICY "Service role can manage QuickBooks tokens" 
ON public.quickbooks_tokens 
FOR ALL 
USING (true)
WITH CHECK (true);