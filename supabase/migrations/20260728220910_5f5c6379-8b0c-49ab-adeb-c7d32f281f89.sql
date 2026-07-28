DROP POLICY IF EXISTS permit_files_select ON storage.objects;

CREATE POLICY permit_files_select ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'permit-files'
  AND (
    public.is_admin()
    OR owner = auth.uid()
    OR (
      (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND (
        public.permit_in_current_tenant(((storage.foldername(name))[1])::uuid)
        OR EXISTS (
          SELECT 1 FROM public.subcontractors s
          WHERE s.id = ((storage.foldername(name))[1])::uuid
            AND s.tenant_id = public.current_tenant_id()
        )
      )
    )
    OR (
      (storage.foldername(name))[1] = 'subs'
      AND (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND EXISTS (
        SELECT 1 FROM public.subcontractors s
        WHERE s.completion_token = ((storage.foldername(name))[2])::uuid
          AND s.tenant_id = public.current_tenant_id()
      )
    )
  )
);