create table if not exists public.signup_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  ip_hash text,
  outcome text not null default 'attempted',
  created_at timestamptz not null default now()
);

GRANT ALL ON public.signup_attempts TO service_role;

alter table public.signup_attempts enable row level security;

create index if not exists signup_attempts_email_created_idx
  on public.signup_attempts (lower(email), created_at desc);

create index if not exists signup_attempts_ip_created_idx
  on public.signup_attempts (ip_hash, created_at desc);

comment on table public.signup_attempts is
  'Rate-limit ledger for public self-serve signups. Service-role only; ip_hash is a salted hash, not an address.';

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS tour_completed_at timestamptz;