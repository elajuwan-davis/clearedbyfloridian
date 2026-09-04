-- Photo-based inspection requests: a GC can request an inspection be
-- reviewed from uploaded jobsite photos instead of a live site visit.
-- Photos are stored in the existing permit-files bucket (path
-- "{permit_id}/inspection-photos/...") so the existing storage.objects RLS
-- policies (permit_in_current_tenant on the first path segment) already
-- cover them — no new bucket or storage policy needed.

ALTER TABLE public.permit_inspections
  ADD COLUMN IF NOT EXISTS request_method TEXT NOT NULL DEFAULT 'live',
  ADD COLUMN IF NOT EXISTS photos JSONB NOT NULL DEFAULT '[]'::jsonb;
