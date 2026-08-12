DELETE FROM public.user_bookmarks WHERE path IN ('/portal/contacts', '/portal/contacts/', '/forms/contacts');

CREATE OR REPLACE FUNCTION public.seed_default_bookmarks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_bookmarks (user_id, path, label)
  VALUES
    (NEW.id, '/portal/permits', 'My Permits'),
    (NEW.id, '/forms/subcontractors', 'Subcontractors')
  ON CONFLICT (user_id, path) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.seed_default_bookmarks() FROM PUBLIC;