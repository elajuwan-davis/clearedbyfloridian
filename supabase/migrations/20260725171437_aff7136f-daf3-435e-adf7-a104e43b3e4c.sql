
-- HOA Templates: shared community repository
CREATE TABLE public.hoa_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_name text NOT NULL,
  city text NOT NULL,
  hoa_contact_name text,
  hoa_contact_email text,
  hoa_contact_phone text,
  submission_method text,
  submission_portal_url text,
  required_documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  deposit_amount_cents bigint NOT NULL DEFAULT 0,
  deposit_type text,
  arc_meeting_notes text,
  form_template jsonb NOT NULL DEFAULT '{}'::jsonb,
  uploaded_form_path text,
  last_used_at timestamptz,
  usage_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_by_tenant_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (community_name, city)
);

GRANT SELECT, INSERT, UPDATE ON public.hoa_templates TO authenticated;
GRANT ALL ON public.hoa_templates TO service_role;
ALTER TABLE public.hoa_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hoa_templates read all authenticated"
  ON public.hoa_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "hoa_templates insert authenticated"
  ON public.hoa_templates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "hoa_templates update admin or creator"
  ON public.hoa_templates FOR UPDATE TO authenticated
  USING (public.is_admin() OR auth.uid() = created_by)
  WITH CHECK (public.is_admin() OR auth.uid() = created_by);

CREATE POLICY "hoa_templates delete admin"
  ON public.hoa_templates FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE TRIGGER touch_hoa_templates BEFORE UPDATE ON public.hoa_templates
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

CREATE INDEX hoa_templates_last_used_idx ON public.hoa_templates (last_used_at DESC NULLS LAST);
CREATE INDEX hoa_templates_city_idx ON public.hoa_templates (lower(city));
CREATE INDEX hoa_templates_community_idx ON public.hoa_templates (lower(community_name));

-- Add columns to hoa_submittals
ALTER TABLE public.hoa_submittals
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.hoa_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS homeowner_name text,
  ADD COLUMN IF NOT EXISTS homeowner_email text,
  ADD COLUMN IF NOT EXISTS sent_to_hoa_at timestamptz,
  ADD COLUMN IF NOT EXISTS homeowner_notified_at timestamptz;

-- Email outbox
CREATE TABLE public.email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  to_email text NOT NULL,
  to_name text,
  cc_emails text[] NOT NULL DEFAULT ARRAY[]::text[],
  subject text NOT NULL,
  body_text text NOT NULL,
  body_html text,
  related_submittal_id uuid REFERENCES public.hoa_submittals(id) ON DELETE SET NULL,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'queued',
  sent_at timestamptz,
  error text,
  created_by uuid,
  tenant_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.email_outbox TO authenticated;
GRANT ALL ON public.email_outbox TO service_role;
ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_outbox admins all"
  ON public.email_outbox FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "email_outbox tenant read"
  ON public.email_outbox FOR SELECT TO authenticated
  USING (tenant_id IS NOT NULL AND tenant_id = public.current_tenant_id());

CREATE POLICY "email_outbox tenant insert"
  ON public.email_outbox FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IS NOT NULL
    AND tenant_id = public.current_tenant_id()
    AND auth.uid() = created_by
  );

CREATE TRIGGER touch_email_outbox BEFORE UPDATE ON public.email_outbox
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
