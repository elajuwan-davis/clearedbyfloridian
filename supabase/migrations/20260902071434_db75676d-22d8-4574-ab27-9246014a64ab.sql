ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_crm text,
  ADD COLUMN IF NOT EXISTS current_crm_other text,
  ADD COLUMN IF NOT EXISTS crm_source text,
  ADD COLUMN IF NOT EXISTS crm_captured_at timestamptz;

CREATE TABLE IF NOT EXISTS public.integration_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  platform text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.integration_requests TO authenticated;
GRANT ALL ON public.integration_requests TO service_role;

ALTER TABLE public.integration_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read integration requests" ON public.integration_requests;
CREATE POLICY "Admins can read integration requests"
  ON public.integration_requests FOR SELECT
  TO authenticated
  USING (public.is_admin());