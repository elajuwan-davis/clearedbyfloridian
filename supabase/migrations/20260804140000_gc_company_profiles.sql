-- GC company profiles (one row per tenant) + private compliance docs bucket.
-- Replaces localStorage-backed src/lib/gc-company.ts for /portal/company.

CREATE TABLE IF NOT EXISTS public.gc_company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  legal_name TEXT NOT NULL DEFAULT '',
  dba TEXT NOT NULL DEFAULT '',
  entity_type TEXT NOT NULL DEFAULT '',
  primary_qualifier JSONB NOT NULL DEFAULT '{}'::jsonb,
  secondary_qualifier JSONB,
  general_liability JSONB NOT NULL DEFAULT '{}'::jsonb,
  workers_comp JSONB NOT NULL DEFAULT '{}'::jsonb,
  bond JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gc_company_profiles_tenant_id_idx
  ON public.gc_company_profiles (tenant_id);

ALTER TABLE public.gc_company_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'gc_company_profiles'
      AND policyname = 'gc_company_profiles_select'
  ) THEN
    CREATE POLICY "gc_company_profiles_select" ON public.gc_company_profiles
      FOR SELECT TO authenticated
      USING (public.is_admin() OR tenant_id = public.current_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'gc_company_profiles'
      AND policyname = 'gc_company_profiles_insert'
  ) THEN
    CREATE POLICY "gc_company_profiles_insert" ON public.gc_company_profiles
      FOR INSERT TO authenticated
      WITH CHECK (public.is_admin() OR tenant_id = public.current_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'gc_company_profiles'
      AND policyname = 'gc_company_profiles_update'
  ) THEN
    CREATE POLICY "gc_company_profiles_update" ON public.gc_company_profiles
      FOR UPDATE TO authenticated
      USING (public.is_admin() OR tenant_id = public.current_tenant_id())
      WITH CHECK (public.is_admin() OR tenant_id = public.current_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'gc_company_profiles'
      AND policyname = 'gc_company_profiles_delete'
  ) THEN
    CREATE POLICY "gc_company_profiles_delete" ON public.gc_company_profiles
      FOR DELETE TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gc_company_profiles TO authenticated;
GRANT ALL ON public.gc_company_profiles TO service_role;

-- Private storage for GL/WC certificates of insurance.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-compliance-docs',
  'company-compliance-docs',
  false,
  20971520,
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png'];

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Path convention: company/{tenant_id}/{kind}/{filename}
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'company_compliance_docs_select'
  ) THEN
    CREATE POLICY "company_compliance_docs_select" ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = 'company-compliance-docs'
        AND (
          public.is_admin()
          OR (
            (storage.foldername(name))[1] = 'company'
            AND (storage.foldername(name))[2] = public.current_tenant_id()::text
          )
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'company_compliance_docs_insert'
  ) THEN
    CREATE POLICY "company_compliance_docs_insert" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'company-compliance-docs'
        AND (
          public.is_admin()
          OR (
            (storage.foldername(name))[1] = 'company'
            AND (storage.foldername(name))[2] = public.current_tenant_id()::text
          )
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'company_compliance_docs_update'
  ) THEN
    CREATE POLICY "company_compliance_docs_update" ON storage.objects
      FOR UPDATE TO authenticated
      USING (
        bucket_id = 'company-compliance-docs'
        AND (
          public.is_admin()
          OR (
            (storage.foldername(name))[1] = 'company'
            AND (storage.foldername(name))[2] = public.current_tenant_id()::text
          )
        )
      )
      WITH CHECK (
        bucket_id = 'company-compliance-docs'
        AND (
          public.is_admin()
          OR (
            (storage.foldername(name))[1] = 'company'
            AND (storage.foldername(name))[2] = public.current_tenant_id()::text
          )
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'company_compliance_docs_delete'
  ) THEN
    CREATE POLICY "company_compliance_docs_delete" ON storage.objects
      FOR DELETE TO authenticated
      USING (
        bucket_id = 'company-compliance-docs'
        AND (
          public.is_admin()
          OR (
            (storage.foldername(name))[1] = 'company'
            AND (storage.foldername(name))[2] = public.current_tenant_id()::text
          )
        )
      );
  END IF;
END $$;
