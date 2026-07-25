
-- =========================================================
-- submittal_intelligence
-- =========================================================
CREATE TABLE public.submittal_intelligence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('permit', 'hoa')),
  permit_id UUID REFERENCES public.permits(id) ON DELETE CASCADE,
  hoa_submittal_id UUID REFERENCES public.hoa_submittals(id) ON DELETE CASCADE,
  municipality_slug TEXT,
  municipality_name TEXT,
  jurisdiction TEXT,
  trades JSONB NOT NULL DEFAULT '[]'::jsonb,
  scope_of_work TEXT,
  submitted_at TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  days_to_first_response NUMERIC,
  days_to_resolution NUMERIC,
  permit_fee_cents BIGINT,
  final_outcome TEXT CHECK (final_outcome IN ('approved', 'denied', 'expired', 'pending', 'in_review', 'corrections')),
  hoa_community TEXT,
  homeowner_name TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_submittal_intel_muni ON public.submittal_intelligence (municipality_slug);
CREATE INDEX idx_submittal_intel_tenant ON public.submittal_intelligence (tenant_id);
CREATE INDEX idx_submittal_intel_permit ON public.submittal_intelligence (permit_id);
CREATE INDEX idx_submittal_intel_hoa ON public.submittal_intelligence (hoa_submittal_id);
CREATE INDEX idx_submittal_intel_outcome ON public.submittal_intelligence (final_outcome);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.submittal_intelligence TO authenticated;
GRANT ALL ON public.submittal_intelligence TO service_role;

ALTER TABLE public.submittal_intelligence ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "intel admin full access"
  ON public.submittal_intelligence FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Tenant members: see & manage their tenant's rows
CREATE POLICY "intel tenant select"
  ON public.submittal_intelligence FOR SELECT
  TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "intel tenant insert"
  ON public.submittal_intelligence FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "intel tenant update"
  ON public.submittal_intelligence FOR UPDATE
  TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE TRIGGER trg_intel_touch
  BEFORE UPDATE ON public.submittal_intelligence
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- =========================================================
-- submittal_corrections
-- =========================================================
CREATE TABLE public.submittal_corrections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intelligence_id UUID REFERENCES public.submittal_intelligence(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  municipality_slug TEXT,
  municipality_name TEXT,
  trade TEXT,
  source TEXT NOT NULL DEFAULT 'municipality' CHECK (source IN ('municipality', 'hoa', 'private_provider')),
  correction_text TEXT NOT NULL,
  code_section TEXT,
  document_type_flagged TEXT,
  reason_category TEXT,
  resolution_notes TEXT,
  occurrences INTEGER NOT NULL DEFAULT 1,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  logged_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_corrections_muni ON public.submittal_corrections (municipality_slug);
CREATE INDEX idx_corrections_trade ON public.submittal_corrections (trade);
CREATE INDEX idx_corrections_intel ON public.submittal_corrections (intelligence_id);
CREATE INDEX idx_corrections_muni_trade ON public.submittal_corrections (municipality_slug, trade);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.submittal_corrections TO authenticated;
GRANT ALL ON public.submittal_corrections TO service_role;

ALTER TABLE public.submittal_corrections ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "corr admin full access"
  ON public.submittal_corrections FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- All authenticated users may READ corrections platform-wide — this is the
-- shared intelligence pool that powers Victoria's cross-tenant warnings.
-- No PII lives here (correction text describes code/document issues only).
CREATE POLICY "corr read all authed"
  ON public.submittal_corrections FOR SELECT
  TO authenticated
  USING (true);

-- Tenants may insert corrections tied to their own intelligence rows
CREATE POLICY "corr tenant insert"
  ON public.submittal_corrections FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IS NULL
    OR tenant_id = public.current_tenant_id()
  );

CREATE TRIGGER trg_corr_touch
  BEFORE UPDATE ON public.submittal_corrections
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- =========================================================
-- Aggregation helpers (SECURITY DEFINER so GCs can read
-- cross-tenant averages without exposing raw rows)
-- =========================================================
CREATE OR REPLACE FUNCTION public.intel_municipality_stats(_slug TEXT)
RETURNS TABLE (
  sample_size INTEGER,
  avg_days_to_response NUMERIC,
  avg_days_to_resolution NUMERIC,
  avg_permit_fee_cents NUMERIC,
  approval_rate NUMERIC
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*)::int AS sample_size,
    ROUND(AVG(days_to_first_response)::numeric, 1) AS avg_days_to_response,
    ROUND(AVG(days_to_resolution)::numeric, 1) AS avg_days_to_resolution,
    ROUND(AVG(permit_fee_cents)::numeric, 0) AS avg_permit_fee_cents,
    ROUND(
      (COUNT(*) FILTER (WHERE final_outcome = 'approved'))::numeric
        / NULLIF(COUNT(*) FILTER (WHERE final_outcome IN ('approved','denied')), 0),
      2
    ) AS approval_rate
  FROM public.submittal_intelligence
  WHERE municipality_slug = _slug
    AND source = 'permit';
$$;

CREATE OR REPLACE FUNCTION public.intel_common_corrections(_slug TEXT, _trade TEXT DEFAULT NULL, _limit INT DEFAULT 10)
RETURNS TABLE (
  id UUID,
  correction_text TEXT,
  code_section TEXT,
  document_type_flagged TEXT,
  trade TEXT,
  occurrences INTEGER,
  last_seen_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, correction_text, code_section, document_type_flagged, trade, occurrences, last_seen_at
  FROM public.submittal_corrections
  WHERE municipality_slug = _slug
    AND (_trade IS NULL OR trade = _trade)
  ORDER BY occurrences DESC, last_seen_at DESC
  LIMIT _limit;
$$;

GRANT EXECUTE ON FUNCTION public.intel_municipality_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.intel_common_corrections(TEXT, TEXT, INT) TO authenticated;
