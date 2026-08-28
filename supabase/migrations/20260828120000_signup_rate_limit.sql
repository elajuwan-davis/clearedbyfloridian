-- Abuse protection for the public /join signup endpoint.
--
-- One row per attempt (accepted or rejected) so the server function can count recent
-- attempts per network and per email before it creates anything. Written and read only
-- by the service-role client: RLS is on with no policies, so no anon/authenticated
-- role can read or write it.
--
-- The client IP is stored as a salted hash, never in the clear.

create table if not exists public.signup_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  ip_hash text,
  outcome text not null default 'attempted',
  created_at timestamptz not null default now()
);

alter table public.signup_attempts enable row level security;

create index if not exists signup_attempts_email_created_idx
  on public.signup_attempts (lower(email), created_at desc);

create index if not exists signup_attempts_ip_created_idx
  on public.signup_attempts (ip_hash, created_at desc);

comment on table public.signup_attempts is
  'Rate-limit ledger for public self-serve signups. Service-role only; ip_hash is a salted hash, not an address.';
