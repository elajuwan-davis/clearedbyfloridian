-- Onboard the Accela Citizen Access municipalities found in the building-department
-- login spreadsheet as submission targets.
--
-- Every row here is enabled = false. That flag is the staff go-live switch and stays a
-- manual, per-city decision: nothing files anywhere until a human has tested the city
-- and flipped it. Plantation (the pilot) is the only enabled target and is not touched
-- by this migration.
--
-- Only Accela ACA cities are added. Other portal software (Tyler EnerGov, CityView) has
-- no driver, and a target row with driver = 'accela_aca' would point the worker at a
-- portal it does not speak — see docs/portal-automation-backlog.md instead.

INSERT INTO public.municipality_submission_targets
  (slug, city_name, county, channel, driver, portal_url, enabled, notes)
VALUES
  -- Accela's own hosted ACA tenant (aca-prod.accela.com/MARTINCO/) rather than a
  -- city-hosted /CitizenAccess/ install. Same software the Plantation driver drives, but
  -- the record-search and application layouts have not been walked through yet.
  ('martin-county', 'Martin County', 'Martin', 'portal', 'accela_aca',
   'https://aca-prod.accela.com/MARTINCO/Default.aspx', false,
   'From the building-dept login sheet. Accela ACA (Accela-hosted tenant). Disabled: staff must file one permit here by hand and confirm the ACA layout before enabling.')
ON CONFLICT (slug) DO NOTHING;
