-- Create oauth_tokens table for QuickBooks OAuth credentials
CREATE TABLE IF NOT EXISTS public.oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  realm_id TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create financial_data table for storing QB financial reports
CREATE TABLE IF NOT EXISTS public.financial_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realm_id TEXT NOT NULL,
  report_type TEXT NOT NULL, -- 'balance_sheet', 'profit_loss', 'invoice', 'expense'
  period TEXT NOT NULL, -- e.g., '2025-01', 'Q1-2025'
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sync_logs table for tracking synchronization history
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realm_id TEXT NOT NULL,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL, -- 'success', 'error', 'in_progress'
  error_message TEXT,
  records_synced INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for oauth_tokens
CREATE POLICY "Users can view their own tokens"
  ON public.oauth_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens"
  ON public.oauth_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
  ON public.oauth_tokens
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for financial_data
CREATE POLICY "Users can view financial data for their realm"
  ON public.financial_data
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.oauth_tokens
      WHERE oauth_tokens.realm_id = financial_data.realm_id
      AND oauth_tokens.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert financial data"
  ON public.financial_data
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for sync_logs
CREATE POLICY "Users can view sync logs for their realm"
  ON public.sync_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.oauth_tokens
      WHERE oauth_tokens.realm_id = sync_logs.realm_id
      AND oauth_tokens.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert sync logs"
  ON public.sync_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id ON public.oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_realm_id ON public.oauth_tokens(realm_id);
CREATE INDEX IF NOT EXISTS idx_financial_data_realm_id ON public.financial_data(realm_id);
CREATE INDEX IF NOT EXISTS idx_financial_data_report_type ON public.financial_data(report_type);
CREATE INDEX IF NOT EXISTS idx_sync_logs_realm_id ON public.sync_logs(realm_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_oauth_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER oauth_tokens_updated_at
  BEFORE UPDATE ON public.oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_oauth_tokens_updated_at();