-- Agent 2 acceptance fixtures. Assumes fixture.sql + seed-agent1.sql already ran.
--
-- Green permit 3333... gets the owner / contractor data the NTO mappings need
-- and is flagged as a private-provider job so the owner authorization letter is
-- generated too.
--
-- Permit 5555... is deliberately missing owner_name and company_address so the
-- un-fillable-field notification path is exercised.

ALTER TABLE public.permits
  ADD COLUMN IF NOT EXISTS company_address text,
  ADD COLUMN IF NOT EXISTS pcn text,
  ADD COLUMN IF NOT EXISTS poc_email text;

UPDATE public.permits SET
  owner_name = 'Brickell Terrace Holdings LLC',
  company_address = '2400 SW 8th St, Miami, FL 33135',
  poc_email = 'owner@brickellterrace.example',
  pcn = '01-4139-000-0130',
  permit_number = 'MIA-2026-004417',
  submitted_date = CURRENT_DATE,
  intake_payload = jsonb_build_object(
    'owner_address', '2400 SW 8th St, Miami, FL 33135',
    'private_provider', true
  )
WHERE id = '33333333-3333-3333-3333-333333333333';

INSERT INTO public.permits (
  id, tenant_id, project_name, job_address, city, county, municipality,
  license_number, contractor_company, contractor_qualifier, permit_type, description,
  intake_payload
) VALUES (
  '55555555-5555-5555-5555-555555555555'::uuid, '11111111-1111-1111-1111-111111111111',
  'Coral Way Pool Deck', '1200 Brickell Ave, Miami, FL 33131', 'Miami', 'Miami-Dade County', 'Miami',
  'CGC1512345', 'Coastline Builders LLC', 'Marcus Coastline', 'swimming pool',
  'New pool with paver deck and equipment pad.',
  jsonb_build_object('private_provider', true)
) ON CONFLICT (id) DO NOTHING;
