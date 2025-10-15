-- Tabla para almacenar los tokens de autenticación de QuickBooks
CREATE TABLE IF NOT EXISTS public.quickbooks_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realm_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla para almacenar facturas sincronizadas
CREATE TABLE IF NOT EXISTS public.quickbooks_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qb_invoice_id TEXT NOT NULL UNIQUE,
  doc_number TEXT,
  customer_name TEXT,
  total_amount DECIMAL(15,2),
  balance DECIMAL(15,2),
  due_date DATE,
  txn_date DATE,
  status TEXT,
  synced_at TIMESTAMPTZ DEFAULT now(),
  raw_data JSONB
);

-- Tabla para almacenar gastos
CREATE TABLE IF NOT EXISTS public.quickbooks_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qb_expense_id TEXT NOT NULL UNIQUE,
  doc_number TEXT,
  payee_name TEXT,
  total_amount DECIMAL(15,2),
  txn_date DATE,
  account_ref TEXT,
  payment_type TEXT,
  synced_at TIMESTAMPTZ DEFAULT now(),
  raw_data JSONB
);

-- Tabla para almacenar clientes
CREATE TABLE IF NOT EXISTS public.quickbooks_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qb_customer_id TEXT NOT NULL UNIQUE,
  display_name TEXT,
  company_name TEXT,
  primary_email TEXT,
  primary_phone TEXT,
  balance DECIMAL(15,2),
  active BOOLEAN DEFAULT true,
  synced_at TIMESTAMPTZ DEFAULT now(),
  raw_data JSONB
);

-- Tabla para almacenar datos de P&L
CREATE TABLE IF NOT EXISTS public.quickbooks_profit_loss (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_income DECIMAL(15,2),
  total_expenses DECIMAL(15,2),
  net_income DECIMAL(15,2),
  synced_at TIMESTAMPTZ DEFAULT now(),
  raw_data JSONB,
  UNIQUE(report_date, start_date, end_date)
);

-- Tabla para almacenar datos de Balance General
CREATE TABLE IF NOT EXISTS public.quickbooks_balance_sheet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE NOT NULL UNIQUE,
  total_assets DECIMAL(15,2),
  total_liabilities DECIMAL(15,2),
  total_equity DECIMAL(15,2),
  synced_at TIMESTAMPTZ DEFAULT now(),
  raw_data JSONB
);

-- Tabla para almacenar presupuestos
CREATE TABLE IF NOT EXISTS public.quickbooks_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qb_budget_id TEXT NOT NULL UNIQUE,
  name TEXT,
  start_date DATE,
  end_date DATE,
  active BOOLEAN DEFAULT true,
  synced_at TIMESTAMPTZ DEFAULT now(),
  raw_data JSONB
);

-- Habilitar RLS en todas las tablas (datos públicos de solo lectura para el dashboard)
ALTER TABLE public.quickbooks_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quickbooks_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quickbooks_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quickbooks_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quickbooks_profit_loss ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quickbooks_balance_sheet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quickbooks_budgets ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: permitir lectura pública (ya que es un dashboard)
CREATE POLICY "Allow public read access to invoices"
ON public.quickbooks_invoices FOR SELECT
USING (true);

CREATE POLICY "Allow public read access to expenses"
ON public.quickbooks_expenses FOR SELECT
USING (true);

CREATE POLICY "Allow public read access to customers"
ON public.quickbooks_customers FOR SELECT
USING (true);

CREATE POLICY "Allow public read access to profit_loss"
ON public.quickbooks_profit_loss FOR SELECT
USING (true);

CREATE POLICY "Allow public read access to balance_sheet"
ON public.quickbooks_balance_sheet FOR SELECT
USING (true);

CREATE POLICY "Allow public read access to budgets"
ON public.quickbooks_budgets FOR SELECT
USING (true);

-- Los tokens solo son accesibles por funciones del servidor
CREATE POLICY "Tokens only accessible by service role"
ON public.quickbooks_tokens FOR ALL
USING (false);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quickbooks_tokens_updated_at
BEFORE UPDATE ON public.quickbooks_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();