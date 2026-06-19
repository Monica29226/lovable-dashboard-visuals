-- 1. Drop the unused oauth_tokens table (the real system uses quickbooks_tokens).
DROP TABLE IF EXISTS public.oauth_tokens CASCADE;
DROP FUNCTION IF EXISTS public.update_oauth_tokens_updated_at() CASCADE;

-- 2. Reschedule the nightly QuickBooks sync to authenticate with the
--    vault-stored service-role key (same pattern as the email cron),
--    instead of the plain anon key which caused 401 errors every night.
DO $$
DECLARE
  v_key text;
  v_jobid int;
BEGIN
  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets
  WHERE name = 'email_queue_service_role_key'
  LIMIT 1;

  IF v_key IS NULL THEN
    RAISE EXCEPTION 'Service-role key not found in vault (email_queue_service_role_key)';
  END IF;

  -- Remove any existing QuickBooks nightly sync jobs (e.g. the old jobid using anon key)
  FOR v_jobid IN
    SELECT jobid FROM cron.job WHERE command LIKE '%quickbooks-sync-all%'
  LOOP
    PERFORM cron.unschedule(v_jobid);
  END LOOP;

  PERFORM cron.schedule(
    'quickbooks-sync-all-nightly',
    '0 2 * * *',
    format($q$
      SELECT net.http_post(
        url := 'https://flwcasyydljhrjlrtzlz.supabase.co/functions/v1/quickbooks-sync-all',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer %s',
          'apikey', '%s'
        ),
        body := '{}'::jsonb
      );
    $q$, v_key, v_key)
  );
END $$;