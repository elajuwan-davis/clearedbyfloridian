-- Building dept logins: extend gc_portal_logins with portal metadata +
-- real document expirations (portal_login_documents) + private Storage bucket.
-- Credentials remain AES-256-GCM ciphertext only; no plaintext password columns.

ALTER TABLE public.gc_portal_logins
  ADD COLUMN IF NOT EXISTS portal_url TEXT,
  ADD COLUMN IF NOT EXISTS registration TEXT,
  ADD COLUMN IF NOT EXISTS e_plan BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS derm BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.portal_login_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  municipality_slug TEXT NOT NULL,
  municipality TEXT NOT NULL,
  doc_label TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT,
  expiration_date DATE,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portal_login_documents_user_muni_idx
  ON public.portal_login_documents (user_id, municipality_slug);
CREATE INDEX IF NOT EXISTS portal_login_documents_tenant_idx
  ON public.portal_login_documents (tenant_id);
CREATE INDEX IF NOT EXISTS portal_login_documents_expiration_idx
  ON public.portal_login_documents (expiration_date);

ALTER TABLE public.portal_login_documents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'portal_login_documents'
      AND policyname = 'portal_login_documents_select'
  ) THEN
    CREATE POLICY "portal_login_documents_select" ON public.portal_login_documents
      FOR SELECT TO authenticated
      USING (
        public.is_admin()
        OR user_id = auth.uid()
        OR (tenant_id IS NOT NULL AND tenant_id = public.current_tenant_id())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'portal_login_documents'
      AND policyname = 'portal_login_documents_insert'
  ) THEN
    CREATE POLICY "portal_login_documents_insert" ON public.portal_login_documents
      FOR INSERT TO authenticated
      WITH CHECK (
        public.is_admin()
        OR user_id = auth.uid()
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'portal_login_documents'
      AND policyname = 'portal_login_documents_update'
  ) THEN
    CREATE POLICY "portal_login_documents_update" ON public.portal_login_documents
      FOR UPDATE TO authenticated
      USING (public.is_admin() OR user_id = auth.uid())
      WITH CHECK (public.is_admin() OR user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'portal_login_documents'
      AND policyname = 'portal_login_documents_delete'
  ) THEN
    CREATE POLICY "portal_login_documents_delete" ON public.portal_login_documents
      FOR DELETE TO authenticated
      USING (public.is_admin() OR user_id = auth.uid());
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_login_documents TO authenticated;
GRANT ALL ON public.portal_login_documents TO service_role;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portal-login-docs',
  'portal-login-docs',
  false,
  20971520,
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png'];

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Path: portal-logins/{user_id}/{municipality_slug}/{timestamp}-{filename}
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'portal_login_docs_select'
  ) THEN
    CREATE POLICY "portal_login_docs_select" ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = 'portal-login-docs'
        AND (
          public.is_admin()
          OR (storage.foldername(name))[1] = 'portal-logins'
             AND (storage.foldername(name))[2] = auth.uid()::text
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'portal_login_docs_insert'
  ) THEN
    CREATE POLICY "portal_login_docs_insert" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'portal-login-docs'
        AND (
          public.is_admin()
          OR (storage.foldername(name))[1] = 'portal-logins'
             AND (storage.foldername(name))[2] = auth.uid()::text
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'portal_login_docs_update'
  ) THEN
    CREATE POLICY "portal_login_docs_update" ON storage.objects
      FOR UPDATE TO authenticated
      USING (
        bucket_id = 'portal-login-docs'
        AND (
          public.is_admin()
          OR (storage.foldername(name))[1] = 'portal-logins'
             AND (storage.foldername(name))[2] = auth.uid()::text
        )
      )
      WITH CHECK (
        bucket_id = 'portal-login-docs'
        AND (
          public.is_admin()
          OR (storage.foldername(name))[1] = 'portal-logins'
             AND (storage.foldername(name))[2] = auth.uid()::text
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'portal_login_docs_delete'
  ) THEN
    CREATE POLICY "portal_login_docs_delete" ON storage.objects
      FOR DELETE TO authenticated
      USING (
        bucket_id = 'portal-login-docs'
        AND (
          public.is_admin()
          OR (storage.foldername(name))[1] = 'portal-logins'
             AND (storage.foldername(name))[2] = auth.uid()::text
        )
      );
  END IF;
END $$;
