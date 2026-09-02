# Comparison page, Integrations page, CRM capture, and admin CRMs tab

## 1. Comparison page (move off the homepage)

- New route `/comparison` (marketing shell) that hosts the existing "The Cleard Difference" table component — Permit Expediter vs Private Provider vs Cleard, 10 rows, footnote intact.
- Remove `<ClearedDifferenceTable />` from the homepage (`src/routes/index.tsx`) so the homepage gets shorter.
- Add "Comparison" to the footer link column in `src/components/marketing-shell.tsx` (next to Pricing / How it works). Not added to the top nav.
- Page gets its own title/description/OG meta.

## 2. Part A — Integrations page

- New route `/integrations`, linked in the main nav next to Pricing and 411 (header + mobile menu + footer).
- Headline "Cleard plugs into the tools you already run." with the given subhead.
- Card grid for JobTread, ServiceTitan, Procore, Netic.ai, Avoca.ai, Podium.com, Craftflow. Each card: placeholder monogram/icon tile (no fabricated brand logos), platform name, a "Coming Soon" badge on every card, and one line of contractor-facing benefit copy.
- Below the grid: "Don't see your platform listed?" form — name, email, platform — writing to a new `integration_requests` table. Success/error states inline, no fake toast.
- Nordic Luxury marketing palette (oat/slate/plum/copper), zero-radius, no emojis.

## 3. Shared data field (Parts B, C, D)

One migration adds to `public.profiles`:
- `current_crm text`
- `current_crm_other text`
- `crm_source text` — `'signup_form'` or `'google'`
- `crm_captured_at timestamptz`

Company name and signup date come from the existing tenant/profile records, so nothing is duplicated. A shared `src/lib/crm-options.ts` holds the single canonical option list used by the sign-up select, the Google modal, and the admin filter.

New table `public.integration_requests` (name, email, platform, created_at) with GRANTs, RLS: anon+authenticated INSERT, admin-only SELECT.

## 4. Part B — sign-up form field

- In `/join`, a required select "Which project management or CRM software do you currently use?" placed after Contractor License Number and before Email, with the exact option order given. Choosing "Other (please specify)" reveals a required free-text input directly below.
- The value is passed into the existing `selfServeSignupFn` server function, which writes it onto the new user's profile row at creation time (same handler that already creates tenant + user — no new account-creation path, no change to the rate limit, verification, or PAA gates).

## 5. Part C — Google sign-in modal

- In `/auth/callback`, after the Supabase session hydrates and portal access is approved, check whether the signed-in profile already has `current_crm`. If not, render a non-dismissible modal ("One quick question", same dropdown + Other behaviour, single "Continue" button) before any redirect. Continue is disabled until a selection exists (and Other text is filled).
- Submitting writes the answer with `crm_source = 'google'`, then the callback proceeds to its normal destination (onboarding/PAA or dashboard) exactly as today.
- Users who already answered are never asked again; sign-in for existing accounts is unaffected apart from this one-time question.

## 6. Part D — admin CRMs tab

- New route `/admin/crms`, added to the Admin tab group in `src/lib/portal-tabs.ts` so it sits alongside Invite Pipeline, Feature Access Requests, etc. Uses the same `useSession().isAdmin` gate + `AdminOnly` UI wrapper as the other admin pages.
- Summary row: live counts per CRM ("ServiceTitan: 42 · JobTread: 18 · …").
- Table: User name / Company / CRM selected / Other value / Signup date / Signed up via. Sortable on every column, plus a CRM dropdown filter above it.
- Data is read through an admin-only server function (RLS-backed), not a client-side broad read.

## Technical notes

- One migration file adds the profile columns and the `integration_requests` table with GRANTs + RLS policies; the CRM columns are nullable so existing accounts keep working (they simply show as unanswered).
- The Google modal reads/writes through server functions so no client code needs elevated access.
- No change to admin access control itself — the new tab reuses the existing admin gate.
