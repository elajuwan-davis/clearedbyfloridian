-- Staff job titles for workload / assignee roster (nullable — empty means no title shown).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS job_title text;
