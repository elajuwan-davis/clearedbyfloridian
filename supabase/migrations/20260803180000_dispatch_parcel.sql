-- PAPA parcel data columns added to shared dispatch_results table.

ALTER TABLE public.dispatch_results
  ADD COLUMN IF NOT EXISTS parcel_id TEXT,
  ADD COLUMN IF NOT EXISTS owner_name TEXT,
  ADD COLUMN IF NOT EXISTS year_built INTEGER,
  ADD COLUMN IF NOT EXISTS assessed_value NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS legal_description TEXT,
  ADD COLUMN IF NOT EXISTS parcel_source TEXT;
