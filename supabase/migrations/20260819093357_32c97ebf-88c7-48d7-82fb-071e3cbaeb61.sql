-- Replace direct public writes with an atomic validate-and-burn function.
DROP POLICY IF EXISTS "Anyone can burn an unused investor code" ON public.investor_access_codes;
REVOKE UPDATE (used, used_at) ON public.investor_access_codes FROM anon;
REVOKE UPDATE (used, used_at) ON public.investor_access_codes FROM authenticated;

CREATE OR REPLACE FUNCTION public.redeem_investor_code(_code text)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _hit uuid;
BEGIN
  UPDATE public.investor_access_codes
     SET used = true, used_at = now()
   WHERE code = upper(btrim(_code))
     AND used = false
     AND (expires_at IS NULL OR expires_at > now())
  RETURNING id INTO _hit;

  RETURN _hit IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_investor_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_investor_code(text) TO anon;
GRANT EXECUTE ON FUNCTION public.redeem_investor_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_investor_code(text) TO service_role;