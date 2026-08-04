-- Legal Document Library: real files + version history (admin-only).
-- Mirrors hoa_templates / hoa_template_versions parent→child versioning,
-- but each version stores a Storage path instead of a JSONB snapshot.

CREATE TABLE IF NOT EXISTS public.legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  current_version TEXT NOT NULL DEFAULT 'v1.0',
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('active', 'draft', 'pending_review')),
  notes TEXT,
  gc_name TEXT,
  signed_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS legal_documents_type_idx
  ON public.legal_documents (type);
CREATE INDEX IF NOT EXISTS legal_documents_updated_at_idx
  ON public.legal_documents (updated_at DESC);

CREATE TABLE IF NOT EXISTS public.legal_document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_document_id UUID NOT NULL REFERENCES public.legal_documents(id) ON DELETE CASCADE,
  version_label TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT,
  change_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE (legal_document_id, version_label)
);

CREATE INDEX IF NOT EXISTS legal_document_versions_doc_idx
  ON public.legal_document_versions (legal_document_id, created_at DESC);

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_document_versions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'legal_documents'
      AND policyname = 'legal_documents_admin_all'
  ) THEN
    CREATE POLICY "legal_documents_admin_all" ON public.legal_documents
      FOR ALL TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'legal_document_versions'
      AND policyname = 'legal_document_versions_admin_all'
  ) THEN
    CREATE POLICY "legal_document_versions_admin_all" ON public.legal_document_versions
      FOR ALL TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.legal_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.legal_document_versions TO authenticated;
GRANT ALL ON public.legal_documents TO service_role;
GRANT ALL ON public.legal_document_versions TO service_role;

-- Private storage for legal PDFs / images.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'legal-documents',
  'legal-documents',
  false,
  20971520,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Path convention: legal/{document_id}/{timestamp}-{filename}
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'legal_documents_storage_select'
  ) THEN
    CREATE POLICY "legal_documents_storage_select" ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'legal-documents' AND public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'legal_documents_storage_insert'
  ) THEN
    CREATE POLICY "legal_documents_storage_insert" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'legal-documents' AND public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'legal_documents_storage_update'
  ) THEN
    CREATE POLICY "legal_documents_storage_update" ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'legal-documents' AND public.is_admin())
      WITH CHECK (bucket_id = 'legal-documents' AND public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'legal_documents_storage_delete'
  ) THEN
    CREATE POLICY "legal_documents_storage_delete" ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'legal-documents' AND public.is_admin());
  END IF;
END $$;
