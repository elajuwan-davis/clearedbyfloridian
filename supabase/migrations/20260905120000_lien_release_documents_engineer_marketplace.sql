-- Statutory lien releases (Fla. Stat. § 713.20) + blind engineer's letter marketplace.
--
-- NOTE ON NAMING: public.lien_releases already exists (per-subcontractor release
-- tracking keyed by permit_id + sub_key, created in 20260725191353). The statutory
-- release *documents* built here are a different record — one row per generated,
-- notarized § 713.20 form — so they live in public.lien_release_documents.
--
-- "project" in the API surface is a row in public.permits.

-- ---------------------------------------------------------------------------
-- LIEN RELEASE DOCUMENTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lien_release_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.permits(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  release_type TEXT NOT NULL CHECK (release_type IN (
    'partial_conditional',
    'partial_unconditional',
    'final_conditional',
    'final_unconditional'
  )),
  claimant_name TEXT NOT NULL,
  claimant_address TEXT,
  owner_name TEXT NOT NULL,
  property_address TEXT NOT NULL,
  through_date DATE,
  amount NUMERIC(14, 2),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'pending_notarization',
    'notarized',
    'complete'
  )),
  bluenotary_session_id TEXT,
  document_url TEXT,
  signed_document_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lien_release_documents_project_idx
  ON public.lien_release_documents (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lien_release_documents_tenant_idx
  ON public.lien_release_documents (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lien_release_documents_session_idx
  ON public.lien_release_documents (bluenotary_session_id);

ALTER TABLE public.lien_release_documents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'lien_release_documents' AND policyname = 'lien_release_documents_select'
  ) THEN
    CREATE POLICY "lien_release_documents_select" ON public.lien_release_documents
      FOR SELECT TO authenticated
      USING (public.is_admin() OR tenant_id = public.current_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'lien_release_documents' AND policyname = 'lien_release_documents_insert'
  ) THEN
    CREATE POLICY "lien_release_documents_insert" ON public.lien_release_documents
      FOR INSERT TO authenticated
      WITH CHECK (public.is_admin() OR tenant_id = public.current_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'lien_release_documents' AND policyname = 'lien_release_documents_update'
  ) THEN
    CREATE POLICY "lien_release_documents_update" ON public.lien_release_documents
      FOR UPDATE TO authenticated
      USING (public.is_admin() OR tenant_id = public.current_tenant_id())
      WITH CHECK (public.is_admin() OR tenant_id = public.current_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'lien_release_documents' AND policyname = 'lien_release_documents_delete'
  ) THEN
    CREATE POLICY "lien_release_documents_delete" ON public.lien_release_documents
      FOR DELETE TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lien_release_documents TO authenticated;
GRANT ALL ON public.lien_release_documents TO service_role;

DROP TRIGGER IF EXISTS lien_release_documents_touch ON public.lien_release_documents;
CREATE TRIGGER lien_release_documents_touch BEFORE UPDATE ON public.lien_release_documents
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- Private bucket for generated + notarized release PDFs.
-- Path convention: {tenant_id}/{release_id}/{filename}.pdf
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('lien-releases', 'lien-releases', false, 20971520, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = COALESCE(EXCLUDED.file_size_limit, 20971520),
  allowed_mime_types = COALESCE(EXCLUDED.allowed_mime_types, ARRAY['application/pdf']);

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage'
      AND tablename = 'objects' AND policyname = 'lien_releases_select'
  ) THEN
    CREATE POLICY "lien_releases_select" ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = 'lien-releases'
        AND (
          public.is_admin()
          OR (storage.foldername(name))[1] = public.current_tenant_id()::text
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage'
      AND tablename = 'objects' AND policyname = 'lien_releases_insert'
  ) THEN
    CREATE POLICY "lien_releases_insert" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'lien-releases'
        AND (
          public.is_admin()
          OR (storage.foldername(name))[1] = public.current_tenant_id()::text
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage'
      AND tablename = 'objects' AND policyname = 'lien_releases_delete'
  ) THEN
    CREATE POLICY "lien_releases_delete" ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'lien-releases' AND public.is_admin());
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- ENGINEER'S LETTER MARKETPLACE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.engineer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  license_number TEXT NOT NULL,
  license_state TEXT NOT NULL DEFAULT 'FL',
  specialties TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS engineer_profiles_active_idx
  ON public.engineer_profiles (is_active);

CREATE TABLE IF NOT EXISTS public.engineer_letter_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.permits(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  requested_inspections TEXT[] NOT NULL DEFAULT '{}',
  inspection_photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  scope_description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'assigned', 'in_review', 'complete', 'cancelled'
  )),
  assigned_engineer_id UUID REFERENCES public.engineer_profiles(id) ON DELETE SET NULL,
  final_document_url TEXT,
  admin_notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS engineer_letter_requests_tenant_idx
  ON public.engineer_letter_requests (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS engineer_letter_requests_status_idx
  ON public.engineer_letter_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS engineer_letter_requests_assigned_idx
  ON public.engineer_letter_requests (assigned_engineer_id);

CREATE TABLE IF NOT EXISTS public.engineer_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.engineer_letter_requests(id) ON DELETE CASCADE,
  engineer_id UUID NOT NULL REFERENCES public.engineer_profiles(id) ON DELETE CASCADE,
  fee_amount NUMERIC(12, 2) NOT NULL,
  turnaround_days INTEGER NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'submitted', 'accepted', 'rejected'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (request_id, engineer_id)
);

