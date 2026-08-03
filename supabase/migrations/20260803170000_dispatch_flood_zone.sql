-- Dispatch results cache for FEMA flood zone lookups.

CREATE TABLE IF NOT EXISTS public.dispatch_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  flood_zone TEXT,
  in_sfha BOOLEAN,
  base_flood_elev NUMERIC(6,2),
  raw_response JSONB,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispatch_results_lat_lng_fetched
  ON public.dispatch_results (latitude, longitude, fetched_at);
