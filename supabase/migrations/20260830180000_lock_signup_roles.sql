-- Stop client-controlled auth metadata from minting privileged roles.
--
-- handle_new_user() used to copy raw_user_meta_data.role / tenant_id into
-- user_roles and tenant_members. supabase.auth.signUp() (used by /join/:token,
-- and callable with the published anon key) lets the browser set that
-- metadata, so an attacker could:
--   1. signUp({ data: { role: "admin" } }) and become a platform admin after
--      confirming email;
--   2. join via /join/:token with role: "gc_owner" and take over the tenant;
--   3. pass a leaked tenant_id + gc_owner and attach as owner.
--
-- Staff-domain emails (@cleared.com / @floridianinc.com) still become admin
-- (guest seats still become gc_member). Service-role invites that set
-- tenant_id + gc_owner/gc_member keep working; a second owner cannot be minted
-- on a tenant that already has members.
--
-- is_admin() also requires a staff-domain mailbox so a planted user_roles row
-- cannot satisfy RLS. Keep in lockstep with src/lib/signup-role.ts.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  staff_domains text[] := ARRAY['cleared.com', 'floridianinc.com'];
  staff_tenant uuid := '00000000-0000-0000-0000-000000000001';
  meta_tenant uuid;
  meta_role text;
  meta_invite uuid;
  email_domain text;
  email_local text;
  domain_tenant uuid;
  new_tenant_name text;
  joined_by_domain boolean := false;
  tenant_member_count integer;
BEGIN
  meta_tenant := NULLIF(NEW.raw_user_meta_data->>'tenant_id', '')::uuid;
  meta_role   := NEW.raw_user_meta_data->>'role';
  meta_invite := NULLIF(NEW.raw_user_meta_data->>'invite_token', '')::uuid;
  email_domain := lower(split_part(coalesce(NEW.email, ''), '@', 2));
  email_local  := lower(split_part(coalesce(NEW.email, ''), '@', 1));

  IF email_domain = ANY(staff_domains) THEN
    IF email_local LIKE '%.guest' OR email_local LIKE 'guest.%' OR email_local = 'guest' THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'gc_member')
      ON CONFLICT DO NOTHING;
      INSERT INTO public.tenant_members (user_id, tenant_id, role)
      VALUES (NEW.id, staff_tenant, 'gc_member')
      ON CONFLICT (user_id) DO UPDATE
        SET tenant_id = staff_tenant, role = 'gc_member';
      RETURN NEW;
    END IF;

    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
    INSERT INTO public.tenant_members (user_id, tenant_id, role)
    VALUES (NEW.id, staff_tenant, 'admin')
    ON CONFLICT (user_id) DO UPDATE
      SET tenant_id = staff_tenant, role = 'admin';
    RETURN NEW;
  END IF;

  IF meta_role = 'subcontractor' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'subcontractor')
    ON CONFLICT DO NOTHING;
    INSERT INTO public.sub_accounts (user_id, email) VALUES (NEW.id, NEW.email)
    ON CONFLICT DO NOTHING;
    RETURN NEW;
  END IF;

  IF meta_invite IS NOT NULL THEN
    meta_tenant := public.consume_invite_token(meta_invite);
    IF meta_tenant IS NOT NULL THEN
      -- Shareable invite link: always a member. Client metadata cannot mint owner/admin.
      meta_role := 'gc_member';
    END IF;
  END IF;

  IF meta_tenant IS NULL AND email_domain <> '' THEN
    SELECT id INTO domain_tenant FROM public.tenants
      WHERE lower(allowed_domain) = email_domain
      LIMIT 1;
    IF domain_tenant IS NOT NULL THEN
      meta_tenant := domain_tenant;
      joined_by_domain := true;
      meta_role := 'gc_member';
    END IF;
  END IF;

  IF meta_tenant IS NULL THEN
    new_tenant_name := COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'company', ''),
      NULLIF(NEW.raw_user_meta_data->>'company_name', ''),
      NULLIF(split_part(coalesce(NEW.email, 'client'), '@', 1), ''),
      'New Client'
    );
    INSERT INTO public.tenants (name, status, plan)
    VALUES (new_tenant_name, 'active', 'trial')
    RETURNING id INTO meta_tenant;
    -- Self-serve / unmatched: owner of a new trial workspace. Never keep a
    -- client-supplied admin/owner override here — this *is* the owner grant.
    meta_role := 'gc_owner';
  ELSIF meta_invite IS NULL AND NOT joined_by_domain THEN
    -- tenant_id came from raw metadata (service-role createUser / inviteUserByEmail).
    -- A populated tenant_id is not proof of invitation — public signUp can send any UUID.
    -- Invite/approve server functions upsert membership themselves after createUser.
    SELECT count(*) INTO tenant_member_count
      FROM public.tenant_members
     WHERE tenant_id = meta_tenant;
    IF tenant_member_count > 0 THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'gc_member')
      ON CONFLICT DO NOTHING;
      RETURN NEW;
    END IF;
    IF meta_role IS DISTINCT FROM 'gc_owner' AND meta_role IS DISTINCT FROM 'gc_member' THEN
      meta_role := 'gc_member';
    END IF;
  END IF;

  -- This branch never writes admin. Staff emails returned above.
  IF meta_role = 'admin' OR meta_role IS NULL OR meta_role = '' THEN
    meta_role := 'gc_member';
  END IF;
  IF meta_role NOT IN ('gc_owner', 'gc_member', 'subcontractor') THEN
    meta_role := 'gc_member';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, meta_role::public.app_role)
  ON CONFLICT DO NOTHING;
  INSERT INTO public.tenant_members (user_id, tenant_id, role)
  VALUES (NEW.id, meta_tenant, meta_role)
  ON CONFLICT (user_id) DO UPDATE
    SET tenant_id = EXCLUDED.tenant_id, role = EXCLUDED.role;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.user_roles ur
      JOIN auth.users u ON u.id = ur.user_id
     WHERE ur.user_id = auth.uid()
       AND ur.role = 'admin'::public.app_role
       AND lower(split_part(coalesce(u.email, ''), '@', 2))
             = ANY (ARRAY['cleared.com', 'floridianinc.com'])
       AND lower(split_part(coalesce(u.email, ''), '@', 1)) NOT LIKE '%.guest'
       AND lower(split_part(coalesce(u.email, ''), '@', 1)) NOT LIKE 'guest.%'
       AND lower(split_part(coalesce(u.email, ''), '@', 1)) <> 'guest'
  );
$$;
