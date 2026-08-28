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
- `/join` is **self-serve signup**: `selfServeSignupFn` creates the tenant + an *unconfirmed*
  auth user, the page asks Supabase to send the confirmation email, and the link returns to
  `/auth/callback?entry=selfserve` → PAA. `/login` stays sign-in only, and admin invites are
  unchanged. Because it is public, it is rate-limited per IP and per email through
  `public.signup_attempts` (`src/lib/signup-rate-limit.server.ts`) — do not remove that, and do
  not go back to `email_confirm: true`. A verified address is enforced app-side too, in
  `evaluatePortalAccessFn` and on the `/login` password path, so it holds regardless of the
  project's email-confirmation setting. Real signups need SMTP configured in Supabase Auth;
  the built-in mailer is throttled to a couple of messages an hour.
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

### Insurance Requests (`/portal/request-coi`)
- Live data: `public.insurance_requests` (types `coi_request` | `sub_update`). Subs come from
  `listSubs()` / `subcontractors` — never `subcontractor-library.ts` on this page.
- Optional COI PDF uploads reuse the existing private `coi-documents` bucket under
  `insurance-requests/{tenant_id}/{request_id}/…` (`src/lib/insurance-requests.functions.ts`).
- Submit inserts a row then creates a `notifications` row (admins see all via RLS).
- Requires migration `supabase/migrations/20260804160000_insurance_requests.sql`.

### Building Dept Logins (`/building-dept-logins`)
- Credentials live in `gc_portal_logins` (AES-256-GCM via `APP_USER_CONNECTION_KEY_SECRET`).
  List returns metadata only; plaintext only via `revealOwnPortalLogin` / admin `revealPortalLogin`.
- Sharing is internal-only: `listPortalLoginFlags({ scope: "all" })` and admin `revealPortalLogin`
  cover logins owned by `@cleared.com`/`@floridianinc.com` accounts (Cleard files its own permits
  here). A customer GC's credentials are never listed or decrypted for staff — do not widen this.
  The internal check reads the **auth** identity (`auth.admin.getUserById`), not `profiles.email`,
  which the row owner can edit. Shared helpers: `src/lib/portal-logins-access.server.ts`.
- Documents: `portal_login_documents` + private bucket `portal-login-docs`. Expired status uses
  real `expiration_date` vs today (`isDocExpired`). Uploads are **optional** — a login saves
  without paperwork; an attached document still needs an expiration date.
- Vault rows offer a password-manager hand-off (`QuickSignIn`): copy username + open the stored
  `portal_url`, then copy the password. There is deliberately no autofill — a page cannot type
  into another origin's login form; anything more needs an extension or the Playwright worker.
- Bulk import: `/building-dept-logins/import` (staff only) pastes the sheet as CSV/TSV, previews,
  then encrypts with the same `encryptSecret()` and upserts on `user_id,municipality_slug`. It
  exists because the CLI needs `APP_USER_CONNECTION_KEY_SECRET`, which is write-only in Lovable.
  Row classification is shared with the CLI in `src/lib/portal-logins-import.ts` — do not fork it,
  and never return a plaintext credential to the browser. Owners are restricted to internal
  accounts so an import cannot push a customer's credentials into the staff-shared view.
- Submit route writes through `savePortalLogin` + document uploads — not a fake toast.
- Requires migration `supabase/migrations/20260804170000_portal_login_documents.sql`.
- Contacts sub-tab is still localStorage (`municipal-contacts.ts`) — separate from credentials.

### Staff Workload (`/admin/workload`)
- Roster is live: `user_roles` (role=`admin`) ⨝ `profiles` via `listStaffAdmins()` in
  `src/lib/staff-ops.ts`. Excludes `@test.invalid`; when the same email local-part appears on
  both `@cleared.com` and `@floridianinc.com`, keep `@cleared.com` only.
- Assignments/escalations come from `staff_assignments` (not localStorage) and are grouped by
  `assignee_email` matching the live admin email.
- `profiles.job_title` is optional — Role column shows `—` when unset (do not invent titles).
- Gate with `session.isAdmin`, not `isInternalUser()` (`@floridianinc.com` only) — otherwise
  real `@cleared.com` admins see a blank page while admin nav still links here.
- Requires migration `supabase/migrations/20260811120000_profiles_job_title.sql` for the column;
  listing admins falls back if `job_title` is not yet present.
