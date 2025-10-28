-- Actualizar políticas RLS para quickbooks_companies para permitir acceso más simple
DROP POLICY IF EXISTS "Authenticated users view their companies" ON quickbooks_companies;
DROP POLICY IF EXISTS "Service role full access to companies" ON quickbooks_companies;

-- Permitir que cualquier usuario autenticado pueda ver todas las empresas
CREATE POLICY "Anyone can view companies"
  ON quickbooks_companies
  FOR SELECT
  USING (true);

-- Permitir que el service role tenga acceso completo
CREATE POLICY "Service role full access"
  ON quickbooks_companies
  FOR ALL
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);