CREATE TABLE public.deck_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token text NOT NULL UNIQUE,
  passcode text NOT NULL,
  label text NOT NULL DEFAULT '',
  expires_at timestamptz NOT NULL,
  revoked boolean NOT NULL DEFAULT false,
  view_count integer NOT NULL DEFAULT 0,
  first_opened_at timestamptz,
  last_viewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX deck_invites_token_idx ON public.deck_invites (token);

GRANT ALL ON public.deck_invites TO service_role;

ALTER TABLE public.deck_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deck invites are server-managed only"
  ON public.deck_invites FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);