-- Notary request queue (was localStorage-backed demo data).
-- Cleard performs remote online notarization in-house per FL Stat §117.265.

CREATE TABLE IF NOT EXISTS public.notary_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_id UUID NOT NULL REFERENCES public.permits(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id),
  document_name TEXT NOT NULL,
  doc_id TEXT,
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'scheduled', 'completed', 'failed')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  notarized_filename TEXT,
  -- Remote Online Notarization session details (used by /legal/notary-queue)
  session_at TIMESTAMPTZ,
  provider TEXT,
  confirmation_number TEXT,
  failure_reason TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notary_requests_permit_id_idx ON public.notary_requests (permit_id);
CREATE INDEX IF NOT EXISTS notary_requests_tenant_id_idx ON public.notary_requests (tenant_id);
CREATE INDEX IF NOT EXISTS notary_requests_status_created_idx
  ON public.notary_requests (status, created_at DESC);

ALTER TABLE public.notary_requests ENABLE ROW LEVEL SECURITY;

-- Tenant members see requests on their own permits; admins see everything.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notary_requests' AND policyname = 'notary_requests_select'
  ) THEN
    CREATE POLICY "notary_requests_select" ON public.notary_requests
      FOR SELECT TO authenticated
      USING (
        public.is_admin()
        OR permit_id IN (
          SELECT id FROM public.permits WHERE tenant_id = public.current_tenant_id()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notary_requests' AND policyname = 'notary_requests_insert'
  ) THEN
    CREATE POLICY "notary_requests_insert" ON public.notary_requests
      FOR INSERT TO authenticated
      WITH CHECK (
        public.is_admin()
        OR permit_id IN (
          SELECT id FROM public.permits WHERE tenant_id = public.current_tenant_id()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notary_requests' AND policyname = 'notary_requests_update'
  ) THEN
    CREATE POLICY "notary_requests_update" ON public.notary_requests
      FOR UPDATE TO authenticated
      USING (
        public.is_admin()
        OR permit_id IN (
          SELECT id FROM public.permits WHERE tenant_id = public.current_tenant_id()
        )
      )
      WITH CHECK (
        public.is_admin()
        OR permit_id IN (
          SELECT id FROM public.permits WHERE tenant_id = public.current_tenant_id()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notary_requests' AND policyname = 'notary_requests_delete'
  ) THEN
    CREATE POLICY "notary_requests_delete" ON public.notary_requests
      FOR DELETE TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notary_requests TO authenticated;
GRANT ALL ON public.notary_requests TO service_role;
