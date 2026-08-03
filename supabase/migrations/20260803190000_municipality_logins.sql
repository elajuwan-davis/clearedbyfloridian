-- Municipality portal login encryption.
-- pgcrypto and supabase_vault must be enabled. The actual symmetric key is stored
-- in Supabase Vault under the name 'MUNICIPALITY_CREDENTIAL_KEY' and is not
-- hard-coded anywhere.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

CREATE TABLE IF NOT EXISTS public.municipality_logins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  municipality TEXT NOT NULL,
  portal_url TEXT,
  username TEXT NOT NULL,
  password_enc BYTEA NOT NULL,
  notes TEXT,
  last_verified TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, municipality)
);

ALTER TABLE public.municipality_logins ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'municipality_logins' AND policyname = 'owner_only'
  ) THEN
    CREATE POLICY "owner_only" ON public.municipality_logins
      FOR ALL USING (tenant_id = auth.uid());
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public._municipality_credential_key()
RETURNS text AS $$
  SELECT decrypted_secret
  FROM vault.decrypted_secrets
  WHERE name = 'MUNICIPALITY_CREDENTIAL_KEY'
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.save_municipality_login(
  p_tenant_id UUID,
  p_municipality TEXT,
  p_portal_url TEXT,
  p_username TEXT,
  p_password TEXT,
  p_notes TEXT
) RETURNS UUID AS $$
DECLARE
  v_key text;
  v_id UUID;
BEGIN
  v_key := public._municipality_credential_key();
  IF v_key IS NULL THEN
    RAISE EXCEPTION 'MUNICIPALITY_CREDENTIAL_KEY not found in Supabase Vault';
  END IF;

  INSERT INTO public.municipality_logins (
    tenant_id, municipality, portal_url, username, password_enc, notes
  ) VALUES (
    p_tenant_id, p_municipality, p_portal_url, p_username,
    pgp_sym_encrypt(p_password, v_key), p_notes
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_municipality_login(p_id UUID)
RETURNS json AS $$
DECLARE
  v_key text;
  v_row json;
BEGIN
  v_key := public._municipality_credential_key();
  IF v_key IS NULL THEN
    RAISE EXCEPTION 'MUNICIPALITY_CREDENTIAL_KEY not found in Supabase Vault';
  END IF;

  SELECT json_build_object(
    'id', m.id,
    'tenant_id', m.tenant_id,
    'municipality', m.municipality,
    'portal_url', m.portal_url,
    'username', m.username,
    'password', pgp_sym_decrypt(m.password_enc, v_key),
    'notes', m.notes,
    'last_verified', m.last_verified,
    'created_at', m.created_at,
    'updated_at', m.updated_at
  ) INTO v_row
  FROM public.municipality_logins m
  WHERE m.id = p_id;

  RETURN v_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
