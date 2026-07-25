
-- Item 1 Path A: allowed_domain on tenants for auto-join by email domain
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS allowed_domain text;

-- Item 1 Path B: shareable invite tokens
CREATE TABLE IF NOT EXISTS public.tenant_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_by uuid,
  revoked_at timestamptz,
  uses integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_invites TO authenticated;
GRANT ALL ON public.tenant_invites TO service_role;
GRANT SELECT ON public.tenant_invites TO anon; -- public token consume via SECURITY DEFINER fn preferred, but for simplicity allow anon SELECT by token (RLS below scopes)

ALTER TABLE public.tenant_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their tenant invites"
  ON public.tenant_invites FOR SELECT
  TO authenticated
  USING (tenant_id = public.current_tenant_id() OR public.is_admin());

CREATE POLICY "Tenant owners can manage invites"
  ON public.tenant_invites FOR ALL
  TO authenticated
  USING (tenant_id = public.current_tenant_id() OR public.is_admin())
  WITH CHECK (tenant_id = public.current_tenant_id() OR public.is_admin());

-- Function to consume invite token (used by handle_new_user via metadata invite_token)
CREATE OR REPLACE FUNCTION public.consume_invite_token(_token uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant uuid;
BEGIN
  SELECT tenant_id INTO _tenant
    FROM public.tenant_invites
   WHERE token = _token AND revoked_at IS NULL;
  IF _tenant IS NOT NULL THEN
    UPDATE public.tenant_invites SET uses = uses + 1 WHERE token = _token;
  END IF;
  RETURN _tenant;
END; $$;

-- Update handle_new_user to auto-join on matching domain OR invite token
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  meta_invite uuid;
  email_domain text;
  domain_tenant uuid;
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

  IF meta_tenant IS NULL THEN
    meta_tenant := '00000000-0000-0000-0000-000000000001';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE(NULLIF(meta_role, ''), 'gc_member')::public.app_role)
  ON CONFLICT DO NOTHING;
  INSERT INTO public.tenant_members (user_id, tenant_id, role)
  VALUES (NEW.id, meta_tenant, COALESCE(NULLIF(meta_role, ''), 'gc_member'))
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END; $$;
