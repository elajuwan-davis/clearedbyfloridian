-- Agent 1 acceptance fixtures: one fully compliant GC, one with an expired license.
-- Applied after fixture.sql + the intake-validator migration.

INSERT INTO auth.users (id, email) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'staff@floridianinc.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin')
ON CONFLICT DO NOTHING;

-- Tenant A — fully compliant
INSERT INTO public.tenants (id, name, license_number) VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Coastline Builders LLC', 'CGC1512345')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.gc_insurance_policies (tenant_id, coverage_type, carrier_name, policy_number, expiration_date) VALUES
  ('11111111-1111-1111-1111-111111111111', 'general_liability', 'Southern Oak', 'GL-99120', CURRENT_DATE + 240),
  ('11111111-1111-1111-1111-111111111111', 'workers_comp',      'FCCI',         'WC-44821', CURRENT_DATE + 180);

INSERT INTO public.paa_signatures (tenant_id, version, signer_name, signer_email, envelope_id) VALUES
  ('11111111-1111-1111-1111-111111111111', 'v0.9 (draft)', 'Marcus Coastline', 'marcus@coastlinebuilders.com', 'SW-TEST0001');

-- Tenant B — expired license, everything else in order
INSERT INTO public.tenants (id, name, license_number) VALUES
  ('22222222-2222-2222-2222-222222222222'::uuid, 'Lapsed Brothers Construction LLC', 'CGC1599999')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.gc_insurance_policies (tenant_id, coverage_type, carrier_name, policy_number, expiration_date) VALUES
  ('22222222-2222-2222-2222-222222222222', 'general_liability', 'Southern Oak', 'GL-77120', CURRENT_DATE + 300),
  ('22222222-2222-2222-2222-222222222222', 'workers_comp',      'FCCI',         'WC-11821', CURRENT_DATE + 260);

INSERT INTO public.paa_signatures (tenant_id, version, signer_name, signer_email, envelope_id) VALUES
  ('22222222-2222-2222-2222-222222222222', 'v0.9 (draft)', 'Dale Lapsed', 'dale@lapsedbros.com', 'SW-TEST0002');

-- Cléared is registered in Miami (both test permits are Miami addresses)
INSERT INTO public.municipality_registrations (municipality, county, registration_type, registration_number, registered_on, expires_on, status) VALUES
  ('Miami', 'Miami-Dade County', 'permit_agent', 'MIA-PA-2026-0117', CURRENT_DATE - 120, CURRENT_DATE + 300, 'active')
ON CONFLICT DO NOTHING;

-- Permits (the AFTER INSERT trigger records its net.http_post call in net.sent_requests)
INSERT INTO public.permits (id, tenant_id, project_name, job_address, city, county, municipality, license_number, contractor_company, contractor_qualifier, permit_type, description) VALUES
  ('33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111',
   'Brickell Rooftop Addition', '1200 Brickell Ave, Miami, FL 33131', 'Miami', 'Miami-Dade County', 'Miami',
   'CGC1512345', 'Coastline Builders LLC', 'Marcus Coastline', 'residential_addition',
   'Add 480 sf rooftop terrace with new pergola and electrical.'),
  ('44444444-4444-4444-4444-444444444444'::uuid, '22222222-2222-2222-2222-222222222222',
   'Flagler Interior Remodel', '1200 Brickell Ave, Miami, FL 33131', 'Miami', 'Miami-Dade County', 'Miami',
   'CGC1599999', 'Lapsed Brothers Construction LLC', 'Dale Lapsed', 'commercial_interior',
   'Interior remodel of 3,000 sf office suite.')
ON CONFLICT (id) DO NOTHING;
