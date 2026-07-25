
-- 1) email_outbox retry bookkeeping
ALTER TABLE public.email_outbox
  ADD COLUMN IF NOT EXISTS attempts int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_attempt_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS provider_message_id text;

-- 2) hoa_templates versioning: track current version timestamp
ALTER TABLE public.hoa_templates
  ADD COLUMN IF NOT EXISTS current_version int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS current_version_at timestamptz NOT NULL DEFAULT now();

-- 3) hoa_template_versions: snapshot history
CREATE TABLE IF NOT EXISTS public.hoa_template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.hoa_templates(id) ON DELETE CASCADE,
  version int NOT NULL,
  snapshot jsonb NOT NULL,
  changed_by uuid,
  change_summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, version)
);
GRANT SELECT, INSERT ON public.hoa_template_versions TO authenticated;
GRANT ALL ON public.hoa_template_versions TO service_role;
ALTER TABLE public.hoa_template_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tpl_versions_select ON public.hoa_template_versions
  FOR SELECT USING (public.is_admin() OR auth.uid() IS NOT NULL);
CREATE POLICY tpl_versions_insert ON public.hoa_template_versions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE INDEX IF NOT EXISTS hoa_template_versions_template_idx
  ON public.hoa_template_versions(template_id, version DESC);

-- 4) hoa_submittal_events: append-only audit trail
CREATE TABLE IF NOT EXISTS public.hoa_submittal_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submittal_id uuid NOT NULL REFERENCES public.hoa_submittals(id) ON DELETE CASCADE,
  tenant_id uuid,
  actor_id uuid,
  actor_label text,
  kind text NOT NULL,
  summary text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.hoa_submittal_events TO authenticated;
GRANT ALL ON public.hoa_submittal_events TO service_role;
ALTER TABLE public.hoa_submittal_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY sub_events_select ON public.hoa_submittal_events
  FOR SELECT USING (
    public.is_admin()
    OR tenant_id = public.current_tenant_id()
  );
CREATE POLICY sub_events_insert ON public.hoa_submittal_events
  FOR INSERT WITH CHECK (
    public.is_admin()
    OR tenant_id = public.current_tenant_id()
    OR tenant_id IS NULL
  );
CREATE INDEX IF NOT EXISTS hoa_submittal_events_submittal_idx
  ON public.hoa_submittal_events(submittal_id, created_at DESC);

-- 5) hoa_submittal_replies: track HOA email replies against a submittal
CREATE TABLE IF NOT EXISTS public.hoa_submittal_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submittal_id uuid NOT NULL REFERENCES public.hoa_submittals(id) ON DELETE CASCADE,
  tenant_id uuid,
  direction text NOT NULL DEFAULT 'inbound', -- inbound | outbound
  from_email text,
  from_name text,
  to_email text,
  subject text,
  body_text text,
  body_html text,
  received_at timestamptz NOT NULL DEFAULT now(),
  logged_by uuid,
  provider_message_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.hoa_submittal_replies TO authenticated;
GRANT ALL ON public.hoa_submittal_replies TO service_role;
ALTER TABLE public.hoa_submittal_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY sub_replies_select ON public.hoa_submittal_replies
  FOR SELECT USING (
    public.is_admin()
    OR tenant_id = public.current_tenant_id()
  );
CREATE POLICY sub_replies_insert ON public.hoa_submittal_replies
  FOR INSERT WITH CHECK (
    public.is_admin()
    OR tenant_id = public.current_tenant_id()
  );
CREATE INDEX IF NOT EXISTS hoa_submittal_replies_submittal_idx
  ON public.hoa_submittal_replies(submittal_id, received_at DESC);

-- 6) Storage INSERT tenant check (was: any authenticated user could upload anywhere in bucket)
DROP POLICY IF EXISTS permit_files_insert ON storage.objects;
CREATE POLICY permit_files_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'permit-files'
    AND (
      public.is_admin()
      OR owner = auth.uid()
      OR (
        (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND (
          public.permit_in_current_tenant(((storage.foldername(name))[1])::uuid)
          OR EXISTS (
            SELECT 1 FROM public.subcontractors s
            WHERE s.id = ((storage.foldername(name))[1])::uuid
              AND s.tenant_id = public.current_tenant_id()
          )
          OR EXISTS (
            SELECT 1 FROM public.hoa_submittals h
            WHERE h.id = ((storage.foldername(name))[1])::uuid
              AND h.tenant_id = public.current_tenant_id()
          )
        )
      )
      OR (storage.foldername(name))[1] = 'hoa'
    )
  );
