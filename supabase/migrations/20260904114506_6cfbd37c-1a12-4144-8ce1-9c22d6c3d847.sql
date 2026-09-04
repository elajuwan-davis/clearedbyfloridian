ALTER TABLE public.permit_inspections
  ADD COLUMN IF NOT EXISTS request_method TEXT NOT NULL DEFAULT 'live',
  ADD COLUMN IF NOT EXISTS photos JSONB NOT NULL DEFAULT '[]'::jsonb;