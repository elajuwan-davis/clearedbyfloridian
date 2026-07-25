
-- =========================================================================
-- ROLES + TENANTS FOUNDATION
-- =========================================================================

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'gc_owner', 'gc_member', 'subcontractor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  license_number text,
  service_areas text[] NOT NULL DEFAULT '{}',
  primary_coi_path text,
  primary_license_path text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tenants TO authenticated;
GRANT ALL ON public.tenants TO service_role;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.tenant_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'gc_owner',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
GRANT SELECT ON public.tenant_members TO authenticated;
GRANT ALL ON public.tenant_members TO service_role;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.sub_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sub_accounts TO authenticated;
GRANT ALL ON public.sub_accounts TO service_role;
ALTER TABLE public.sub_accounts ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- SECURITY-DEFINER HELPERS
-- =========================================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_role(auth.uid(), 'admin'::public.app_role) $$;

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid() LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth
AS $$ SELECT email FROM auth.users WHERE id = auth.uid() $$;

CREATE OR REPLACE FUNCTION public.sub_can_see_permit(_permit_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.permits p, jsonb_array_elements(p.subs) s
    WHERE p.id = _permit_id
      AND public.has_role(auth.uid(), 'subcontractor'::public.app_role)
      AND (
        lower(coalesce(s->>'email', '')) = lower(coalesce(public.current_user_email(), ''))
        AND coalesce((s->>'confirmed')::boolean, false) = true
      )
  )
$$;

-- =========================================================================
-- LEGACY TENANT + BACKFILL COLUMNS
-- =========================================================================

INSERT INTO public.tenants (id, name, status)
VALUES ('00000000-0000-0000-0000-000000000001', 'Legacy', 'active')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.permits              ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.subcontractors       ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.design_professionals ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.prior_permits        ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.submissions          ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.nto_filings          ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.gc_coi_minimums      ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.gc_portal_logins     ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.access_requests      ADD COLUMN IF NOT EXISTS approved_tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.access_requests      ADD COLUMN IF NOT EXISTS service_areas text[] NOT NULL DEFAULT '{}';

UPDATE public.permits              SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.subcontractors       SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.design_professionals SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.prior_permits        SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.submissions          SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.nto_filings          SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.gc_coi_minimums      SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.gc_portal_logins     SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS permits_tenant_idx        ON public.permits(tenant_id);
CREATE INDEX IF NOT EXISTS subs_tenant_idx           ON public.subcontractors(tenant_id);
CREATE INDEX IF NOT EXISTS design_pros_tenant_idx    ON public.design_professionals(tenant_id);
CREATE INDEX IF NOT EXISTS prior_permits_tenant_idx  ON public.prior_permits(tenant_id);
CREATE INDEX IF NOT EXISTS submissions_tenant_idx    ON public.submissions(tenant_id);
CREATE INDEX IF NOT EXISTS nto_tenant_idx            ON public.nto_filings(tenant_id);

-- =========================================================================
-- handle_new_user: bootstrap role + tenant membership for every new auth.users row
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  admin_emails text[] := ARRAY[
    'elajuwan@floridianinc.com',
    'eman@floridianinc.com',
    'jose@floridianinc.com',
    'paul@floridianinc.com'
  ];
  meta_tenant uuid;
  meta_role text;
BEGIN
  meta_tenant := NULLIF(NEW.raw_user_meta_data->>'tenant_id', '')::uuid;
  meta_role   := NEW.raw_user_meta_data->>'role';

  IF NEW.email = ANY(admin_emails) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  ELSIF meta_role = 'subcontractor' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'subcontractor')
    ON CONFLICT DO NOTHING;
    INSERT INTO public.sub_accounts (user_id, email) VALUES (NEW.id, NEW.email)
    ON CONFLICT DO NOTHING;
  ELSE
    -- Default: GC user. Use tenant from invite metadata; fall back to Legacy.
    IF meta_tenant IS NULL THEN
      meta_tenant := '00000000-0000-0000-0000-000000000001';
    END IF;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, COALESCE(NULLIF(meta_role, ''), 'gc_owner')::public.app_role)
    ON CONFLICT DO NOTHING;
    INSERT INTO public.tenant_members (user_id, tenant_id, role)
    VALUES (NEW.id, meta_tenant, COALESCE(NULLIF(meta_role, ''), 'gc_owner'))
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users into Legacy tenant as gc_owner (admin emails become admin instead).
INSERT INTO public.user_roles (user_id, role)
SELECT u.id,
       CASE WHEN u.email IN (
         'elajuwan@floridianinc.com','eman@floridianinc.com',
         'jose@floridianinc.com','paul@floridianinc.com'
       ) THEN 'admin'::public.app_role
       ELSE 'gc_owner'::public.app_role END
