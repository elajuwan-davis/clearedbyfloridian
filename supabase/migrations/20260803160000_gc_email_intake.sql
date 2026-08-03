-- GC email intake: alias table, error log, and storage bucket.
-- Valid inbound emails are converted directly into `permits` rows via the
-- `gc-email-intake` edge function (not a separate staging table).

CREATE TABLE IF NOT EXISTS public.gc_email_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  alias TEXT UNIQUE NOT NULL,
  full_email TEXT GENERATED ALWAYS AS (alias || '@cleard.com') STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inbound_email_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alias TEXT,
  to_email TEXT,
  from_email TEXT,
  subject TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO storage.buckets (id, name, public)
VALUES ('intake-docs', 'intake-docs', false)
ON CONFLICT (id) DO NOTHING;
