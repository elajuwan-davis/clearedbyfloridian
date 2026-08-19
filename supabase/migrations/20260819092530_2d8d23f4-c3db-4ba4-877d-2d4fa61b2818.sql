-- Investor deck access: allowed email domains
CREATE TABLE public.investor_allowed_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.investor_allowed_domains TO anon;
GRANT SELECT ON public.investor_allowed_domains TO authenticated;
GRANT ALL ON public.investor_allowed_domains TO service_role;

ALTER TABLE public.investor_allowed_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can check allowed investor domains"
  ON public.investor_allowed_domains
  FOR SELECT
  USING (true);

INSERT INTO public.investor_allowed_domains (domain, label)
VALUES ('clearedinc.com', 'Cleard (internal)');

-- Investor deck access: one-time access codes
CREATE TABLE public.investor_access_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Column-scoped grants: the public may read only validation columns,
-- and may only write the burn columns.
GRANT SELECT (code, used, expires_at) ON public.investor_access_codes TO anon;
GRANT UPDATE (used, used_at) ON public.investor_access_codes TO anon;
GRANT SELECT (code, used, expires_at) ON public.investor_access_codes TO authenticated;
GRANT UPDATE (used, used_at) ON public.investor_access_codes TO authenticated;
GRANT ALL ON public.investor_access_codes TO service_role;

ALTER TABLE public.investor_access_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can validate an unused investor code"
  ON public.investor_access_codes
  FOR SELECT
  USING (used = false AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Anyone can burn an unused investor code"
  ON public.investor_access_codes
  FOR UPDATE
  USING (used = false AND (expires_at IS NULL OR expires_at > now()))
  WITH CHECK (used = true);