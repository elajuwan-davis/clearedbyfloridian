-- Agent 6 acceptance fixture: one permit that has actually been filed at the pilot, so
-- check_permit_status() has something to enqueue.
--
-- Assumes fixture.sql, the Agent 5 migration + seed-agent5.sql, and the Agent 6 migration
-- have been loaded.

-- The permit is 'submitted' in the pipeline and has a live portal submission with a
-- confirmation number (that number is what the poller looks the record up by).
UPDATE public.permits
   SET status = 'submitted'
 WHERE id = '33333333-3333-3333-3333-333333333333';

DELETE FROM public.municipality_submissions
 WHERE permit_id = '33333333-3333-3333-3333-333333333333';

INSERT INTO public.municipality_submissions
  (id, tenant_id, permit_id, municipality_slug, channel, status, draft,
   approved_by, approved_at, submitted_at, confirmation_number)
VALUES
  ('66666666-6666-6666-6666-666666666666',
   (SELECT tenant_id FROM public.permits WHERE id = '33333333-3333-3333-3333-333333333333'),
   '33333333-3333-3333-3333-333333333333', 'plantation', 'portal', 'submitted',
   jsonb_build_object(
     'municipality', jsonb_build_object(
       'slug', 'plantation', 'city_name', 'Plantation',
       'portal_url', COALESCE(current_setting('cleard.aca_url', true),
                              'http://localhost:54340/CitizenAccess/Default.aspx'),
       'driver', 'accela_aca')),
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', now() - interval '9 days',
   now() - interval '9 days', '26BLD-004512');

-- A GC portal login for this permit's creator already exists from seed-agent5.sql.