CREATE INDEX IF NOT EXISTS engineer_bids_request_idx ON public.engineer_bids (request_id);
CREATE INDEX IF NOT EXISTS engineer_bids_engineer_idx ON public.engineer_bids (engineer_id, created_at DESC);

DROP TRIGGER IF EXISTS engineer_letter_requests_touch ON public.engineer_letter_requests;
CREATE TRIGGER engineer_letter_requests_touch BEFORE UPDATE ON public.engineer_letter_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- Engineer identity helper: the engineer_profiles row for the calling user.
CREATE OR REPLACE FUNCTION public.current_engineer_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.engineer_profiles
  WHERE user_id = auth.uid() AND is_active LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.current_engineer_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_engineer_id() TO authenticated;

ALTER TABLE public.engineer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engineer_letter_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engineer_bids ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- engineer_profiles: an engineer sees/edits only their own row; admins see all.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'engineer_profiles' AND policyname = 'engineer_profiles_select'
  ) THEN
    CREATE POLICY "engineer_profiles_select" ON public.engineer_profiles
      FOR SELECT TO authenticated
      USING (public.is_admin() OR user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'engineer_profiles' AND policyname = 'engineer_profiles_update'
  ) THEN
    CREATE POLICY "engineer_profiles_update" ON public.engineer_profiles
      FOR UPDATE TO authenticated
      USING (public.is_admin() OR user_id = auth.uid())
      WITH CHECK (public.is_admin() OR user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'engineer_profiles' AND policyname = 'engineer_profiles_write_admin'
  ) THEN
    CREATE POLICY "engineer_profiles_write_admin" ON public.engineer_profiles
      FOR INSERT TO authenticated
      WITH CHECK (public.is_admin());
  END IF;

  -- engineer_letter_requests: the requesting tenant and admins only.
  -- Engineers deliberately get NO row access here: the base row carries
  -- project_id, which joins to identifying permit data. They read the blind
  -- view below (and the API only ever returns blind columns).
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'engineer_letter_requests' AND policyname = 'engineer_letter_requests_select'
  ) THEN
    CREATE POLICY "engineer_letter_requests_select" ON public.engineer_letter_requests
      FOR SELECT TO authenticated
      USING (public.is_admin() OR tenant_id = public.current_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'engineer_letter_requests' AND policyname = 'engineer_letter_requests_insert'
  ) THEN
    CREATE POLICY "engineer_letter_requests_insert" ON public.engineer_letter_requests
      FOR INSERT TO authenticated
      WITH CHECK (public.is_admin() OR tenant_id = public.current_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'engineer_letter_requests' AND policyname = 'engineer_letter_requests_update_admin'
  ) THEN
    CREATE POLICY "engineer_letter_requests_update_admin" ON public.engineer_letter_requests
      FOR UPDATE TO authenticated
      USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;

  -- engineer_bids: an engineer sees only their own bids; admins see all.
  -- Contractors never see raw bids (admin brokers the assignment).
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'engineer_bids' AND policyname = 'engineer_bids_select'
  ) THEN
    CREATE POLICY "engineer_bids_select" ON public.engineer_bids
      FOR SELECT TO authenticated
      USING (public.is_admin() OR engineer_id = public.current_engineer_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'engineer_bids' AND policyname = 'engineer_bids_insert'
  ) THEN
    CREATE POLICY "engineer_bids_insert" ON public.engineer_bids
      FOR INSERT TO authenticated
      WITH CHECK (public.is_admin() OR engineer_id = public.current_engineer_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'engineer_bids' AND policyname = 'engineer_bids_update_admin'
  ) THEN
    CREATE POLICY "engineer_bids_update_admin" ON public.engineer_bids
      FOR UPDATE TO authenticated
      USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
END $$;

GRANT SELECT, UPDATE ON public.engineer_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.engineer_letter_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.engineer_bids TO authenticated;
GRANT ALL ON public.engineer_profiles TO service_role;
GRANT ALL ON public.engineer_letter_requests TO service_role;
GRANT ALL ON public.engineer_bids TO service_role;

-- Blind engineer read path: scope + photos only. No project_id, tenant_id, GC
-- name, trade, contact details, or admin notes are reachable through it. Rows
-- are limited to open requests plus the engineer's own assignments.
CREATE OR REPLACE FUNCTION public.engineer_blind_requests(_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  requested_inspections text[],
  inspection_photos jsonb,
  scope_description text,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT r.id, r.requested_inspections, r.inspection_photos, r.scope_description,
         r.status, r.created_at, r.updated_at
  FROM public.engineer_letter_requests r
  WHERE public.current_engineer_id() IS NOT NULL
    AND (r.status = 'open' OR r.assigned_engineer_id = public.current_engineer_id())
    AND (_id IS NULL OR r.id = _id)
  ORDER BY r.created_at DESC
$$;

REVOKE ALL ON FUNCTION public.engineer_blind_requests(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.engineer_blind_requests(uuid) TO authenticated;
