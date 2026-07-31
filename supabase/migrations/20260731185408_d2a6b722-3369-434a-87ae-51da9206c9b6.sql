-- Harden sender identity on public.message_posts only.
DROP POLICY IF EXISTS message_posts_insert ON public.message_posts;

CREATE POLICY message_posts_insert ON public.message_posts
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND (public.is_admin() OR tenant_id = public.current_tenant_id())
    -- official/support identity may only be claimed by real admins
    AND (from_admin = false OR public.is_admin())
  );

-- Defence in depth: normalise/verify the identity fields server-side.
CREATE OR REPLACE FUNCTION public.enforce_message_post_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_admin boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW; -- service_role / server-side paths
  END IF;
  caller_is_admin := public.is_admin();
  IF NOT caller_is_admin THEN
    IF COALESCE(NEW.from_admin, false) THEN
      RAISE EXCEPTION 'Only Cleared staff may post official support replies';
    END IF;
    IF lower(COALESCE(NEW.author_email, '')) = 'help@cleardinc.com'
       OR lower(COALESCE(NEW.author_label, '')) LIKE '%cleard support%'
       OR lower(COALESCE(NEW.author_label, '')) LIKE '%cleared support%' THEN
      RAISE EXCEPTION 'Only Cleared staff may use the support sender identity';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_message_post_identity() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_message_post_identity ON public.message_posts;
CREATE TRIGGER enforce_message_post_identity
  BEFORE INSERT ON public.message_posts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_message_post_identity();