ALTER TABLE public.tenants
  ALTER COLUMN plan SET DEFAULT 'full';

UPDATE public.tenants t
   SET plan = 'full'
 WHERE t.plan = 'trial'
   AND (
     EXISTS (SELECT 1 FROM public.tenant_invites i WHERE i.tenant_id = t.id)
     OR t.created_at < '2026-08-27'::timestamptz
   );

ALTER TABLE public.tenants
  DROP CONSTRAINT IF EXISTS tenants_plan_check;
ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_plan_check CHECK (plan IN ('trial', 'full'));

COMMENT ON COLUMN public.tenants.plan IS
  'Feature tier: ''full'' (managed/invited account, everything on; the default) or ''trial'' (self-serve /join signup: own permits, own portal logins, messages to Cleard). Switchable per tenant from /admin/invites → Plans. See src/lib/plan-access.ts.';