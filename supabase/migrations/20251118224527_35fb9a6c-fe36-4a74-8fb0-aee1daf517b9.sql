-- Tabla para historial de cambios del presupuesto (auditoría)
CREATE TABLE IF NOT EXISTS public.budget_2026_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_row_id UUID REFERENCES public.budget_2026(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.quickbooks_companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  field_changed TEXT NOT NULL,
  old_value NUMERIC,
  new_value NUMERIC,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.budget_2026_audit ENABLE ROW LEVEL SECURITY;

-- Política para ver el historial (usuarios con acceso a la empresa)
CREATE POLICY "Users can view audit logs for their companies"
ON public.budget_2026_audit
FOR SELECT
USING (
  (auth.uid() IS NOT NULL) AND 
  ((company_id IS NULL) OR user_has_company_access(company_id))
);

-- Política para insertar auditoría (usuarios con acceso a la empresa)
CREATE POLICY "Users can insert audit logs for their companies"
ON public.budget_2026_audit
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL) AND 
  ((company_id IS NULL) OR user_has_company_access(company_id))
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_budget_audit_company ON public.budget_2026_audit(company_id);
CREATE INDEX IF NOT EXISTS idx_budget_audit_user ON public.budget_2026_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_audit_date ON public.budget_2026_audit(changed_at DESC);

-- Comentarios
COMMENT ON TABLE public.budget_2026_audit IS 'Registro de cambios para auditoría del presupuesto 2026';
COMMENT ON COLUMN public.budget_2026_audit.field_changed IS 'Campo modificado (january, february, etc.)';
COMMENT ON COLUMN public.budget_2026_audit.old_value IS 'Valor anterior del campo';
COMMENT ON COLUMN public.budget_2026_audit.new_value IS 'Valor nuevo del campo';