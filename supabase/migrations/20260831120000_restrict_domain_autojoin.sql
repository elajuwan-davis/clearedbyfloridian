-- Domain auto-join is a capability: handle_new_user() attaches every new auth user
-- whose address matches tenants.allowed_domain. /join made that writable by any
-- self-serve owner via /profile, so a Gmail trial account could claim gmail.com
-- (or any competitor domain) and swallow later Google sign-ups.
--
-- 1. Never auto-join consumer email providers, even if a row already stores one.
-- 2. Clear any public domains that were already saved.
-- The app-side setter (src/lib/allowed-domain.ts) additionally requires the domain
-- to match the owner's auth email, so a tenant cannot squat a company it does not
-- receive mail at. Keep PUBLIC_EMAIL_DOMAINS there in sync with the list below.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  staff_domains text[] := ARRAY['cleared.com', 'floridianinc.com'];
  public_email_domains text[] := ARRAY[
    'gmail.com', 'googlemail.com',
    'yahoo.com', 'ymail.com', 'yahoo.co.uk',
    'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
    'icloud.com', 'me.com', 'mac.com',
    'aol.com',
    'protonmail.com', 'proton.me', 'pm.me',
    'mail.com', 'zoho.com', 'yandex.com',
    'gmx.com', 'gmx.net',
    'fastmail.com', 'tutanota.com', 'tutamail.com', 'hey.com'
  ];
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

  -- Consumer inboxes are shared by millions of unrelated people. Matching on
  -- them would let whichever tenant saved the domain first capture every
  -- subsequent Google / self-serve signup at that provider.
  IF meta_tenant IS NULL AND email_domain <> '' AND email_domain <> ALL (public_email_domains) THEN
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

UPDATE public.tenants
   SET allowed_domain = NULL
 WHERE allowed_domain IS NOT NULL
   AND lower(allowed_domain) IN (
     'gmail.com', 'googlemail.com',
     'yahoo.com', 'ymail.com', 'yahoo.co.uk',
     'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
     'icloud.com', 'me.com', 'mac.com',
     'aol.com',
     'protonmail.com', 'proton.me', 'pm.me',
     'mail.com', 'zoho.com', 'yandex.com',
     'gmx.com', 'gmx.net',
     'fastmail.com', 'tutanota.com', 'tutamail.com', 'hey.com'
   );
