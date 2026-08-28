-- Plan tiering becomes real: `tenants.plan` now decides which features a tenant can use.
--
-- 20260827120000 added the column with DEFAULT 'trial', which would have swept every
-- existing (invited, onboarded, paying) tenant into the trial tier the moment gating
-- shipped. Everything that exists before this migration runs is a full account, so it is
-- moved to 'full' here; only self-serve /join signups are written as 'trial' from now on
-- (selfServeSignupFn sets it explicitly).
--
-- Gating itself lives in the app (src/lib/plan-access.ts), not in RLS: a trial tenant is
-- not allowed to *use* subcontractor invites, DBPR verification, COI/insurance requests or
-- lien rights, but nothing about the underlying data model changes, so an upgrade is a
-- single column write with no backfill.

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'trial';

UPDATE public.tenants
   SET plan = 'full'
 WHERE plan = 'trial';

COMMENT ON COLUMN public.tenants.plan IS
  'Feature tier: ''full'' (invited/managed account, everything on) or ''trial'' (self-serve /join signup: own permits only). See src/lib/plan-access.ts.';
