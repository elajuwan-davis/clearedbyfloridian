DROP POLICY IF EXISTS tpl_versions_insert ON public.hoa_template_versions;

CREATE POLICY tpl_versions_insert ON public.hoa_template_versions
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.hoa_templates t
    WHERE t.id = hoa_template_versions.template_id
      AND (
        t.created_by = auth.uid()
        OR (t.created_by_tenant_id IS NOT NULL AND t.created_by_tenant_id = public.current_tenant_id())
      )
  )
);