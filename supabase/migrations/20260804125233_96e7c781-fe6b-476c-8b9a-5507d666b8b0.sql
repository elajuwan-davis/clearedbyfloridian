CREATE OR REPLACE FUNCTION public.__tmp_edge_key_matches(_runtime_value text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, vault
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM vault.decrypted_secrets
    WHERE name = 'edge_functions_service_role_key'
      AND decrypted_secret = _runtime_value
  );
$$;

REVOKE ALL ON FUNCTION public.__tmp_edge_key_matches(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.__tmp_edge_key_matches(text) TO service_role;