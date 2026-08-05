-- Statewide (FDOR) parcel lookup carries two facts the Palm-Beach-only version had nowhere to
-- put: heated living area, and which tax roll the valuation came from. The roll year matters —
-- the statewide layer is a year behind by design, and a stale assessed value should be
-- readable as stale rather than presented as current.

ALTER TABLE public.dispatch_results
  ADD COLUMN IF NOT EXISTS living_area_sqft INTEGER,
  ADD COLUMN IF NOT EXISTS assessment_year INTEGER;

COMMENT ON COLUMN public.dispatch_results.living_area_sqft IS
  'Total heated living area in square feet, as reported to the Department of Revenue.';
COMMENT ON COLUMN public.dispatch_results.assessment_year IS
  'Tax roll year the valuation came from. Null for sources that do not report one.';
COMMENT ON COLUMN public.dispatch_results.parcel_source IS
  'Which system answered: ''papa'' (Palm Beach County Property Appraiser, live), '
  '''fdor_statewide'' (Department of Revenue statewide cadastral, prior tax roll), '
  'or ''unavailable''.';
