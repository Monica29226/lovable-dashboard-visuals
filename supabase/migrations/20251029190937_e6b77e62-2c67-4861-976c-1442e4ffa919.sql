-- Add unique constraint to company_id in quickbooks_tokens table
ALTER TABLE public.quickbooks_tokens 
ADD CONSTRAINT quickbooks_tokens_company_id_unique UNIQUE (company_id);