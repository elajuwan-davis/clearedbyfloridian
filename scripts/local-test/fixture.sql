-- Local-only stand-in for the parts of the live Lovable Cloud schema that the
-- agent edge functions read/write. Applied to a throwaway Postgres container
-- before the real migration files, so triggers and edge functions can be run
-- end-to-end without touching the live database.
--
--   docker run -d --name cleard-pg -e POSTGRES_PASSWORD=postgres -p 54329:5432 postgres:15
--   docker exec -i cleard-pg psql -U postgres -d postgres < scripts/local-test/fixture.sql
--   docker exec -i cleard-pg psql -U postgres -d postgres < supabase/migrations/<file>.sql
--
-- net.http_post is stubbed to record calls in net.sent_requests instead of
-- making them, which is how a test asserts that a trigger fired.

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS net;
CREATE SCHEMA IF NOT EXISTS vault;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE SCHEMA IF NOT EXISTS storage;

CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE
);

CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

-- vault: real Supabase exposes vault.decrypted_secrets(name, decrypted_secret)
CREATE TABLE IF NOT EXISTS vault.secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  secret text NOT NULL
);
CREATE OR REPLACE VIEW vault.decrypted_secrets AS
  SELECT id, name, secret AS decrypted_secret FROM vault.secrets;

-- pg_net stub: record the call instead of performing it
CREATE TABLE IF NOT EXISTS net.sent_requests (
  id bigserial PRIMARY KEY,
  url text NOT NULL,
  headers jsonb,
  body jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION net.http_post(
  url text,
  body jsonb DEFAULT '{}'::jsonb,
  params jsonb DEFAULT '{}'::jsonb,
  headers jsonb DEFAULT '{}'::jsonb,
  timeout_milliseconds integer DEFAULT 5000
) RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE new_id bigint;
BEGIN
  INSERT INTO net.sent_requests (url, headers, body)
  VALUES (url, headers, body)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'gc_owner', 'gc_member', 'subcontractor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  license_number text,
  service_areas text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenant_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'gc_owner',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.permits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tenant_id uuid REFERENCES public.tenants(id),
  project_name text NOT NULL,
  owner_name text,
  job_address text NOT NULL,
  city text,
  county text,
  municipality text,
  permit_type text,
  permit_number text,
  status text NOT NULL DEFAULT 'submitted',
  description text,
  contractor_company text,
  contractor_qualifier text,
  license_number text,
  submitted_date date,
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  intake_payload jsonb
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- NOT NULL, matching production: a recipient-less notification is rejected there,
  -- so the harness must reject it too.
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  permit_id uuid REFERENCES public.permits(id) ON DELETE CASCADE,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  permit_id uuid REFERENCES public.permits(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_id uuid,
  actor_label text,
  summary text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.current_tenant_id() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid() LIMIT 1;
$$;

-- PostgREST roles
DO $$ BEGIN
  CREATE ROLE authenticated NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE ROLE anon NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE ROLE service_role NOLOGIN BYPASSRLS;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
GRANT service_role, authenticated, anon TO postgres;
