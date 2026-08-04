-- Preferred time-of-day for inspection requests (scheduled_date remains the date).
ALTER TABLE public.permit_inspections
  ADD COLUMN IF NOT EXISTS preferred_time TEXT;

COMMENT ON COLUMN public.permit_inspections.preferred_time IS
  'Preferred time window or clock time (e.g. morning, afternoon, 09:00).';
