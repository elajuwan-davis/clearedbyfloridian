-- 1. PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  full_name text,
  avatar_url text,
  company_name text,
  website text,
  phone text,
  address text,
  language text NOT NULL DEFAULT 'en',
  notification_emails text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());
CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- 2. CONTACTS
CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  created_by uuid,
  name text NOT NULL,
  company text,
  contact_type text NOT NULL DEFAULT 'subcontractor',
  trade text,
  email text,
  phone text,
  address text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX contacts_tenant_idx ON public.contacts (tenant_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY contacts_select ON public.contacts FOR SELECT TO authenticated
  USING (public.is_admin() OR tenant_id = public.current_tenant_id());
CREATE POLICY contacts_insert ON public.contacts FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR tenant_id = public.current_tenant_id());
CREATE POLICY contacts_update ON public.contacts FOR UPDATE TO authenticated
  USING (public.is_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_admin() OR tenant_id = public.current_tenant_id());
CREATE POLICY contacts_delete ON public.contacts FOR DELETE TO authenticated
  USING (public.is_admin() OR tenant_id = public.current_tenant_id());
CREATE TRIGGER contacts_touch BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- 3. MESSAGE THREADS
CREATE TABLE public.message_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  permit_id uuid REFERENCES public.permits(id) ON DELETE SET NULL,
  created_by uuid,
  created_by_email text,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  last_message_at timestamptz NOT NULL DEFAULT now(),
  last_message_from text NOT NULL DEFAULT 'client',
  client_unread integer NOT NULL DEFAULT 0,
  admin_unread integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX message_threads_tenant_idx ON public.message_threads (tenant_id, last_message_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.message_threads TO authenticated;
GRANT ALL ON public.message_threads TO service_role;
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY message_threads_select ON public.message_threads FOR SELECT TO authenticated
  USING (public.is_admin() OR tenant_id = public.current_tenant_id());
CREATE POLICY message_threads_insert ON public.message_threads FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR tenant_id = public.current_tenant_id());
CREATE POLICY message_threads_update ON public.message_threads FOR UPDATE TO authenticated
  USING (public.is_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_admin() OR tenant_id = public.current_tenant_id());
CREATE TRIGGER message_threads_touch BEFORE UPDATE ON public.message_threads
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- 4. MESSAGE POSTS
CREATE TABLE public.message_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  tenant_id uuid,
  author_id uuid,
  author_email text,
  author_label text,
  from_admin boolean NOT NULL DEFAULT false,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX message_posts_thread_idx ON public.message_posts (thread_id, created_at);
GRANT SELECT, INSERT ON public.message_posts TO authenticated;
GRANT ALL ON public.message_posts TO service_role;
ALTER TABLE public.message_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY message_posts_select ON public.message_posts FOR SELECT TO authenticated
  USING (public.is_admin() OR tenant_id = public.current_tenant_id());
CREATE POLICY message_posts_insert ON public.message_posts FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND (public.is_admin() OR tenant_id = public.current_tenant_id()));