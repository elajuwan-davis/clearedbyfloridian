
DROP POLICY IF EXISTS "Authenticated can insert permits" ON public.permits;
DROP POLICY IF EXISTS "Authenticated can update permits" ON public.permits;
DROP POLICY IF EXISTS "Authenticated can delete permits" ON public.permits;
CREATE POLICY "Authenticated can insert permits" ON public.permits FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update permits" ON public.permits FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can delete permits" ON public.permits FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can insert subs" ON public.subcontractors;
DROP POLICY IF EXISTS "Authenticated can update subs" ON public.subcontractors;
DROP POLICY IF EXISTS "Authenticated can delete subs" ON public.subcontractors;
CREATE POLICY "Authenticated can insert subs" ON public.subcontractors FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update subs" ON public.subcontractors FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can delete subs" ON public.subcontractors FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- Storage: allow authenticated to fully manage files in the permit-files bucket
CREATE POLICY "Auth can read permit-files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'permit-files');
CREATE POLICY "Auth can insert permit-files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'permit-files');
CREATE POLICY "Auth can update permit-files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'permit-files') WITH CHECK (bucket_id = 'permit-files');
CREATE POLICY "Auth can delete permit-files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'permit-files');
