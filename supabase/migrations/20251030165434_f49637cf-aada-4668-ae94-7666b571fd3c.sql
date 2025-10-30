-- Create budget_2026 table to store budget data
CREATE TABLE IF NOT EXISTS public.budget_2026 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.quickbooks_companies(id),
  category TEXT NOT NULL,
  subcategory TEXT,
  parent_category TEXT,
  level INTEGER DEFAULT 0,
  january NUMERIC DEFAULT 0,
  february NUMERIC DEFAULT 0,
  march NUMERIC DEFAULT 0,
  april NUMERIC DEFAULT 0,
  may NUMERIC DEFAULT 0,
  june NUMERIC DEFAULT 0,
  july NUMERIC DEFAULT 0,
  august NUMERIC DEFAULT 0,
  september NUMERIC DEFAULT 0,
  october NUMERIC DEFAULT 0,
  november NUMERIC DEFAULT 0,
  december NUMERIC DEFAULT 0,
  total NUMERIC GENERATED ALWAYS AS (
    january + february + march + april + may + june + 
    july + august + september + october + november + december
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.budget_2026 ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view budgets from their companies"
  ON public.budget_2026
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND (company_id IS NULL OR public.user_has_company_access(company_id))
  );

CREATE POLICY "Users can insert budgets for their companies"
  ON public.budget_2026
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND (company_id IS NULL OR public.user_has_company_access(company_id))
  );

CREATE POLICY "Users can update budgets for their companies"
  ON public.budget_2026
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND (company_id IS NULL OR public.user_has_company_access(company_id))
  );

CREATE POLICY "Users can delete budgets for their companies"
  ON public.budget_2026
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL 
    AND (company_id IS NULL OR public.user_has_company_access(company_id))
  );

-- Trigger for updated_at
CREATE TRIGGER update_budget_2026_updated_at
  BEFORE UPDATE ON public.budget_2026
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();