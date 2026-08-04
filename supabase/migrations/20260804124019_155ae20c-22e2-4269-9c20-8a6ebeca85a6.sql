CREATE OR REPLACE FUNCTION public.__tmp_store_edge_key(_value text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM vault.secrets WHERE name = 'edge_functions_service_role_key';
  IF v_id IS NULL THEN
    PERFORM vault.create_secret(_value, 'edge_functions_service_role_key', 'service_role key used by dispatch_edge_function()');
  ELSE
    PERFORM vault.update_secret(v_id, _value, 'edge_functions_service_role_key', 'service_role key used by dispatch_edge_function()');
  END IF;
  RETURN 'ok';
END;
$$;

REVOKE ALL ON FUNCTION public.__tmp_store_edge_key(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.__tmp_store_edge_key(text) TO service_role;