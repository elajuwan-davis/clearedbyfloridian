-- ID verification storage: private `id-verification` bucket for future use.
-- Existing `profiles` and `subcontractors` already store ID document paths in
-- `id_document_url` / `id_document_type` and use the `id-documents` bucket.
-- No columns are added to any table by this migration.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'id-verification',
  'id-verification',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'application/pdf'];

-- Enable RLS on storage objects and scope access to the authenticated owner.
-- Path convention: id-verification/{user_id}/{...}/{filename}
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'owner_storage'
  ) THEN
    CREATE POLICY "owner_storage" ON storage.objects FOR ALL
      USING (bucket_id = 'id-verification' AND auth.uid()::text = (storage.foldername(name))[2]);
  END IF;
END $$;