FROM auth.users u
ON CONFLICT DO NOTHING;

INSERT INTO public.tenant_members (user_id, tenant_id, role)
SELECT u.id, '00000000-0000-0000-0000-000000000001', 'gc_owner'
FROM auth.users u
WHERE u.email NOT IN (
  'elajuwan@floridianinc.com','eman@floridianinc.com',
  'jose@floridianinc.com','paul@floridianinc.com'
)
ON CONFLICT (user_id) DO NOTHING;

-- =========================================================================
-- POLICIES
-- =========================================================================

-- tenants
DROP POLICY IF EXISTS "Admins manage tenants" ON public.tenants;
CREATE POLICY "Admins manage tenants" ON public.tenants FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Members view own tenant" ON public.tenants;
CREATE POLICY "Members view own tenant" ON public.tenants FOR SELECT TO authenticated
  USING (public.is_admin() OR id = public.current_tenant_id());

-- tenant_members
DROP POLICY IF EXISTS "Admins manage tenant_members" ON public.tenant_members;
CREATE POLICY "Admins manage tenant_members" ON public.tenant_members FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Users view own membership" ON public.tenant_members;
CREATE POLICY "Users view own membership" ON public.tenant_members FOR SELECT TO authenticated
  USING (public.is_admin() OR user_id = auth.uid() OR tenant_id = public.current_tenant_id());

-- user_roles
DROP POLICY IF EXISTS "Admins manage user_roles" ON public.user_roles;
CREATE POLICY "Admins manage user_roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (public.is_admin() OR user_id = auth.uid());

-- sub_accounts
DROP POLICY IF EXISTS "Admins manage sub_accounts" ON public.sub_accounts;
CREATE POLICY "Admins manage sub_accounts" ON public.sub_accounts FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Users view own sub_account" ON public.sub_accounts;
CREATE POLICY "Users view own sub_account" ON public.sub_accounts FOR SELECT TO authenticated
  USING (public.is_admin() OR user_id = auth.uid());

-- ---------- Tenant-scoped tables: drop old broad policies, add scoped ones ----------

-- permits
DROP POLICY IF EXISTS "Authenticated can view all permits" ON public.permits;
DROP POLICY IF EXISTS "Authenticated can insert permits"   ON public.permits;
DROP POLICY IF EXISTS "Authenticated can update permits"   ON public.permits;
DROP POLICY IF EXISTS "Authenticated can delete permits"   ON public.permits;
DROP POLICY IF EXISTS "Anon can view permits"              ON public.permits;

CREATE POLICY "permits_select" ON public.permits FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR tenant_id = public.current_tenant_id()
    OR public.sub_can_see_permit(id)
  );
CREATE POLICY "permits_insert" ON public.permits FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR tenant_id = public.current_tenant_id());
CREATE POLICY "permits_update" ON public.permits FOR UPDATE TO authenticated
  USING (public.is_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_admin() OR tenant_id = public.current_tenant_id());
CREATE POLICY "permits_delete" ON public.permits FOR DELETE TO authenticated
  USING (public.is_admin() OR tenant_id = public.current_tenant_id());

-- subcontractors
DROP POLICY IF EXISTS "Authenticated can view all subs" ON public.subcontractors;
DROP POLICY IF EXISTS "Authenticated can insert subs"   ON public.subcontractors;
DROP POLICY IF EXISTS "Authenticated can update subs"   ON public.subcontractors;
DROP POLICY IF EXISTS "Authenticated can delete subs"   ON public.subcontractors;

CREATE POLICY "subs_select" ON public.subcontractors FOR SELECT TO authenticated
  USING (public.is_admin() OR tenant_id = public.current_tenant_id());
CREATE POLICY "subs_insert" ON public.subcontractors FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR tenant_id = public.current_tenant_id());
CREATE POLICY "subs_update" ON public.subcontractors FOR UPDATE TO authenticated
  USING (public.is_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_admin() OR tenant_id = public.current_tenant_id());
CREATE POLICY "subs_delete" ON public.subcontractors FOR DELETE TO authenticated
  USING (public.is_admin() OR tenant_id = public.current_tenant_id());

