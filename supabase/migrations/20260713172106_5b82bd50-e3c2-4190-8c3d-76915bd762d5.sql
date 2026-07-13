GRANT SELECT ON public.exchange_rates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exchange_rates TO authenticated;
GRANT ALL ON public.exchange_rates TO service_role;