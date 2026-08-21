CREATE OR REPLACE FUNCTION public.deck_invites_admin_list(_password text)
RETURNS SETOF public.deck_invites
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _password IS DISTINCT FROM 'Victoria2026!' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY
    SELECT d.* FROM public.deck_invites d
    ORDER BY d.created_at DESC
    LIMIT 200;
END;
$$;

CREATE OR REPLACE FUNCTION public.deck_invites_admin_create(_password text, _label text)
RETURNS public.deck_invites
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.deck_invites;
  v_token text;
  v_passcode text;
BEGIN
  IF _password IS DISTINCT FROM 'Victoria2026!' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF length(btrim(COALESCE(_label, ''))) < 1 OR length(btrim(_label)) > 160 THEN
    RAISE EXCEPTION 'Invalid label';
  END IF;
  FOR i IN 1..6 LOOP
    v_token := replace(gen_random_uuid()::text, '-', '');
    v_passcode := upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 8));
    BEGIN
      INSERT INTO public.deck_invites (token, passcode, label, expires_at)
      VALUES (v_token, v_passcode, btrim(_label), now() + interval '7 days')
      RETURNING * INTO v_row;
      RETURN v_row;
    EXCEPTION WHEN unique_violation THEN
      NULL;
    END;
  END LOOP;
  RAISE EXCEPTION 'Could not generate a unique invite';
END;
$$;

CREATE OR REPLACE FUNCTION public.deck_invites_admin_revoke(_password text, _id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _password IS DISTINCT FROM 'Victoria2026!' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.deck_invites SET revoked = true WHERE id = _id;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.deck_invites_peek(_token text)
RETURNS TABLE(status text, passcode text, expires_at timestamptz, label text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.deck_invites;
BEGIN
  SELECT * INTO v_row FROM public.deck_invites WHERE token = _token LIMIT 1;
  IF NOT FOUND THEN RETURN QUERY SELECT 'invalid'::text, NULL::text, NULL::timestamptz, NULL::text; RETURN; END IF;
  IF v_row.revoked THEN RETURN QUERY SELECT 'revoked'::text, NULL::text, NULL::timestamptz, NULL::text; RETURN; END IF;
  IF v_row.expires_at <= now() THEN RETURN QUERY SELECT 'expired'::text, NULL::text, v_row.expires_at, NULL::text; RETURN; END IF;
  RETURN QUERY SELECT 'active'::text, v_row.passcode, v_row.expires_at, v_row.label;
END;
$$;

CREATE OR REPLACE FUNCTION public.deck_invites_verify(_token text, _passcode text)
RETURNS TABLE(ok boolean, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.deck_invites;
BEGIN
  SELECT * INTO v_row FROM public.deck_invites WHERE token = _token FOR UPDATE;
  IF NOT FOUND THEN RETURN QUERY SELECT false, 'This link is not valid.'::text; RETURN; END IF;
  IF v_row.revoked THEN RETURN QUERY SELECT false, 'Access to this link has been revoked.'::text; RETURN; END IF;
  IF v_row.expires_at <= now() THEN RETURN QUERY SELECT false, 'This link has expired.'::text; RETURN; END IF;
  IF upper(btrim(COALESCE(_passcode, ''))) IS DISTINCT FROM upper(v_row.passcode) THEN
    RETURN QUERY SELECT false, 'Incorrect passcode.'::text; RETURN;
  END IF;
  UPDATE public.deck_invites
     SET view_count = view_count + 1,
         last_viewed_at = now(),
         first_opened_at = COALESCE(first_opened_at, now())
   WHERE id = v_row.id;
  RETURN QUERY SELECT true, NULL::text;
END;
$$;

REVOKE ALL ON FUNCTION public.deck_invites_admin_list(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.deck_invites_admin_create(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.deck_invites_admin_revoke(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.deck_invites_peek(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.deck_invites_verify(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.deck_invites_admin_list(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.deck_invites_admin_create(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.deck_invites_admin_revoke(text, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.deck_invites_peek(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.deck_invites_verify(text, text) TO anon, authenticated, service_role;