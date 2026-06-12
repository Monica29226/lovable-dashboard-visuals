ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'contador';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cliente';

ALTER TABLE public.quickbooks_companies
  ADD COLUMN IF NOT EXISTS razon_social text,
  ADD COLUMN IF NOT EXISTS nombre_comercial text,
  ADD COLUMN IF NOT EXISTS cedula_juridica text,
  ADD COLUMN IF NOT EXISTS actividad_economica text,
  ADD COLUMN IF NOT EXISTS regimen_tributario text,
  ADD COLUMN IF NOT EXISTS correo_principal text,
  ADD COLUMN IF NOT EXISTS telefono text,
  ADD COLUMN IF NOT EXISTS direccion text,
  ADD COLUMN IF NOT EXISTS representante_legal text,
  ADD COLUMN IF NOT EXISTS moneda_funcional text DEFAULT 'CRC',
  ADD COLUMN IF NOT EXISTS responsable_user_id uuid,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;