-- Agent 5 acceptance fixtures. Applied after fixture.sql, the Agent 4 + SignWell
-- migrations, seed-agent4.sql, and 20260805170000_municipality_submit.sql.
--
-- Adds the production tables the shared fixture does not carry yet (email_outbox,
-- gc_portal_logins), points the passing permit at the Plantation pilot, and enables a
-- second email-intake target so both channels are exercisable locally.

CREATE TABLE IF NOT EXISTS public.email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  to_email text NOT NULL,
  to_name text,
  cc_emails text[] NOT NULL DEFAULT ARRAY[]::text[],
  subject text NOT NULL,
  body_text text NOT NULL,
  body_html text,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'queued',
  sent_at timestamptz,
  error text,
  created_by uuid,
  tenant_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gc_portal_logins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid,
  municipality_slug text NOT NULL,
  city_name text NOT NULL,
  username_ciphertext text NOT NULL,
  password_ciphertext text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, municipality_slug)
);

-- The passing Agent 4 permit files in the pilot municipality.
UPDATE public.permits
   SET municipality = 'Plantation', city = 'Plantation',
       job_address = '412 NW 70th Ave',
       description = 'Interior buildout of retail shell, 2,400 sf',
       owner_name = 'Del Prado Holdings LLC',
       poc_email = 'pm@coastline.test'
 WHERE id = '66666666-6666-6666-6666-666666666666';

-- The blocked permit files in the same municipality, so the only difference between the
-- two acceptance cases is the pre-submission verdict.
UPDATE public.permits
   SET municipality = 'Plantation', city = 'Plantation'
 WHERE id = '77777777-7777-7777-7777-777777777777';

-- Email-intake target, enabled locally only, to exercise that channel end to end.
INSERT INTO public.municipality_submission_targets
  (slug, city_name, county, channel, intake_email, intake_cc, enabled, notes)
VALUES
  ('davie', 'Davie', 'Broward', 'email', 'permits@davie.test',
   ARRAY['records@davie.test'], true, 'Local test only — email intake path.')
ON CONFLICT (slug) DO UPDATE SET enabled = true, channel = 'email',
  intake_email = EXCLUDED.intake_email, intake_cc = EXCLUDED.intake_cc;

-- Agent 5 starts where SignWell's webhook left off: the passing permit's signatures are
-- provider_confirmed, exactly as signwell-webhook writes them on document_completed.
UPDATE public.signature_requests
   SET status = 'signed', status_source = 'provider_confirmed',
       signed_at = now(), completed_at = now(), last_event_type = 'document_completed'
 WHERE permit_id = '66666666-6666-6666-6666-666666666666';

-- Staff approver (shared with the earlier seeds) plus a tenant GC who is deliberately not
-- staff, to prove the approval RPC rejects them.
INSERT INTO auth.users (id, email) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'staff@floridianinc.com'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'gc@coastline.test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'admin')
ON CONFLICT DO NOTHING;

INSERT INTO public.tenant_members (tenant_id, user_id, role) VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid,
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'member')
ON CONFLICT DO NOTHING;
