-- Agent 4 acceptance fixtures: one fully complete permit, one blocked on a missing
-- signature. Applied after fixture.sql + the pre-submission-check migration.
--
-- Also creates the production tables the shared fixture does not carry yet
-- (service_fee_invoices) and the RLS helper the migration's policy references.

CREATE TABLE IF NOT EXISTS public.service_fee_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  permit_id uuid NOT NULL REFERENCES public.permits(id) ON DELETE CASCADE,
  environment text NOT NULL DEFAULT 'test',
  project_value_cents bigint NOT NULL DEFAULT 0,
  fee_cents bigint NOT NULL DEFAULT 0,
  processing_fee_cents bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.permit_in_current_tenant(_permit_id uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.permits p
    WHERE p.id = _permit_id AND p.tenant_id = public.current_tenant_id()
  );
$$;

-- Permit A — everything in place.
INSERT INTO public.permits (
  id, tenant_id, project_name, job_address, city, county, municipality, permit_type,
  status, license_number, contractor_company, documents, document_bundle_path,
  document_bundle_report
) VALUES (
  '66666666-6666-6666-6666-666666666666'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Del Prado Retail Buildout',
  '4200 NW 2nd Ave',
  'Miami', 'Miami-Dade', 'Miami', 'commercial_interior',
  'submitted', 'CGC1512345', 'Coastline Builders LLC',
  '[
    {"key":"signed_application","label":"Signed application","required":true,"status":"uploaded","filename":"application.pdf","path":"66666666-6666-6666-6666-666666666666/application.pdf","mime":"application/pdf"},
    {"key":"construction_plans","label":"Construction plans","required":true,"status":"uploaded","filename":"plans.pdf","path":"66666666-6666-6666-6666-666666666666/plans.pdf","mime":"application/pdf"}
  ]'::jsonb,
  'document-bundles/66666666-6666-6666-6666-666666666666/submittal-bundle-local.pdf',
  '{"unfillable_fields": [], "forms": [{"key":"nto","generated":true}]}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  documents = EXCLUDED.documents,
  document_bundle_path = EXCLUDED.document_bundle_path,
  document_bundle_report = EXCLUDED.document_bundle_report;

INSERT INTO public.nto_filings (permit_id, contractor_name, contractor_address, status, pdf_path)
SELECT '66666666-6666-6666-6666-666666666666', 'Coastline Builders LLC', '1 Main St', 'generated',
       'nto/66666666-6666-6666-6666-666666666666/nto.pdf'
WHERE NOT EXISTS (
  SELECT 1 FROM public.nto_filings WHERE permit_id = '66666666-6666-6666-6666-666666666666'
);

INSERT INTO public.service_fee_invoices (permit_id, fee_cents, project_value_cents, status, paid_at)
SELECT '66666666-6666-6666-6666-666666666666', 49900, 25000000, 'paid', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.service_fee_invoices
  WHERE permit_id = '66666666-6666-6666-6666-666666666666'
);

INSERT INTO public.signature_requests (
  permit_id, tenant_id, document_name, recipient_email, recipient_role, status, sent_at, signed_at
)
SELECT '66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111',
       'Permit application package', 'qualifier@coastline.test', 'General Contractor',
       'signed', now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.signature_requests
  WHERE permit_id = '66666666-6666-6666-6666-666666666666'
);

-- Permit B — identical, except the routed signature is still outstanding.
INSERT INTO public.permits (
  id, tenant_id, project_name, job_address, city, county, municipality, permit_type,
  status, license_number, contractor_company, documents, document_bundle_path,
  document_bundle_report
) VALUES (
  '77777777-7777-7777-7777-777777777777'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Wynwood Shell Alteration',
  '2300 NW 5th Ave',
  'Miami', 'Miami-Dade', 'Miami', 'commercial_interior',
  'submitted', 'CGC1512345', 'Coastline Builders LLC',
  '[
    {"key":"signed_application","label":"Signed application","required":true,"status":"uploaded","filename":"application.pdf","path":"77777777-7777-7777-7777-777777777777/application.pdf","mime":"application/pdf"},
    {"key":"construction_plans","label":"Construction plans","required":true,"status":"uploaded","filename":"plans.pdf","path":"77777777-7777-7777-7777-777777777777/plans.pdf","mime":"application/pdf"}
  ]'::jsonb,
  'document-bundles/77777777-7777-7777-7777-777777777777/submittal-bundle-local.pdf',
  '{"unfillable_fields": []}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  documents = EXCLUDED.documents,
  document_bundle_path = EXCLUDED.document_bundle_path,
  document_bundle_report = EXCLUDED.document_bundle_report;

INSERT INTO public.nto_filings (permit_id, contractor_name, contractor_address, status, pdf_path)
SELECT '77777777-7777-7777-7777-777777777777', 'Coastline Builders LLC', '1 Main St', 'generated',
       'nto/77777777-7777-7777-7777-777777777777/nto.pdf'
WHERE NOT EXISTS (
  SELECT 1 FROM public.nto_filings WHERE permit_id = '77777777-7777-7777-7777-777777777777'
);

INSERT INTO public.service_fee_invoices (permit_id, fee_cents, project_value_cents, status, paid_at)
SELECT '77777777-7777-7777-7777-777777777777', 49900, 25000000, 'paid', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.service_fee_invoices
  WHERE permit_id = '77777777-7777-7777-7777-777777777777'
);

INSERT INTO public.signature_requests (
  permit_id, tenant_id, document_name, recipient_email, recipient_role, status, sent_at
)
SELECT '77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111',
       'Permit application package', 'qualifier@coastline.test', 'General Contractor',
       'sent', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.signature_requests
  WHERE permit_id = '77777777-7777-7777-7777-777777777777'
);
