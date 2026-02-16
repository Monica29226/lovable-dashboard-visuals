
-- Table for available domains
CREATE TABLE public.domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_name text NOT NULL UNIQUE,
  display_name text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active domains"
  ON public.domains FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Admins can manage domains"
  ON public.domains FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add selected_domain_id to profiles
ALTER TABLE public.profiles ADD COLUMN selected_domain_id uuid REFERENCES public.domains(id);

-- Seed initial domains
INSERT INTO public.domains (domain_name, display_name, is_active) VALUES
  ('calderon.cr', 'Calderón CR', true),
  ('aureon.cr', 'Aureon CR', true),
  ('horizontepositivo.org', 'Horizonte Positivo', true);
