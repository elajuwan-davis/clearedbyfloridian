
CREATE TABLE public.feature_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type text NOT NULL,
  title text NOT NULL,
  areas jsonb NOT NULL DEFAULT '[]'::jsonb,
  description text NOT NULL,
  workflow_impact text NOT NULL,
  priority text NOT NULL,
  status text NOT NULL DEFAULT 'under_review',
  internal_note text,
  public_response text,
  pinned boolean NOT NULL DEFAULT false,
  shipped_notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.feature_requests TO authenticated;
GRANT ALL ON public.feature_requests TO service_role;
ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fr auth read all" ON public.feature_requests
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "fr auth insert own" ON public.feature_requests
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "fr admin update" ON public.feature_requests
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "fr admin delete" ON public.feature_requests
  FOR DELETE TO authenticated USING (public.is_admin());

CREATE TRIGGER touch_feature_requests
  BEFORE UPDATE ON public.feature_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

CREATE INDEX idx_fr_status ON public.feature_requests(status);
CREATE INDEX idx_fr_pinned ON public.feature_requests(pinned) WHERE pinned = true;

CREATE TABLE public.feature_request_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.feature_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.feature_request_votes TO authenticated;
GRANT ALL ON public.feature_request_votes TO service_role;
ALTER TABLE public.feature_request_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "frv auth read all" ON public.feature_request_votes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "frv auth insert own" ON public.feature_request_votes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "frv auth delete own" ON public.feature_request_votes
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX idx_frv_request ON public.feature_request_votes(request_id);
CREATE INDEX idx_frv_user ON public.feature_request_votes(user_id);
