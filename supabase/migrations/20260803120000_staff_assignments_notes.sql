-- Internal staff ops: assignments + notes. Staff/admin only (is_admin); never visible to GCs.

CREATE TABLE public.staff_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_id uuid NOT NULL REFERENCES public.permits(id) ON DELETE CASCADE,
  assignee_email text,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
  escalated boolean NOT NULL DEFAULT false,
  escalated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (permit_id)
);

CREATE TABLE public.staff_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_id uuid NOT NULL REFERENCES public.permits(id) ON DELETE CASCADE,
  author text NOT NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_internal boolean NOT NULL DEFAULT true
);

CREATE INDEX staff_assignments_assignee_email_idx ON public.staff_assignments (assignee_email);
CREATE INDEX staff_notes_permit_id_idx ON public.staff_notes (permit_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_assignments TO authenticated;
GRANT ALL ON public.staff_assignments TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_notes TO authenticated;
GRANT ALL ON public.staff_notes TO service_role;

ALTER TABLE public.staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_assignments admin all" ON public.staff_assignments
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "staff_notes admin all" ON public.staff_notes
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER staff_assignments_touch_updated_at
  BEFORE UPDATE ON public.staff_assignments
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
