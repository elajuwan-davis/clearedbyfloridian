DROP POLICY IF EXISTS permit_files_update ON storage.objects;

CREATE POLICY permit_files_update ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'permit-files'
  AND (
    is_admin()
    OR owner = auth.uid()
    OR (
      (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND permit_in_current_tenant((((storage.foldername(name))[1]))::uuid)
    )
  )
)
WITH CHECK (
  bucket_id = 'permit-files'
  AND (
    is_admin()
    OR (
      (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND permit_in_current_tenant((((storage.foldername(name))[1]))::uuid)
    )
  )
);