INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role FROM auth.users u
WHERE u.email IN ('paul@cleared.com','eman@cleared.com','elajuwan@cleared.com')
ON CONFLICT DO NOTHING;