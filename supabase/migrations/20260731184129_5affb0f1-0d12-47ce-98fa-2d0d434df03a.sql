-- 1. Tenant-scope the base table (contact PII no longer cross-tenant readable)
DROP POLICY IF EXISTS "hoa_templates read all authenticated" ON public.hoa_templates;

CREATE POLICY "hoa_templates read own tenant" ON public.hoa_templates
FOR SELECT TO authenticated
USING (
  public.is_admin()
  OR (created_by_tenant_id IS NOT NULL AND created_by_tenant_id = public.current_tenant_id())
);

-- 2. Shared, non-PII community directory for cross-tenant browsing.
--    Deliberately NOT security_invoker: exposure is bounded by the column
--    list plus the authenticated-only grant. No contact columns here.
CREATE OR REPLACE VIEW public.hoa_templates_shared AS
SELECT
  id,
  community_name,
  city,
  submission_method,
  submission_portal_url,
  required_documents,
  deposit_amount_cents,
  deposit_type,
  arc_meeting_notes,
  form_template,
  uploaded_form_path,
  last_used_at,
  usage_count,
  created_by_tenant_id,
  created_at,
  updated_at,
  current_version,
  current_version_at,
  (hoa_contact_email IS NOT NULL AND hoa_contact_email <> '') AS has_contact_email
FROM public.hoa_templates;

REVOKE ALL ON public.hoa_templates_shared FROM PUBLIC;
GRANT SELECT ON public.hoa_templates_shared TO authenticated;
GRANT SELECT ON public.hoa_templates_shared TO service_role;