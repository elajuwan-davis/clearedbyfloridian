ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS card_prompt_dismissed_at timestamptz;

UPDATE public.tenants
   SET trial_started_at = COALESCE(trial_started_at, created_at, now())
 WHERE trial_started_at IS NULL;

ALTER TABLE public.tenants
  ALTER COLUMN trial_started_at SET DEFAULT now();