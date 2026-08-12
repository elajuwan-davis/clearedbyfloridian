ALTER TABLE public.message_threads
  ADD COLUMN IF NOT EXISTS recipient_role text,
  ADD COLUMN IF NOT EXISTS recipient_name text,
  ADD COLUMN IF NOT EXISTS recipient_email text,
  ADD COLUMN IF NOT EXISTS recipient_phone text,
  ADD COLUMN IF NOT EXISTS recipient_contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS message_threads_recipient_contact_idx
  ON public.message_threads (recipient_contact_id);