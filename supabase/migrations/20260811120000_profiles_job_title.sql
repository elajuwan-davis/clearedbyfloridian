-- Staff job titles for workload / assignee roster (nullable — empty means no title shown).
-- Cap at 120 chars so a profile row cannot store an arbitrarily large title.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS job_title varchar(120);

-- If an earlier revision already added unbounded text, tighten it in place.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'job_title'
      AND udt_name = 'text'
  ) THEN
    ALTER TABLE public.profiles
      ALTER COLUMN job_title TYPE varchar(120)
      USING CASE WHEN job_title IS NULL THEN NULL ELSE left(job_title, 120) END;
  END IF;
END $$;
