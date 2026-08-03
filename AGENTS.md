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
- **Server routes/functions require secrets that are NOT in the repo.** Anything that touches
  `src/integrations/supabase/client.server.ts` (the `supabaseAdmin` service-role client) needs
  `SUPABASE_SERVICE_ROLE_KEY` (and `SUPABASE_URL`). Without it, server endpoints like
  `POST /api/public/access-request` (the `/join` form) fail with HTTP 500 and
  `Missing Supabase environment variable(s): SUPABASE_SERVICE_ROLE_KEY`. Other server features
  (compliance AI, Stripe, HubSpot, email outbox, portal-login encryption) also need their own
  secrets (e.g. `LOVABLE_API_KEY`, `STRIPE_SANDBOX_API_KEY`, `APP_USER_CONNECTION_KEY_SECRET`,
  `CRON_SECRET`). Add these under the Secrets panel to exercise those paths.

### Auth / reaching the authenticated portal (gotcha)
- The portal and many routes (`/portal`, `/dashboard`, `/fee-calculator`, `/admin`, `/forms`, …)
  are guarded by `PortalShell` (`protectedPortalPrefixes` in `src/components/portal-shell.tsx`) and
  redirect anonymous visitors to `/login`.
- There is **no self-serve signup UI** — access is invite/admin-based (`/login` is sign-in only).
- The hosted Supabase project **requires email confirmation**, so a brand-new account created via
  the anon `signUp` endpoint cannot sign in until its email is confirmed. To test the authenticated
  app you need a pre-confirmed test login (or the service-role key to create+confirm a user).

### Lint note
`bun run lint` runs ESLint successfully but currently reports a large number of pre-existing
`prettier/prettier` formatting errors on `main`. That is the repo's current state, not an
environment problem; do not mass-reformat unrelated files to "fix" lint.

### Supabase edge functions
`supabase/functions/*` are Deno edge functions deployed to Supabase separately; they are not part
of the local `bun run dev` app runtime.
