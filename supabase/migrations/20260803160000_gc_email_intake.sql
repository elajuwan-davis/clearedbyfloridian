-- GC email intake: alias table, permit staging table, and error log.
-- Storage bucket for attachments is also created here for deploy-time setup.

CREATE TABLE IF NOT EXISTS public.gc_email_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  alias TEXT UNIQUE NOT NULL,
  full_email TEXT GENERATED ALWAYS AS (alias || '@cleard.com') STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.permit_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  gc_email_address_id UUID REFERENCES public.gc_email_addresses(id) ON DELETE SET NULL,
  subject TEXT,
  sender TEXT,
  body_preview TEXT,
  status TEXT NOT NULL DEFAULT 'pre_check',
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
