-- =========================================================================
-- Subcontractor Marketplace — paid access to Cleard's own roster
--
-- A tenant sees only its own subcontractors (subs_select). This adds a second,
-- narrower read path: subs Cleard has explicitly listed on the marketplace are
-- visible to a tenant that has PAID for access. There is no free path — the
-- access row only reaches 'active' from the service role, after Stripe itself
-- confirms the payment (webhook or a verified checkout-session lookup).
-- =========================================================================

-- --- 1. Which subs Cleard offers -----------------------------------------
-- Opt-in only. Nothing is listed by a migration: a client's own roster must
-- never become resellable inventory by default. Staff flag each sub.
ALTER TABLE public.subcontractors
  ADD COLUMN IF NOT EXISTS marketplace_listed boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS subs_marketplace_idx
  ON public.subcontractors (marketplace_listed)
  WHERE marketplace_listed;

-- --- 2. Who has paid ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.marketplace_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'canceled')),
  amount_cents integer,
  environment text CHECK (environment IN ('sandbox', 'live')),
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  unlocked_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.marketplace_access TO authenticated;
GRANT ALL ON public.marketplace_access TO service_role;
ALTER TABLE public.marketplace_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketplace_access_select" ON public.marketplace_access;
CREATE POLICY "marketplace_access_select" ON public.marketplace_access
  FOR SELECT TO authenticated
  USING (public.is_admin() OR tenant_id = public.current_tenant_id());

-- A client may only ever create its own *pending* row (the checkout attempt).
-- Granting access is deliberately not expressible from the client: there is no
-- UPDATE policy, so 'active' can only be written by the service role.
DROP POLICY IF EXISTS "marketplace_access_insert" ON public.marketplace_access;
CREATE POLICY "marketplace_access_insert" ON public.marketplace_access
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.current_tenant_id() AND status = 'pending');

CREATE OR REPLACE FUNCTION public.has_marketplace_access()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.marketplace_access
    WHERE tenant_id = public.current_tenant_id() AND status = 'active'
  )
$$;

-- --- 3. The paid read path ------------------------------------------------
DROP POLICY IF EXISTS "subs_select_marketplace" ON public.subcontractors;
CREATE POLICY "subs_select_marketplace" ON public.subcontractors
  FOR SELECT TO authenticated
  USING (marketplace_listed AND public.has_marketplace_access());

-- Browsing view: the roster columns a buyer needs, without the private
-- document paths. security_invoker keeps the policy above in force, so an
-- unpaid tenant selecting from it simply gets nothing.
DROP VIEW IF EXISTS public.marketplace_roster;
CREATE VIEW public.marketplace_roster
WITH (security_invoker = on) AS
  SELECT
    id,
    company_name,
    trade,
    qualifier_name,
    license_number,
    license_expiration,
    coi_expiration,
    insurance_carrier_name,
    email,
    phone,
    company_address,
    status,
    (coi_file_name IS NOT NULL) AS has_coi,
    (license_file_name IS NOT NULL) AS has_license,
    (w9_file_name IS NOT NULL) AS has_w9
  FROM public.subcontractors
  WHERE marketplace_listed;

GRANT SELECT ON public.marketplace_roster TO authenticated;

-- --- 4. Teaser count ------------------------------------------------------
-- Powers the "Cleard has N other qualified contractors" upsell shown to a
-- tenant that has NOT paid. Returns a count only — no identities, no contact
-- details — so it cannot be used as a free back door into the roster.
CREATE OR REPLACE FUNCTION public.marketplace_roster_count(_trade text DEFAULT NULL)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT count(*)::integer
  FROM public.subcontractors
  WHERE marketplace_listed
    AND (_trade IS NULL OR trade = _trade)
$$;

GRANT EXECUTE ON FUNCTION public.marketplace_roster_count(text) TO authenticated;
