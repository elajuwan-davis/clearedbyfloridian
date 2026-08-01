INSERT INTO public.user_bookmarks (user_id, path, label)
SELECT u.id, v.path, v.label
FROM auth.users u
CROSS JOIN (VALUES
  ('/portal/permits', 'My Permits'),
  ('/forms/subcontractors', 'Subcontractors')
) AS v(path, label)
ON CONFLICT (user_id, path) DO NOTHING;

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

DROP TRIGGER IF EXISTS seed_default_bookmarks_on_signup ON auth.users;
CREATE TRIGGER seed_default_bookmarks_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.seed_default_bookmarks();