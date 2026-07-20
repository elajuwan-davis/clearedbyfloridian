GRANT SELECT ON public.permits TO anon;
CREATE POLICY "Anon can view permits" ON public.permits FOR SELECT TO anon USING (true);