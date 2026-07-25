
ALTER TABLE public.subcontractors
  ADD COLUMN IF NOT EXISTS coi_status text,
  ADD COLUMN IF NOT EXISTS coi_extracted jsonb,
  ADD COLUMN IF NOT EXISTS coi_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS coi_flags jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS w9_status text,
  ADD COLUMN IF NOT EXISTS w9_extracted jsonb,
  ADD COLUMN IF NOT EXISTS w9_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS w9_flags jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS license_status text;

CREATE TABLE IF NOT EXISTS public.gc_coi_minimums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid,
  gc_name text NOT NULL DEFAULT 'Default',
  gl_per_occurrence_cents bigint NOT NULL DEFAULT 100000000,
  gl_aggregate_cents bigint NOT NULL DEFAULT 200000000,
  umbrella_cents bigint NOT NULL DEFAULT 200000000,
  wc_required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gc_coi_minimums TO authenticated;
GRANT ALL ON public.gc_coi_minimums TO service_role;

ALTER TABLE public.gc_coi_minimums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read gc minimums"
  ON public.gc_coi_minimums FOR SELECT
  TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated write gc minimums"
  ON public.gc_coi_minimums FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP TRIGGER IF EXISTS trg_gc_coi_minimums_updated_at ON public.gc_coi_minimums;
CREATE TRIGGER trg_gc_coi_minimums_updated_at
  BEFORE UPDATE ON public.gc_coi_minimums
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

INSERT INTO public.gc_coi_minimums (gc_name, gl_per_occurrence_cents, gl_aggregate_cents, umbrella_cents, wc_required)
SELECT 'Default', 100000000, 200000000, 200000000, true
WHERE NOT EXISTS (SELECT 1 FROM public.gc_coi_minimums WHERE gc_name = 'Default');
