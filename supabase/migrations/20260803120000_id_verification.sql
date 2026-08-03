-- ID verification backend for the IdUpload component
-- Adds the ID document columns directly to the live `permits` table,
-- creates the private `id-verification` storage bucket, and enables RLS.

ALTER TABLE public.permits
  ADD COLUMN IF NOT EXISTS id_document_url TEXT,
  ADD COLUMN IF NOT EXISTS id_document_type TEXT CHECK (id_document_type IN ('drivers_license', 'passport')),
  ADD COLUMN IF NOT EXISTS id_uploaded_at TIMESTAMPTZ;

-- Private storage bucket for uploaded ID documents.
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
-- Path convention: id-verification/{user_id}/{permit_id}/{filename}
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
