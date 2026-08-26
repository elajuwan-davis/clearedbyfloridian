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
    v_passcode := upper(substr(md5(gen_random_uuid()::text || clock_timestamp()::text), 1, 8));
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