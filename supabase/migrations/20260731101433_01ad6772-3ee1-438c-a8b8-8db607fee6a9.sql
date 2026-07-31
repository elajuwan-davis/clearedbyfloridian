CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_emails text[] := ARRAY[
    'elajuwan@floridianinc.com',
    'eman@floridianinc.com',
    'jose@floridianinc.com',
    'paul@floridianinc.com',
    'elajuwan@cleared.com',
    'eman@cleared.com',
    'jose@cleared.com',
    'paul@cleared.com'
  ];
  meta_tenant uuid;
  meta_role text;
  meta_invite uuid;
  email_domain text;
  domain_tenant uuid;
  new_tenant_name text;
BEGIN
  meta_tenant := NULLIF(NEW.raw_user_meta_data->>'tenant_id', '')::uuid;
  meta_role   := NEW.raw_user_meta_data->>'role';
  meta_invite := NULLIF(NEW.raw_user_meta_data->>'invite_token', '')::uuid;
  email_domain := lower(split_part(coalesce(NEW.email, ''), '@', 2));

  IF NEW.email = ANY(admin_emails) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
    RETURN NEW;
  END IF;

  IF meta_role = 'subcontractor' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'subcontractor')
    ON CONFLICT DO NOTHING;
    INSERT INTO public.sub_accounts (user_id, email) VALUES (NEW.id, NEW.email)
    ON CONFLICT DO NOTHING;
    RETURN NEW;
  END IF;

  -- Path B: invite token wins
  IF meta_invite IS NOT NULL THEN
    meta_tenant := public.consume_invite_token(meta_invite);
  END IF;

  -- Path A: domain auto-join
  IF meta_tenant IS NULL AND email_domain <> '' THEN
    SELECT id INTO domain_tenant FROM public.tenants
      WHERE lower(allowed_domain) = email_domain
      LIMIT 1;
    IF domain_tenant IS NOT NULL THEN
      meta_tenant := domain_tenant;
    END IF;
  END IF;

  -- No invite and no domain match: create a PRIVATE workspace for this user
  -- instead of dropping them into a shared tenant (which would expose other
  -- clients' permits).
  IF meta_tenant IS NULL THEN
    new_tenant_name := COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'company', ''),
      NULLIF(NEW.raw_user_meta_data->>'company_name', ''),
      NULLIF(split_part(coalesce(NEW.email, 'client'), '@', 1), ''),
      'New Client'
    );
    INSERT INTO public.tenants (name, status)
    VALUES (new_tenant_name, 'active')
    RETURNING id INTO meta_tenant;
    meta_role := COALESCE(NULLIF(meta_role, ''), 'gc_owner');
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE(NULLIF(meta_role, ''), 'gc_member')::public.app_role)
  ON CONFLICT DO NOTHING;
  INSERT INTO public.tenant_members (user_id, tenant_id, role)
  VALUES (NEW.id, meta_tenant, COALESCE(NULLIF(meta_role, ''), 'gc_member'))
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END; $function$;