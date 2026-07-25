
CREATE TABLE public.gc_portal_logins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  municipality_slug text NOT NULL,
  city_name text NOT NULL,
  username_ciphertext text NOT NULL,
  password_ciphertext text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, municipality_slug)
);

GRANT ALL ON public.gc_portal_logins TO service_role;

ALTER TABLE public.gc_portal_logins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny all direct access"
  ON public.gc_portal_logins AS RESTRICTIVE
  FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE TRIGGER gc_portal_logins_touch_updated_at
  BEFORE UPDATE ON public.gc_portal_logins
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
