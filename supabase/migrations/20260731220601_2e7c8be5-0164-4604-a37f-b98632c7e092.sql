ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS id_document_url text,
  ADD COLUMN IF NOT EXISTS id_document_type text;

ALTER TABLE public.subcontractors
  ADD COLUMN IF NOT EXISTS id_document_url text,
  ADD COLUMN IF NOT EXISTS id_document_type text;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_document_type_chk
  CHECK (id_document_type IS NULL OR id_document_type IN ('drivers_license','passport'));

ALTER TABLE public.subcontractors
  ADD CONSTRAINT subs_id_document_type_chk
  CHECK (id_document_type IS NULL OR id_document_type IN ('drivers_license','passport'));

-- Private ID document storage: owner-scoped access only
CREATE POLICY "id_docs_owner_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'id-documents'
    AND (
      public.is_admin()
      OR name LIKE 'id-verification/profiles/' || auth.uid()::text || '/%'
    )
  );

CREATE POLICY "id_docs_owner_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'id-documents'
    AND name LIKE 'id-verification/profiles/' || auth.uid()::text || '/%'
  );

CREATE POLICY "id_docs_owner_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'id-documents'
    AND name LIKE 'id-verification/profiles/' || auth.uid()::text || '/%'
  )
  WITH CHECK (
    bucket_id = 'id-documents'
    AND name LIKE 'id-verification/profiles/' || auth.uid()::text || '/%'
  );

CREATE POLICY "id_docs_owner_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'id-documents'
    AND name LIKE 'id-verification/profiles/' || auth.uid()::text || '/%'
  );