
-- 1) DBPR verification columns on subcontractors
ALTER TABLE public.subcontractors
  ADD COLUMN IF NOT EXISTS dbpr_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS dbpr_status text,
  ADD COLUMN IF NOT EXISTS dbpr_holder_name text,
  ADD COLUMN IF NOT EXISTS dbpr_license_type text,
  ADD COLUMN IF NOT EXISTS dbpr_expiration date;

-- 2) Notification preferences (one row per user)
CREATE TABLE IF NOT EXISTS public.notification_prefs (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_permit_issued boolean NOT NULL DEFAULT true,
  email_inspection_passed boolean NOT NULL DEFAULT true,
  email_inspection_failed boolean NOT NULL DEFAULT true,
  email_action_required boolean NOT NULL DEFAULT true,
  email_submission_received boolean NOT NULL DEFAULT true,
  sms_permit_issued boolean NOT NULL DEFAULT false,
  sms_inspection_passed boolean NOT NULL DEFAULT false,
  sms_inspection_failed boolean NOT NULL DEFAULT false,
  sms_action_required boolean NOT NULL DEFAULT false,
  sms_submission_received boolean NOT NULL DEFAULT false,
  phone_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_prefs TO authenticated;
GRANT ALL ON public.notification_prefs TO service_role;
ALTER TABLE public.notification_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notification prefs"
  ON public.notification_prefs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_notif_prefs_touch BEFORE UPDATE ON public.notification_prefs
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- 3) In-app notifications (bell)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  permit_id uuid,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
-- Any authenticated user can read all notifications (team-wide status feed)
CREATE POLICY "Authenticated read notifications"
  ON public.notifications FOR SELECT
  TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Authenticated delete notifications"
  ON public.notifications FOR DELETE
  TO authenticated USING (auth.uid() IS NOT NULL);

-- 4) NTO filings — one per permit
CREATE TABLE IF NOT EXISTS public.nto_filings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_id uuid NOT NULL UNIQUE,
  owner_name text,
  owner_address text,
  owner_email text,
  property_address text,
  contractor_name text NOT NULL DEFAULT 'Flōridian LLC',
  contractor_address text NOT NULL DEFAULT '215 Clematis Street, West Palm Beach, FL 33401',
  work_description text,
  first_work_date date,
  status text NOT NULL DEFAULT 'not_filed',
  sent_via text,
  sent_at timestamptz,
  pdf_path text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nto_filings TO authenticated;
GRANT ALL ON public.nto_filings TO service_role;
ALTER TABLE public.nto_filings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read NTO"
  ON public.nto_filings FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated insert NTO"
  ON public.nto_filings FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update NTO"
  ON public.nto_filings FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete NTO"
  ON public.nto_filings FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE TRIGGER trg_nto_touch BEFORE UPDATE ON public.nto_filings
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- 5) Access requests (public /join form)
CREATE TABLE IF NOT EXISTS public.access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text,
  license_number text,
  email text NOT NULL,
  phone text,
  status text NOT NULL DEFAULT 'new',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.access_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.access_requests TO authenticated;
GRANT ALL ON public.access_requests TO service_role;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
-- Anyone can submit an access request from /join
CREATE POLICY "Anyone can request access"
  ON public.access_requests FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated read all access requests"
  ON public.access_requests FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update access requests"
  ON public.access_requests FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete access requests"
  ON public.access_requests FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
