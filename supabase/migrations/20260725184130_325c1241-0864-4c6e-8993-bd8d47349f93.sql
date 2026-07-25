
REVOKE EXECUTE ON FUNCTION public.intel_municipality_stats(TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.intel_common_corrections(TEXT, TEXT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.intel_municipality_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.intel_common_corrections(TEXT, TEXT, INT) TO authenticated;
