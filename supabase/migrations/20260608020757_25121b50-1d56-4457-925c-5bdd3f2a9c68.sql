ALTER TABLE public.quickbooks_companies
  ADD COLUMN IF NOT EXISTS accent_color text NOT NULL DEFAULT '218 92% 24%';