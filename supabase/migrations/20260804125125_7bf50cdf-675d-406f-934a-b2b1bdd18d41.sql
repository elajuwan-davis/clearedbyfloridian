CREATE OR REPLACE FUNCTION public.__tmp_replace_and_verify_edge_key(_value text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_id uuid;
  v_stored text;
BEGIN
  IF _value IS NULL OR _value = '' OR _value IS DISTINCT FROM btrim(_value) THEN
    RAISE EXCEPTION 'invalid key formatting';
  END IF;

  SELECT id INTO v_id
  FROM vault.secrets
  WHERE name = 'edge_functions_service_role_key'
  LIMIT 1;

  IF v_id IS NULL THEN
    PERFORM vault.create_secret(
      _value,
      'edge_functions_service_role_key',
      'service_role key used by dispatch_edge_function()'
    );
  ELSE
    PERFORM vault.update_secret(
      v_id,
      _value,
      'edge_functions_service_role_key',
      'service_role key used by dispatch_edge_function()'
    );
  END IF;

  SELECT decrypted_secret INTO v_stored
  FROM vault.decrypted_secrets
  WHERE name = 'edge_functions_service_role_key'
  LIMIT 1;

  RETURN v_stored = _value;
END;
$$;

REVOKE ALL ON FUNCTION public.__tmp_replace_and_verify_edge_key(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.__tmp_replace_and_verify_edge_key(text) TO service_role;