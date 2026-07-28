-- 1. Blog posts: admin-only writes and draft reads
DROP POLICY IF EXISTS "Authenticated can insert posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated can update posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated can delete posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated can view all posts" ON public.blog_posts;

CREATE POLICY "Admins can insert posts" ON public.blog_posts
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update posts" ON public.blog_posts
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete posts" ON public.blog_posts
  FOR DELETE TO authenticated USING (public.is_admin());
CREATE POLICY "Authenticated can view published posts" ON public.blog_posts
  FOR SELECT TO authenticated USING (status = 'published' OR public.is_admin());

-- 2. Permits: remove blanket anon read of shared permits
DROP POLICY IF EXISTS "permits homeowner share read" ON public.permits;
REVOKE SELECT ON public.permits FROM anon;

-- Token-scoped, safe-column accessor for the homeowner status page
CREATE OR REPLACE FUNCTION public.get_homeowner_permit(_token uuid)
RETURNS TABLE(
  id uuid,
  project_name text,
  job_address text,
  city text,
  permit_type text,
  status text,
  submitted_date date,
  issued_date date,
  expiration_date date,
  municipality text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.id, p.project_name, p.job_address, p.city, p.permit_type, p.status,
         p.submitted_date, p.issued_date, p.expiration_date, p.municipality
  FROM public.permits p
  WHERE _token IS NOT NULL
    AND p.homeowner_share_token = _token
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_homeowner_permit(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_homeowner_permit(uuid) TO anon, authenticated, service_role;