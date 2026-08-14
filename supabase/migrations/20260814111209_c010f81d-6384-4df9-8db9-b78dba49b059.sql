-- Manually logged municipal permit fees (the "city fee" side of the Financials
-- comparison). Previously localStorage-only, so a fee logged on one machine was
-- invisible everywhere else.

CREATE TABLE IF NOT EXISTS public.permit_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_id UUID NOT NULL REFERENCES public.permits(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  fee_type TEXT NOT NULL DEFAULT 'Total Permit Fee'
    CHECK (fee_type IN (
      'Total Permit Fee',
      'Building Permit Fee',
      'Electrical Permit Fee',
      'Plumbing Permit Fee',
      'Mechanical Permit Fee',
      'Other'
    )),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  notes TEXT,
  date_paid DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS permit_fees_permit_idx
  ON public.permit_fees (permit_id, date_paid DESC);
CREATE INDEX IF NOT EXISTS permit_fees_tenant_idx
  ON public.permit_fees (tenant_id, date_paid DESC);

ALTER TABLE public.permit_fees ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'permit_fees'
      AND policyname = 'permit_fees_select'
  ) THEN
    CREATE POLICY "permit_fees_select" ON public.permit_fees
      FOR SELECT TO authenticated
      USING (public.is_admin() OR tenant_id = public.current_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'permit_fees'
      AND policyname = 'permit_fees_insert'
  ) THEN
    -- The permit must belong to the same tenant, so a fee cannot be attached to
    -- someone else's permit by passing your own tenant_id.
    CREATE POLICY "permit_fees_insert" ON public.permit_fees
      FOR INSERT TO authenticated
      WITH CHECK (
        (public.is_admin() OR tenant_id = public.current_tenant_id())
        AND EXISTS (
          SELECT 1 FROM public.permits p
          WHERE p.id = permit_id AND p.tenant_id = permit_fees.tenant_id
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'permit_fees'
      AND policyname = 'permit_fees_update'
  ) THEN
    CREATE POLICY "permit_fees_update" ON public.permit_fees
      FOR UPDATE TO authenticated
      USING (public.is_admin() OR tenant_id = public.current_tenant_id())
      WITH CHECK (public.is_admin() OR tenant_id = public.current_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'permit_fees'
      AND policyname = 'permit_fees_delete'
  ) THEN
    CREATE POLICY "permit_fees_delete" ON public.permit_fees
      FOR DELETE TO authenticated
      USING (public.is_admin() OR tenant_id = public.current_tenant_id());
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.permit_fees TO authenticated;
GRANT ALL ON public.permit_fees TO service_role;