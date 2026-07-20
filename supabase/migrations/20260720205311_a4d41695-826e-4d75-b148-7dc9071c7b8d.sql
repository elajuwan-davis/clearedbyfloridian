
CREATE POLICY "Deny all direct access" ON public.app_user_connections
  AS RESTRICTIVE FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);
