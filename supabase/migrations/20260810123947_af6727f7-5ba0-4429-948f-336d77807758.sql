DROP POLICY IF EXISTS tpl_versions_select ON public.hoa_template_versions;

CREATE POLICY tpl_versions_select ON public.hoa_template_versions
FOR SELECT
TO authenticated
USING (
  is_admin()
  OR EXISTS (
    SELECT 1 FROM public.hoa_templates t
    WHERE t.id = hoa_template_versions.template_id
      AND t.created_by_tenant_id IS NOT NULL
      AND t.created_by_tenant_id = current_tenant_id()
  )
);

DROP POLICY IF EXISTS "corr read all authed" ON public.submittal_corrections;

CREATE POLICY "corr read own tenant" ON public.submittal_corrections
FOR SELECT
TO authenticated
USING (
  is_admin()
  OR (tenant_id IS NOT NULL AND tenant_id = current_tenant_id())
);