-- Self-serve signup + first-login tour.
--
-- plan: informational only for now. Nothing gates on it; it exists so staff can tell a
--       self-serve trial signup apart from an invited account, and so a later tiering pass
--       has a column to key off.
-- tour_completed_at: set when the first-login tour is finished or skipped, so it shows once.

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS tour_completed_at timestamptz;
