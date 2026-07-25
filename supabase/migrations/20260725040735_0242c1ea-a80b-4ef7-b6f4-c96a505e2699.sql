
CREATE TABLE public.submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  permit_id uuid NOT NULL REFERENCES public.permits(id) ON DELETE CASCADE,
  submitted_by uuid,
  type text NOT NULL DEFAULT 'full',
  trades_included jsonb NOT NULL DEFAULT '[]'::jsonb,
  trades_pending jsonb NOT NULL DEFAULT '[]'::jsonb,
  fee_cents bigint NOT NULL DEFAULT 0,
  package_manifest jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  status text NOT NULL DEFAULT 'received',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view all submissions"
  ON public.submissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert submissions"
  ON public.submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update submissions"
  ON public.submissions FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can delete submissions"
  ON public.submissions FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE TRIGGER trg_submissions_touch_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

CREATE INDEX idx_submissions_permit_id ON public.submissions(permit_id);
CREATE INDEX idx_submissions_created_at ON public.submissions(created_at DESC);
