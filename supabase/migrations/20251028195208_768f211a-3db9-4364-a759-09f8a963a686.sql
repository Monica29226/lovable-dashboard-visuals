-- Crear tabla quickbooks_companies
CREATE TABLE public.quickbooks_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  realm_id TEXT,
  is_connected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en quickbooks_companies
ALTER TABLE public.quickbooks_companies ENABLE ROW LEVEL SECURITY;

-- Política para que usuarios autenticados puedan ver empresas
CREATE POLICY "Authenticated users can view companies"
ON public.quickbooks_companies
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'user'::app_role));

-- Política para que admins puedan gestionar empresas
CREATE POLICY "Admins can manage companies"
ON public.quickbooks_companies
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Añadir columna company_id a quickbooks_tokens
ALTER TABLE public.quickbooks_tokens 
ADD COLUMN company_id UUID REFERENCES public.quickbooks_companies(id) ON DELETE CASCADE;

-- Crear trigger para actualizar updated_at
CREATE TRIGGER update_quickbooks_companies_updated_at
BEFORE UPDATE ON public.quickbooks_companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar Demo Lab con credenciales actuales
INSERT INTO public.quickbooks_companies (company_name, client_id, client_secret, is_connected, realm_id)
VALUES (
  'Demo Lab', 
  'ABJtnGd9HmPgB0BxV3bZgAhYCpgZ04HgppsjF2XJheCvBhPlx9',
  '0JGmOXOpjOPKS5Kw1gLgEEhEbOLxuiJ2DWdJBZ7S',
  true,
  (SELECT realm_id FROM public.quickbooks_tokens ORDER BY created_at DESC LIMIT 1)
)
ON CONFLICT (company_name) DO NOTHING;

-- Asociar tokens existentes a Demo Lab
UPDATE public.quickbooks_tokens 
SET company_id = (SELECT id FROM public.quickbooks_companies WHERE company_name = 'Demo Lab')
WHERE company_id IS NULL;

-- Insertar Horizonte Positivo
INSERT INTO public.quickbooks_companies (company_name, client_id, client_secret, is_connected)
VALUES (
  'Horizonte Positivo',
  'ABxMJ1wImHflJbMbNPjeNQIVqI47RB0TUG0sUcQWdlrj14C6mv',
  'akkM6d84OGGBP3oB9sPOTZE927pemNgkcQLvSPZG',
  false
)
ON CONFLICT (company_name) DO NOTHING;