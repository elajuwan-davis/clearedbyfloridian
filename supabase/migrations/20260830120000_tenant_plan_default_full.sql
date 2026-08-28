-- A tenant is full-plan unless something deliberately says otherwise.
--
-- 20260827120000 created `tenants.plan` with DEFAULT 'trial', which is backwards for
-- every path except self-serve signup: an admin-created (invited, managed, paying)
-- tenant does not write the column, so it inherited 'trial' and its members landed on
-- the locked-down trial surface — five nav items, paid tools showing a lock. The default
-- is the wrong way round, so it is flipped here; `selfServeSignupFn` is the only caller
-- that wants a trial tenant and it sets plan = 'trial' explicitly (as does
-- approveAccessRequestFn with 'full', so neither depends on this default any more).
ALTER TABLE public.tenants
  ALTER COLUMN plan SET DEFAULT 'full';

-- Repair the tenants that took the old default. Two markers of a managed account:
--   * it has a tenant_invites row (it was created by staff through the invite pipeline), or
--   * it predates the plan column, so it cannot have come from /join.
-- Anything else is left alone: a real self-serve signup must stay on trial.
UPDATE public.tenants t
   SET plan = 'full'
 WHERE t.plan = 'trial'
   AND (
     EXISTS (SELECT 1 FROM public.tenant_invites i WHERE i.tenant_id = t.id)
     OR t.created_at < '2026-08-27'::timestamptz
   );

-- Only the two tiers the app knows about. `authenticated` holds SELECT only and the
-- update policy on this table requires is_admin(), so a client cannot raise its own tier;
-- this keeps a service-role writer from inventing a third value the UI can't read.
ALTER TABLE public.tenants
  DROP CONSTRAINT IF EXISTS tenants_plan_check;
ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_plan_check CHECK (plan IN ('trial', 'full'));

COMMENT ON COLUMN public.tenants.plan IS
  'Feature tier: ''full'' (managed/invited account, everything on; the default) or ''trial'' (self-serve /join signup: own permits, own portal logins, messages to Cleard). Switchable per tenant from /admin/invites → Plans. See src/lib/plan-access.ts.';
