-- The acknowledgment recipient for a parsed correction plan.
--
-- corrections-parser has always read permits.correction_reply_email as the permit-specific
-- override, but the column was never created — so the only possible recipient was the
-- municipality's intake_email, and Plantation (the Agent 5/7 pilot, a portal-channel city)
-- has none. approve_correction_plan() therefore refused every Plantation plan with
-- "has no acknowledgment recipient — nothing to approve".
--
-- Precedence, as implemented in corrections-parser:
--   1. permits.correction_reply_email                  — the reviewer/plans examiner on this job
--   2. municipality_submission_targets.intake_email    — the department's general address
--   3. the submission draft's captured municipality intake_email
-- No recipient still means no approval: an acknowledgment is external correspondence and is
-- never sent to a guessed address.

ALTER TABLE public.permits
  ADD COLUMN IF NOT EXISTS correction_reply_email text;

COMMENT ON COLUMN public.permits.correction_reply_email IS
  'Where a correction-notice acknowledgment goes for this permit — the reviewer or plans '
  'examiner who issued the letter, when known. Takes precedence over the municipality''s '
  'general intake_email.';

-- Plantation's general correspondence address is deliberately left NULL: no verified address
-- is on file, and inventing one would send real correspondence to the wrong place. Set it
-- before relying on the municipality-level fallback for this city.
UPDATE public.municipality_submission_targets
   SET notes = notes ||
       ' TODO: intake_email is unset — a verified City of Plantation Building Department '
       'correspondence address is needed before correction acknowledgments can fall back to '
       'the municipality level. Until then a per-permit correction_reply_email is required.',
       updated_at = now()
 WHERE slug = 'plantation'
   AND intake_email IS NULL
   AND notes NOT LIKE '%TODO: intake_email is unset%';
