-- ID verification backend for the IdUpload component
-- Adds the required intake_records columns, creates a private storage bucket,
-- and enables RLS policies scoped to the authenticated record owner.

-- Ensure the intake_records table exists with an owner column for RLS.
CREATE TABLE IF NOT EXISTS public.intake_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add the ID document columns to the intake table.
ALTER TABLE public.intake_records
  ADD COLUMN IF NOT EXISTS id_document_url TEXT,
  ADD COLUMN IF NOT EXISTS id_document_type TEXT CHECK (id_document_type IN ('drivers_license', 'passport')),
  ADD COLUMN IF NOT EXISTS id_uploaded_at TIMESTAMPTZ;

-- Enable RLS on the intake table and scope access to the record owner.
ALTER TABLE public.intake_records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'intake_records' AND policyname = 'owner_select'
  ) THEN
    CREATE POLICY "owner_select" ON public.intake_records FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'intake_records' AND policyname = 'owner_update'
  ) THEN
    CREATE POLICY "owner_update" ON public.intake_records FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

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
