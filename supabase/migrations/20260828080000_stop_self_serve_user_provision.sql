-- Invitation-only: unmatched signups must not receive a role or tenant.
--
-- Google OAuth creates an auth.users row (email already confirmed) before
-- evaluatePortalAccessFn runs. handle_new_user used to insert a private
-- workspace + gc_owner role for anyone without an invite or domain match,
-- so the Google queue always saw an "existing role grant" and let strangers in.
-- Staff, guest seats, subcontractors, invite tokens, and allowed_domain joins
-- are unchanged.

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
BEGIN
  meta_tenant := NULLIF(NEW.raw_user_meta_data->>'tenant_id', '')::uuid;
  meta_role   := NEW.raw_user_meta_data->>'role';
  meta_invite := NULLIF(NEW.raw_user_meta_data->>'invite_token', '')::uuid;
  email_domain := lower(split_part(coalesce(NEW.email, ''), '@', 2));
  email_local  := lower(split_part(coalesce(NEW.email, ''), '@', 1));

  IF email_domain = ANY(staff_domains) THEN
    -- Guest staff-domain accounts (e.g. veronica.guest@cleared.com) are limited
    -- team members: they can see workspace permit data but get no admin role.
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
  END IF;

  IF meta_tenant IS NULL AND email_domain <> '' THEN
    SELECT id INTO domain_tenant FROM public.tenants
      WHERE lower(allowed_domain) = email_domain
      LIMIT 1;
    IF domain_tenant IS NOT NULL THEN
      meta_tenant := domain_tenant;
    END IF;
  END IF;

  -- No invite and no domain match: leave the auth user unprovisioned.
  -- evaluatePortalAccessFn files an access_request and signs them out.
  IF meta_tenant IS NULL THEN
    RETURN NEW;
  END IF;

  meta_role := COALESCE(NULLIF(meta_role, ''), 'gc_member');

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, meta_role::public.app_role)
  ON CONFLICT DO NOTHING;
  INSERT INTO public.tenant_members (user_id, tenant_id, role)
  VALUES (NEW.id, meta_tenant, meta_role)
  ON CONFLICT (user_id) DO UPDATE
    SET tenant_id = EXCLUDED.tenant_id, role = EXCLUDED.role;

  RETURN NEW;
END;
$$;