-- design_professionals
DROP POLICY IF EXISTS "Authenticated can view design pros"   ON public.design_professionals;
DROP POLICY IF EXISTS "Authenticated can insert design pros" ON public.design_professionals;
DROP POLICY IF EXISTS "Authenticated can update design pros" ON public.design_professionals;
DROP POLICY IF EXISTS "Authenticated can delete design pros" ON public.design_professionals;

CREATE POLICY "design_pros_select" ON public.design_professionals FOR SELECT TO authenticated
  USING (public.is_admin() OR tenant_id = public.current_tenant_id());
CREATE POLICY "design_pros_insert" ON public.design_professionals FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR tenant_id = public.current_tenant_id());
CREATE POLICY "design_pros_update" ON public.design_professionals FOR UPDATE TO authenticated
  USING (public.is_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_admin() OR tenant_id = public.current_tenant_id());
CREATE POLICY "design_pros_delete" ON public.design_professionals FOR DELETE TO authenticated
  USING (public.is_admin() OR tenant_id = public.current_tenant_id());

-- prior_permits
DROP POLICY IF EXISTS "Authenticated can view all prior permits" ON public.prior_permits;
DROP POLICY IF EXISTS "Authenticated can insert prior permits"   ON public.prior_permits;
DROP POLICY IF EXISTS "Authenticated can update prior permits"   ON public.prior_permits;
DROP POLICY IF EXISTS "Authenticated can delete prior permits"   ON public.prior_permits;

CREATE POLICY "prior_permits_all" ON public.prior_permits FOR ALL TO authenticated
  USING (public.is_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_admin() OR tenant_id = public.current_tenant_id());

-- submissions
DROP POLICY IF EXISTS "Authenticated can view all submissions" ON public.submissions;
DROP POLICY IF EXISTS "Authenticated can insert submissions"   ON public.submissions;
DROP POLICY IF EXISTS "Authenticated can update submissions"   ON public.submissions;
DROP POLICY IF EXISTS "Authenticated can delete submissions"   ON public.submissions;

CREATE POLICY "submissions_all" ON public.submissions FOR ALL TO authenticated
  USING (public.is_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_admin() OR tenant_id = public.current_tenant_id());

-- nto_filings
DROP POLICY IF EXISTS "Authenticated read NTO"   ON public.nto_filings;
DROP POLICY IF EXISTS "Authenticated insert NTO" ON public.nto_filings;
DROP POLICY IF EXISTS "Authenticated update NTO" ON public.nto_filings;
DROP POLICY IF EXISTS "Authenticated delete NTO" ON public.nto_filings;

CREATE POLICY "nto_all" ON public.nto_filings FOR ALL TO authenticated
  USING (public.is_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_admin() OR tenant_id = public.current_tenant_id());

-- gc_coi_minimums
DROP POLICY IF EXISTS "Authenticated read gc minimums"  ON public.gc_coi_minimums;
DROP POLICY IF EXISTS "Authenticated write gc minimums" ON public.gc_coi_minimums;

CREATE POLICY "gc_coi_min_all" ON public.gc_coi_minimums FOR ALL TO authenticated
  USING (public.is_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_admin() OR tenant_id = public.current_tenant_id());

-- access_requests: anon insert stays; view/manage becomes admin-only
DROP POLICY IF EXISTS "Authenticated read all access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Authenticated update access requests"   ON public.access_requests;
DROP POLICY IF EXISTS "Authenticated delete access requests"   ON public.access_requests;

CREATE POLICY "access_requests_admin_read"   ON public.access_requests FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "access_requests_admin_update" ON public.access_requests FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "access_requests_admin_delete" ON public.access_requests FOR DELETE TO authenticated USING (public.is_admin());

-- notifications: tighten so only admin or the addressed user sees them
DROP POLICY IF EXISTS "Authenticated read notifications"   ON public.notifications;
DROP POLICY IF EXISTS "Authenticated insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated delete notifications" ON public.notifications;

CREATE POLICY "notifications_select" ON public.notifications FOR SELECT TO authenticated
  USING (public.is_admin() OR user_id = auth.uid());
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR user_id = auth.uid());
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE TO authenticated
  USING (public.is_admin() OR user_id = auth.uid());

-- Update-triggers on new tables
DROP TRIGGER IF EXISTS tenants_updated_at ON public.tenants;
CREATE TRIGGER tenants_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
