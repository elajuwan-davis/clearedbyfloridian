# AGENTS.md

## Cursor Cloud specific instructions

### What this is
Cleard is a single **TanStack Start v1 (React 19)** app (SSR + server functions + file-based
routing) built with **Vite 7** and the `bun` package manager. There is no separate backend service
in this repo — it talks to a hosted **Supabase** project ("Lovable Cloud") for Postgres, Auth, and
Storage. See `README.md` / `FEATURES.md` for the full feature map.

### Package manager & commands
- Use **bun** (there is a `bun.lock` + `bunfig.toml`); do not use npm/pnpm/yarn.
- Dev server: `bun run dev` → serves on **http://localhost:8080** (port is fixed by
  `@lovable.dev/vite-tanstack-config`; not the Vite default 5173).
- Other scripts live in `package.json`: `bun run lint`, `bun run build`, `bun run format`.
- `bunfig.toml` sets `minimumReleaseAge = 86400` (a 24h supply-chain guard). Fresh installs of a
  just-published dependency can be skipped by this guard — this is expected, not a broken install.

### Environment variables (important gotchas)
- Client/anon config is committed in `.env` (`VITE_SUPABASE_*` / `SUPABASE_URL` +
  `sb_publishable_...` key) and `.env.development` (`VITE_PAYMENTS_CLIENT_TOKEN`). Client-side
  features that use the anon key (public marketing pages, the LIVE blog, auth sign-in) work
  out of the box against the hosted Supabase project.
- **Lovable Cloud owns the server-side API keys.** Secrets such as `SUPABASE_SERVICE_ROLE_KEY`,
  `LOVABLE_API_KEY`, `STRIPE_SANDBOX_API_KEY`, `APP_USER_CONNECTION_KEY_SECRET`, and `CRON_SECRET`
  live in Lovable Cloud and **are not available to Cursor Cloud Agents** — do not ask the user
  for them and do not treat their absence as a setup failure. Without those keys, anything that
  touches `src/integrations/supabase/client.server.ts` (the `supabaseAdmin` service-role client)
  fails locally (e.g. `POST /api/public/access-request` returns HTTP 500 with
  `Missing Supabase environment variable(s): SUPABASE_SERVICE_ROLE_KEY`). Treat secret-dependent
  server routes/functions as out of scope for Cloud Agent verification; exercise public /
  anon-key client paths instead.

### Auth / reaching the authenticated portal (gotcha)
- The portal and many routes (`/portal`, `/dashboard`, `/fee-calculator`, `/admin`, `/forms`, …)
  are guarded by `PortalShell` (`protectedPortalPrefixes` in `src/components/portal-shell.tsx`) and
  redirect anonymous visitors to `/login`.
- There is **no self-serve signup UI** — access is invite/admin-based (`/login` is sign-in only).
- The hosted Supabase project **requires email confirmation**, so a brand-new account created via
  the anon `signUp` endpoint cannot sign in until its email is confirmed. Authenticated portal
  flows are similarly out of scope for Cloud Agents unless a pre-confirmed test login is already
  present in the environment — do not request Lovable-managed credentials from the user.

### Lint note
`bun run lint` runs ESLint successfully but currently reports a large number of pre-existing
`prettier/prettier` formatting errors on `main`. That is the repo's current state, not an
environment problem; do not mass-reformat unrelated files to "fix" lint.

### Supabase migrations & edge functions
- Schema changes belong in `supabase/migrations/*.sql` (and related app/types code) in git.
- **Do not try to apply migrations to the live Lovable Cloud / Supabase database from Cloud Agents.**
  Push the SQL + app changes to GitHub via a PR; the human migrates/applies them on the Lovable
  side. Same for `supabase/functions/*` — ship the files in git; deployment is out of band.
- **When a task includes any new/changed files under `supabase/migrations/` (or edge functions
  that need deploying), say so clearly in the final message** — list the migration file names and
  tell the human the work is ready for them to migrate/apply on Supabase/Lovable. Do not assume
  they noticed the SQL in the PR.
- `supabase/functions/*` are Deno edge functions; they are not part of the local `bun run dev`
  app runtime.

### Company profile (`/portal/company`)
- Live data lives in `public.gc_company_profiles` (one row per tenant) + private Storage bucket
  `company-compliance-docs`. Client API: `src/lib/gc-company.ts`; uploads via
  `src/lib/company-docs.functions.ts` (signed URL pattern, same as ID verification).
- Saving a profile auto-validates qualifiers through existing `verifyDbprLicense()` in
  `src/lib/dbpr-api.ts` (same `/api/verify-license` path as Compliance) — do not add a second
  DBPR checker.
- Requires migration `supabase/migrations/20260804140000_gc_company_profiles.sql` applied on
  Lovable/Supabase before save/upload works against the hosted DB.
### Legal Document Library (`/legal`)
- Live data: `public.legal_documents` + `public.legal_document_versions` with private Storage
  bucket `legal-documents`. Client API: `src/lib/legal-docs.ts`; signed upload/download via
  `src/lib/legal-docs.functions.ts`. Admin-only (RLS `is_admin()` + `AdminOnly` UI gate).
- Versioning mirrors HOA templates (parent `current_version` pointer + child version rows),
  but each version has a real `file_path` — not a JSONB snapshot.
- Requires migration `supabase/migrations/20260804150000_legal_documents.sql` applied on
  Lovable/Supabase before upload/download works against the hosted DB.
