ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Backfill emails + derived names for existing users
INSERT INTO public.profiles (id, email, display_name)
SELECT u.id, u.email,
       initcap(replace(split_part(coalesce(u.email,''), '@', 1), '.', ' '))
FROM auth.users u
ON CONFLICT (id) DO UPDATE
  SET email = COALESCE(public.profiles.email, EXCLUDED.email),
      display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name);

UPDATE public.profiles p SET display_name = 'Elajuwan Davis', full_name = 'Elajuwan Davis'
WHERE lower(p.email) = 'elajuwan@cleared.com';
UPDATE public.profiles p SET display_name = 'Paul Gotera', full_name = 'Paul Gotera'
WHERE lower(p.email) = 'paul@cleared.com';

-- Ensure every new signup gets a profile row with real credentials
CREATE OR REPLACE FUNCTION public.ensure_profile_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      initcap(replace(split_part(coalesce(NEW.email,''), '@', 1), '.', ' '))
    ),
    NULLIF(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO UPDATE
    SET email = COALESCE(public.profiles.email, EXCLUDED.email),
        display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.ensure_profile_for_new_user();