REVOKE SELECT ON public.hoa_templates FROM anon;
REVOKE SELECT ON public.hoa_templates_shared FROM anon;
GRANT SELECT ON public.hoa_templates_shared TO authenticated;
GRANT SELECT ON public.hoa_templates_shared TO service_role;