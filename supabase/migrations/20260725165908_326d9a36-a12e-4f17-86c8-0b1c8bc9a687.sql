
-- Helper: does the caller's tenant own the given permit id?
CREATE OR REPLACE FUNCTION public.permit_in_current_tenant(_permit_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.permits p
    WHERE p.id = _permit_id
      AND p.tenant_id = public.current_tenant_id()
  )
$$;

-- Replace permissive storage policies with ownership-checked ones.
DROP POLICY IF EXISTS "Auth can read permit-files" ON storage.objects;
DROP POLICY IF EXISTS "Auth can update permit-files" ON storage.objects;
DROP POLICY IF EXISTS "Auth can delete permit-files" ON storage.objects;
DROP POLICY IF EXISTS "Auth can insert permit-files" ON storage.objects;

-- INSERT: any authenticated user may upload into permit-files.
CREATE POLICY "permit_files_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'permit-files');

-- SELECT/UPDATE/DELETE: admin OR (path first segment is a uuid that is either
--   (a) a permit whose tenant matches the caller's tenant, or
--   (b) a subcontractor whose tenant matches, or
--   (c) an object the caller owns — objects.owner = auth.uid()).
-- Non-uuid first segments (project-docs/*, sub-intake/*, city-docs/*) allow
-- caller-owned reads only, plus admin bypass.
CREATE POLICY "permit_files_select"
  ON storage.objects FOR SELECT TO authenticated
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
    )
  );

CREATE POLICY "permit_files_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'permit-files'
    AND (
      public.is_admin()
      OR owner = auth.uid()
      OR (
        (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND public.permit_in_current_tenant(((storage.foldername(name))[1])::uuid)
      )
    )
  )
  WITH CHECK (bucket_id = 'permit-files');

CREATE POLICY "permit_files_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'permit-files'
    AND (
      public.is_admin()
      OR owner = auth.uid()
      OR (
        (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND public.permit_in_current_tenant(((storage.foldername(name))[1])::uuid)
      )
    )
  );

-- gc_portal_logins was flagged in Turn A as denied to authenticated.
-- Make sure only tenant members can access their tenant's logins, and admin sees all.
DROP POLICY IF EXISTS "gc_portal_logins_all" ON public.gc_portal_logins;
CREATE POLICY "gc_portal_logins_all"
  ON public.gc_portal_logins FOR ALL TO authenticated
  USING (public.is_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_admin() OR tenant_id = public.current_tenant_id());

-- App user connections: user can only manage their own.
DROP POLICY IF EXISTS "app_user_connections_all" ON public.app_user_connections;
CREATE POLICY "app_user_connections_all"
  ON public.app_user_connections FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
