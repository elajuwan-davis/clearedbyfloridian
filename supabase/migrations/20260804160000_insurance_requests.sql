-- Insurance requests (COI + sub insurance update) with optional COI attachment.
-- Reuses private storage bucket `coi-documents` (created in 20260803130000).

CREATE TABLE IF NOT EXISTS public.insurance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type TEXT NOT NULL
    CHECK (request_type IN ('coi_request', 'sub_update')),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  permit_id UUID REFERENCES public.permits(id) ON DELETE SET NULL,
  subcontractor_id UUID REFERENCES public.subcontractors(id) ON DELETE SET NULL,
  -- COI-request requester fields (nullable for sub_update)
  project_name TEXT,
  project_address TEXT,
  holder_name TEXT,
  holder_address TEXT,
  additional_insured BOOLEAN NOT NULL DEFAULT false,
  -- Free-text details (required for sub_update; optional notes for coi_request)
  details TEXT,
  attached_file_path TEXT,
  attached_file_name TEXT,
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'in_progress', 'resolved')),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS insurance_requests_tenant_idx
  ON public.insurance_requests (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS insurance_requests_status_idx
  ON public.insurance_requests (status);
CREATE INDEX IF NOT EXISTS insurance_requests_sub_idx
  ON public.insurance_requests (subcontractor_id);

ALTER TABLE public.insurance_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'insurance_requests'
      AND policyname = 'insurance_requests_select'
  ) THEN
    CREATE POLICY "insurance_requests_select" ON public.insurance_requests
      FOR SELECT TO authenticated
      USING (public.is_admin() OR tenant_id = public.current_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'insurance_requests'
      AND policyname = 'insurance_requests_insert'
  ) THEN
    CREATE POLICY "insurance_requests_insert" ON public.insurance_requests
      FOR INSERT TO authenticated
      WITH CHECK (public.is_admin() OR tenant_id = public.current_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'insurance_requests'
      AND policyname = 'insurance_requests_update'
  ) THEN
    CREATE POLICY "insurance_requests_update" ON public.insurance_requests
      FOR UPDATE TO authenticated
      USING (public.is_admin() OR tenant_id = public.current_tenant_id())
      WITH CHECK (public.is_admin() OR tenant_id = public.current_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'insurance_requests'
      AND policyname = 'insurance_requests_delete'
  ) THEN
    CREATE POLICY "insurance_requests_delete" ON public.insurance_requests
      FOR DELETE TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.insurance_requests TO authenticated;
GRANT ALL ON public.insurance_requests TO service_role;

-- Ensure coi-documents bucket exists (idempotent) and add tenant-scoped RLS.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'coi-documents',
  'coi-documents',
  false,
  20971520,
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = COALESCE(EXCLUDED.file_size_limit, 20971520),
  allowed_mime_types = COALESCE(
    EXCLUDED.allowed_mime_types,
    ARRAY['application/pdf', 'image/jpeg', 'image/png']
  );

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Path convention for insurance request attachments:
-- insurance-requests/{tenant_id}/{request_id}/{filename}
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'coi_documents_insurance_select'
  ) THEN
    CREATE POLICY "coi_documents_insurance_select" ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = 'coi-documents'
        AND (
          public.is_admin()
          OR (
            (storage.foldername(name))[1] = 'insurance-requests'
            AND (storage.foldername(name))[2] = public.current_tenant_id()::text
          )
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'coi_documents_insurance_insert'
  ) THEN
    CREATE POLICY "coi_documents_insurance_insert" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'coi-documents'
        AND (
          public.is_admin()
          OR (
            (storage.foldername(name))[1] = 'insurance-requests'
            AND (storage.foldername(name))[2] = public.current_tenant_id()::text
          )
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'coi_documents_insurance_update'
  ) THEN
    CREATE POLICY "coi_documents_insurance_update" ON storage.objects
      FOR UPDATE TO authenticated
      USING (
        bucket_id = 'coi-documents'
        AND (
          public.is_admin()
          OR (
            (storage.foldername(name))[1] = 'insurance-requests'
            AND (storage.foldername(name))[2] = public.current_tenant_id()::text
          )
        )
      )
      WITH CHECK (
        bucket_id = 'coi-documents'
        AND (
          public.is_admin()
          OR (
            (storage.foldername(name))[1] = 'insurance-requests'
            AND (storage.foldername(name))[2] = public.current_tenant_id()::text
          )
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'coi_documents_insurance_delete'
  ) THEN
    CREATE POLICY "coi_documents_insurance_delete" ON storage.objects
      FOR DELETE TO authenticated
      USING (
        bucket_id = 'coi-documents'
        AND (
          public.is_admin()
          OR (
            (storage.foldername(name))[1] = 'insurance-requests'
            AND (storage.foldername(name))[2] = public.current_tenant_id()::text
          )
        )
      );
  END IF;
END $$;
