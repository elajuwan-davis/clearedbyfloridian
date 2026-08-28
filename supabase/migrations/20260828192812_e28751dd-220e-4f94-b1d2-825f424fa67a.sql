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
  END IF;

  IF meta_tenant IS NULL AND email_domain <> '' THEN
    SELECT id INTO domain_tenant FROM public.tenants
      WHERE lower(allowed_domain) = email_domain
      LIMIT 1;
    IF domain_tenant IS NOT NULL THEN
      meta_tenant := domain_tenant;
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
    meta_role := COALESCE(NULLIF(meta_role, ''), 'gc_owner');
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

UPDATE public.tenants t
   SET plan = 'trial'
 WHERE t.plan = 'full'
   AND t.created_at >= '2026-08-27'::timestamptz
   AND NOT EXISTS (SELECT 1 FROM public.tenant_invites i WHERE i.tenant_id = t.id)
   AND NOT EXISTS (
     SELECT 1 FROM public.access_requests a
      WHERE a.approved_tenant_id = t.id AND a.status = 'approved'
   );