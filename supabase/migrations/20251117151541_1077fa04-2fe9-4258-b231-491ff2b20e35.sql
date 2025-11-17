-- Fix search_path for oauth_tokens trigger function
DROP FUNCTION IF EXISTS update_oauth_tokens_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_oauth_tokens_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER oauth_tokens_updated_at
  BEFORE UPDATE ON public.oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_oauth_tokens_updated_at();