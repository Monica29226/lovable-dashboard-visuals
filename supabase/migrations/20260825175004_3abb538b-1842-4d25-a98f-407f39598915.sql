CREATE TABLE public.tax_brackets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country text NOT NULL DEFAULT 'CR',
  fiscal_period text NOT NULL,
  taxpayer_profile text NOT NULL,
  profile_label text,
  lower_limit numeric NOT NULL DEFAULT 0,
  upper_limit numeric,
  rate numeric NOT NULL DEFAULT 0,
  display_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tax_brackets TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tax_brackets TO authenticated;
GRANT ALL ON public.tax_brackets TO service_role;

ALTER TABLE public.tax_brackets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read tax brackets"
ON public.tax_brackets FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can insert tax brackets"
ON public.tax_brackets FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'contador'));

CREATE POLICY "Staff can update tax brackets"
ON public.tax_brackets FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'contador'));

CREATE POLICY "Staff can delete tax brackets"
ON public.tax_brackets FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'contador'));

CREATE TRIGGER update_tax_brackets_updated_at
BEFORE UPDATE ON public.tax_brackets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE UNIQUE INDEX tax_brackets_unique_bracket
ON public.tax_brackets (country, fiscal_period, taxpayer_profile, lower_limit);

INSERT INTO public.tax_brackets (country, fiscal_period, taxpayer_profile, profile_label, lower_limit, upper_limit, rate, display_order)
VALUES
  ('CR', '2026', 'persona_fisica_lucrativa', 'Persona física con actividades lucrativas', 0, 6244000, 0, 1),
  ('CR', '2026', 'persona_fisica_lucrativa', 'Persona física con actividades lucrativas', 6244000, 8329000, 0.10, 2),
  ('CR', '2026', 'persona_fisica_lucrativa', 'Persona física con actividades lucrativas', 8329000, 10414000, 0.15, 3),
  ('CR', '2026', 'persona_fisica_lucrativa', 'Persona física con actividades lucrativas', 10414000, 20872000, 0.20, 4),
  ('CR', '2026', 'persona_fisica_lucrativa', 'Persona física con actividades lucrativas', 20872000, NULL, 0.25, 5);