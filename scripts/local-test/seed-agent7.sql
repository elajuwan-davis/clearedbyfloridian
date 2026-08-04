-- Agent 7 acceptance fixture: two correction notices on the filed pilot permit.
--
-- Assumes fixture.sql, the Agent 5 + Agent 6 migrations with seed-agent5.sql / seed-agent6.sql,
-- and the Agent 7 migration have been loaded. The letter body is scripts/local-test/
-- correction-letter.txt (a realistic Plantation plan review, six numbered comments spanning
-- structural, plan-dimension, documentation, fee and qualifier items) and is loaded with \set.

\set letter `cat scripts/local-test/correction-letter.txt`

-- Insert with the parse trigger detached: locally net.http_post only records the call, and the
-- point of the fixture is to have the notices sitting there ready to be parsed on demand.
ALTER TABLE public.correction_notices DISABLE TRIGGER trg_correction_notices_parse;

DELETE FROM public.correction_plans
 WHERE notice_id IN ('c7000000-0000-0000-0000-000000000001',
                     'c7000000-0000-0000-0000-000000000002');
DELETE FROM public.correction_notices
 WHERE id IN ('c7000000-0000-0000-0000-000000000001',
              'c7000000-0000-0000-0000-000000000002');

-- 1. The readable letter, exactly as the portal poller captured it.
INSERT INTO public.correction_notices
  (id, tenant_id, permit_id, submission_id, municipality_slug, source, notice_label,
   issued_at, document_path, raw_text, detected_by, status)
VALUES
  ('c7000000-0000-0000-0000-000000000001',
   (SELECT tenant_id FROM public.permits WHERE id = '33333333-3333-3333-3333-333333333333'),
   '33333333-3333-3333-3333-333333333333',
   '66666666-6666-6666-6666-666666666666',
   'plantation', 'portal_poll', 'Plan Review Comments (1)',
   now() - interval '2 days',
   'permits/33333333-3333-3333-3333-333333333333/corrections/plan-review-comments-1.pdf',
   :'letter',
   'status-worker', 'new');

-- 2. A notice with no readable text and no stored document — the parser must refuse it and
--    ask staff for the letter rather than inventing comments.
INSERT INTO public.correction_notices
  (id, tenant_id, permit_id, submission_id, municipality_slug, source, notice_label,
   issued_at, document_path, raw_text, detected_by, status)
VALUES
  ('c7000000-0000-0000-0000-000000000002',
   (SELECT tenant_id FROM public.permits WHERE id = '33333333-3333-3333-3333-333333333333'),
   '33333333-3333-3333-3333-333333333333',
   '66666666-6666-6666-6666-666666666666',
   'plantation', 'staff_upload', 'Scanned corrections (unreadable)',
   now() - interval '1 day',
   NULL, NULL, 'staff', 'new');

ALTER TABLE public.correction_notices ENABLE TRIGGER trg_correction_notices_parse;

-- Where the acknowledgment would go. Nothing sends without an approval, but staff must see a
-- concrete recipient before approving one.
UPDATE public.municipality_submission_targets
   SET intake_email = COALESCE(intake_email, 'plans@plantation.example.gov')
 WHERE slug = 'plantation';
