insert into public.user_roles (user_id, role)
select u.id, 'admin'::public.app_role
from auth.users u
where lower(split_part(coalesce(u.email, ''), '@', 2)) in ('cleared.com', 'floridianinc.com')
on conflict (user_id, role) do nothing;

insert into public.tenant_members (user_id, tenant_id, role)
select u.id, '00000000-0000-0000-0000-000000000001'::uuid, 'admin'
from auth.users u
where lower(split_part(coalesce(u.email, ''), '@', 2)) in ('cleared.com', 'floridianinc.com')
on conflict (user_id) do update
  set tenant_id = '00000000-0000-0000-0000-000000000001'::uuid,
      role = 'admin';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
  staff_domains text[] := ARRAY['cleared.com', 'floridianinc.com'];
  staff_tenant uuid := '00000000-0000-0000-0000-000000000001';
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

  IF email_domain = ANY(staff_domains) THEN
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