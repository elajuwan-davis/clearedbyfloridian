# Cleard — Platform Reference

**Cleard** is the private-provider permitting platform for South Florida general contractors,
built and operated by Flōridian. It runs plan review and inspections under **FL Statute 553.791**
(private provider), promising **2-day plan review** and **same-day inspections**.

This document is the complete working reference: every feature, how it is *meant* to work,
and how it is *currently wired* — real backend, partially wired, or mock/demo.

---

## 0. Legend — implementation status

| Tag | Meaning |
| --- | --- |
| **LIVE** | Fully wired to the backend database/storage. Data persists, RLS-scoped, multi-user. |
| **LIVE (manual)** | Data persists in the database, but a step of the real-world workflow is done by a human (no external integration). |
| **PARTIAL** | Backend exists but an outbound integration (email provider, cron, live payments) is not switched on. |
| **LOCAL** | Data is stored in the browser's `localStorage` only. Not shared between users or devices. Demo-grade. |
| **MOCK** | Hard-coded seed data in the source file. Nothing persists. |

---

## 1. Technology & infrastructure

| Layer | What it is |
| --- | --- |
| Framework | TanStack Start v1 (React 19, file-based routing, SSR + server functions) |
| Build | Vite 7, deployed to an edge worker runtime |
| Styling | Tailwind CSS v4 via `src/styles.css` (design tokens, no config file) |
| Backend | **Lovable Cloud** — managed Postgres, Auth, Storage, and background endpoints |
| Auth | Email + password with role/tenant assignment at signup (`handle_new_user` trigger) |
| Files | Private buckets include `permit-files`, `company-compliance-docs`, `legal-documents`, `coi-documents`, `portal-login-docs` |
| AI | Lovable AI Gateway (`LOVABLE_API_KEY`) — used for document OCR/extraction |
| Payments | Stripe, currently in **sandbox** mode (`STRIPE_SANDBOX_API_KEY`) |

**Server code boundaries**

- `src/lib/*.functions.ts` — typed RPC (`createServerFn`) callable from the client.
- `src/lib/*.server.ts` — server-only helpers, never bundled to the browser.
- `src/routes/api/public/*` — raw HTTP endpoints for webhooks and cron jobs (auth bypassed by
  the platform, so each handler verifies the caller itself).

---

## 2. Users, roles, and access levels

### 2.1 The role model

Roles live in a dedicated `user_roles` table (never on a profile row — that would allow
privilege escalation). The enum `app_role` has four values:

| Role | Who | Access |
| --- | --- | --- |
| `admin` | Cleard/Flōridian staff | Everything, across **all** tenants. Can impersonate any tenant. Only role that can write blog posts, approve access requests, and see internal private-provider documents. |
| `gc_owner` | The GC who signed up / owns the company account | Full read+write inside **their own tenant only**. Can invite team members, manage subs, create permits, see financials. |
| `gc_member` | Employees of that GC | Same tenant-scoped access as the owner. (No separate permission split today — owner vs member is a label, not a gate.) |
| `subcontractor` | A trade partner | Sees only the projects they are **confirmed on**, plus their own compliance documents. Slim 2-item navigation. |

Staff emails are hard-coded in the `handle_new_user` database trigger and auto-granted `admin`:
`elajuwan@`, `eman@`, `jose@`, `paul@floridianinc.com`.

### 2.2 Tenants (data isolation)

`tenants` is the company record. `tenant_members` maps a user → one tenant. Almost every
business table carries a `tenant_id` column, and Row Level Security compares it to
`public.current_tenant_id()` (a `SECURITY DEFINER` helper that reads the caller's membership).

Practical effect: **GC A can never see GC B's permits, subs, invoices, HOA submittals, or
portal logins.** Admins bypass this via `public.is_admin()` clauses in every policy.

### 2.3 How a user ends up in a tenant

Self-serve and Google provision create the tenant themselves. Invite / domain / fallback still
run through `handle_new_user()` at auth-user creation:

1. **Self-serve signup** (`/join` and `/signup`) — `selfServeSignupFn` inserts a tenant with
   `plan: 'trial'` and an *unconfirmed* `gc_owner`. The page then asks Supabase to send the
   confirmation email; the link returns to `/auth/callback?entry=selfserve` → PAA. Public, so
   it is rate-limited per IP (5/hour) and per email (3/day) via `public.signup_attempts`
   (`src/lib/signup-rate-limit.server.ts`). Do not set `email_confirm: true` on `createUser` —
   verification is enforced app-side in `evaluatePortalAccessFn` and on the `/login` password
   path. `/login` is sign-in only.
2. **Invite token** — `tenant_invites.token` via `/join/$token`, consumed by
   `consume_invite_token()`. `approveAccessRequestFn` writes `plan: 'full'` on the new tenant.
3. **Domain auto-join** — if the email domain matches `tenants.allowed_domain`.
4. **Google (or any OIDC) sign-in** — `evaluatePortalAccessFn` (`src/lib/google-access.functions.ts`):
   unverified email is refused; `@cleared.com` / `@floridianinc.com` always allowed; existing
   role or `tenant_members` row allowed; an approved `access_requests` row is attached as a
   seat; otherwise the function **self-provisions a trial tenant** (same contract as `/join`).
   If that insert fails it files a pending `access_requests` row and denies entry.
5. **Fallback** — the legacy/default tenant `0000…0001`.

Subcontractors skip all of this: they get the `subcontractor` role and a `sub_accounts` row.

The `POST /api/public/access-request` endpoint and `/admin/invites` → Access Requests tab still
exist for staff triage, but **`/join` no longer writes `access_requests`**.

### 2.4 Plan gating (`tenants.plan`)

`trial` vs `full`. Column default is **`full`** (migration
`20260830120000_tenant_plan_default_full.sql`) so an invited/managed tenant that does not
write the column never lands on the locked surface. The only writers that want `trial` set it
explicitly (`selfServeSignupFn`, Google provision).

| Tier | Who | What they can open |
| --- | --- | --- |
| `full` | Invited/managed accounts and staff | No locks. |
| `trial` | Self-serve `/join` or `/signup` | Own permits end to end, portal logins, messages to Cleard, account/PAA. Everything else is locked. |

Locked features: `sub_invites`, `license_verification`, `coi_requests`, `lien_rights`
(`src/lib/plan-access.ts`). Allowed path prefixes: `TRIAL_PATHS`. Client UI:
`usePlanAccess()` / `PlanGate` / `LockedFeatureNotice` / `LockedFeatureButton`
(`src/components/feature-lock.tsx`). "Request access" inserts a real `feature_requests` row
via `createRequest()` — not a mailto.

**Fail-open:** a missing column, RLS hiccup, or offline read resolves to unlocked. Admins are
never gated. Staff switch a tenant at `/admin/invites` → **Plans** (`setTenantPlanFn`).

### 2.5 Two staff scoping systems (do not confuse them)

Staff have two independent `localStorage` filters. Both are **UI-level, not a security
boundary** — admin RLS already permits full access.

| | View mode | Impersonation |
| --- | --- | --- |
| Where | Sidebar toggle (admins only): **Cleard** / **Flōridian** | Top-bar `AdminTenantSwitcher` ("View as client") |
| Key | `cleard_view_mode` | `cleard_impersonate_tenant` |
| Code | `src/lib/view-mode-context.tsx` | `src/lib/use-session.ts` |
| What it drives | Nav set + `listPermits` / dashboards / documents / financials / inspections | `session.effectiveTenantId` — plan read, messages, contacts |
| Unset behavior | Admin mode with no client picked → sentinel `"__none__"` → **empty permit lists** | "All Clients (admin view)" |

**View mode details**

- `client` hard-scopes `useActiveTenantId()` to the Flōridian tenant
  `3e137bde-7c3b-46b6-bcf9-57b703fd5592` (`FLORIDIAN_TENANT_ID`) and swaps the rail to
  `CLIENT_NAV_SECTIONS` (Permits, Inspections, Documents, Messages, Settings).
- `admin` uses `ADMIN_NAV_SECTIONS`. `useActiveTenantId()` is the client selected on the
  admin dashboard (`setSelectedTenantId`). "All clients" on that picker writes `null` →
  `"__none__"`. `listPermits("__none__")` returns `[]` on purpose so a staff session does
  not dump every tenant's jobs into My Permits until a client is chosen.
- Surfaces that pass `useActiveTenantId()` into `listPermits`: admin dashboard, builder
  dashboard, My Permits, `/portal/financials`, `/portal/documents`, `/portal/inspections`.

**Pitfall:** the top-bar switcher does **not** fill My Permits. Pick the client on the
dashboard (view-mode `selectedTenantId`) or flip the rail to Flōridian view.

### 2.6 Session plumbing

`src/lib/use-session.ts` exposes `{ userId, email, role, tenantId, tenantName, isAdmin,
impersonatingTenantId, effectiveTenantId }`. `PortalShell` guards every protected path
prefix (`/portal`, `/dashboard`, `/forms`, `/profile`, `/admin`, …), showing
"Verifying session…" then redirecting anonymous visitors to `/login?next=…`.

**Permits-only guest seats** (`src/lib/permits-only.ts`): emails matching
`*.guest@cleared.com` / `guest@cleared.com` (and the `@floridianinc.com` equivalents) are
kept off the admin role by `handle_new_user` and the UI restricts them to `/portal/permits*`.

Legacy note: login also writes `cleared_demo_session` / `cleared_demo_user` keys to
`localStorage`. Several older components still read those to decide whether a user is
"internal" (`@floridianinc.com`) — e.g. the Victoria floating widget. This is cosmetic gating
only and should eventually be replaced by `useSession()`.

---

## 3. Site map

### 3.1 Public marketing (no auth) — `PublicShell` / `MarketingShell`

| Route | Purpose | Status |
| --- | --- | --- |
| `/` | Homepage — the private-provider pitch, statutory timelines, CTA | Static |
| `/join` | Contractor self-serve signup (trial tenant + unconfirmed user) | **LIVE** (`selfServeSignupFn`) |
| `/signup` | Alternate self-serve form (same server function; linked from `/login`) | **LIVE** |
| `/join/$token` | Invite acceptance — joins an existing (full-plan) tenant | **LIVE** |
| `/cleardapproval` | CleardApproval marketing page (HOA architectural review) | Static |
| `/municipalities` | CleardGov marketing page (contract plan review for building depts) | Static |
| `/trades/$slug` | Trade landing pages (`src/lib/trades.ts`) | Static |
| `/products` | Product overview | Static |
| `/versus`, `/versus/$slug` | Competitor comparison pages | Static (`src/lib/competitors.ts`) |
| `/services`, `/process`, `/about`, `/contact` | Standard marketing pages | Static / **MOCK** copy |
| `/blog`, `/blog/$slug` | Public blog | **LIVE** — reads `blog_posts` where `status='published'` |
| `/fee-calculator` | Private-provider savings calculator | **LIVE** (pure client math, FS 553.791 + HB 803 logic) |
| `/pricing` | Pricing | Static |
| `/login`, `/onboarding` | Sign-in only; PAA onboarding | **LIVE** |

Marketing nav (`src/components/marketing-shell.tsx`) is **Solutions** (Cleard / CleardApproval /
CleardGov) plus **Trades** (`/trades/$slug`). The primary CTA is `/join`.

### 3.2 Tokenized public pages (no login, secret URL)

| Route | Who uses it | Status |
| --- | --- | --- |
| `/homeowner/$token` | Homeowner tracking their permit | **LIVE**, hardened. Anonymous `SELECT` on `permits` is revoked; the page calls the `get_homeowner_permit(_token)` security-definer function which returns only safe columns on an **exact token match**. |
| `/sub-intake/$token` | A sub filling in license/COI/W-9 | **LIVE** — updates the pre-created "pending invite" row, uploads to `permit-files`, triggers compliance AI scans |
| `/sub-portal/$token` | A sub viewing project docs read-only | **LIVE** |
| `/permit-card/$id` | Shareable digital permit card | **LIVE** |
| `/lpoa-signing` | Limited power-of-attorney signing | **LOCAL** |

### 3.3 Portal (authenticated) — `PortalShell`

The sidebar is a flat icon rail (`src/lib/portal-nav.ts`). Former sub-items live as tabs on
the section page (`src/lib/portal-tabs.ts`). Which rail you see depends on role + plan +
view mode:

| Who | Rail |
| --- | --- |
| Staff, Cleard view | `ADMIN_NAV_SECTIONS` + Admin (Dashboard, Permits, Portal Logins, Inspections, Documents, Finance, Messages) |
| Staff, Flōridian view | `CLIENT_NAV_SECTIONS` (Permits, Inspections, Documents, Messages, Settings) |
| Full-plan GC | `navSections` (same collapsed set as staff, without Admin) |
| Trial GC | `trialNavSections` (Dashboard, Permits, Portal Logins, Messages) + Account Info |
| Subcontractor | `subNavSections` (Bookmarks, My Projects, Compliance) |

A trial account that types a paid URL still hits `PlanGate` / `LockedFeatureNotice` — the nav
hiding it is not the only gate.

---

## 4. Feature-by-feature reference

### 4.1 Permits — the core object

**Table:** `permits` (~60 columns). **Status:** **LIVE**.

Holds project identity (name, owner, job address, city/county/municipality, PCN), contractor
and qualifier details, permit type/number, construction value and total project value in cents,
dates (submitted / issued / expiration), plus three JSONB blobs: `subs`, `documents`,
`extra_docs`, and the raw `intake_payload`.

**Status vocabulary is aviation-themed** platform-wide:

| Internal | Label | Badge |
| --- | --- | --- |
| `draft` / pre-submit | **Pre-Check** | gray |
| `submitted` | **Cleared for Takeoff** | blue |
| `in_review` | **En Route** | yellow |
| `corrections_required` | **Delayed** | red |
| `approved` | Approved | green |
| `permit_issued` | **Arrival** | obsidian + white |

#### New Permit intake — `/portal/permits/new`

A guided, intelligence-assisted form. Everything below is **LIVE**:

1. **Address autocomplete** (`address-autocomplete.tsx`) — Google Places-backed; on selection it
   auto-fills city, county, and matches the municipality with a city→county fallback.
2. **Dispatch / Pre-Flight intelligence** (`dispatch.ts`, `dispatch-card.tsx`) — resolves
   jurisdiction, flood zone, wind speed, and parcel ID from the chosen address.
3. **Municipality typeahead** — single source of truth in `src/lib/municipalities.ts`
   (130+ Florida cities with confirmed building-department portal URLs).
4. **Architect/Engineer autocomplete** — reads and writes the `design_professionals` table.
5. **Multi-select scope of work** + dynamic subcontractor rows pulled from your sub library.
6. **Municipality Readiness Panel** — checks GL, WC, BTR, and license validity with
   red/yellow/green expiry indicators, and offers a **"Save to Submittal"** toggle per document.
   Valid docs are pre-checked. Snapshots attach to the submission package.
7. **Portal login check** — if you have no saved credentials for that city, it prompts "Add Login".
8. **Total Project Value** with a live service-fee estimate.
9. **Victoria intelligence sidebar** — persistent panel showing municipality stats, scope flags,
   and fee estimates (see §4.9).
10. **Document uploads** — 6 fields; Stamped Construction Plans is required but **deferrable**
    ("Defer — I'll upload this later" stores `status: pending` so staff can chase it).

Permits remain **editable after submission**.

#### My Permits — `/portal/permits` (also `/my-permits`)

Grouped accordion pipeline by status with a **county filter** (Palm Beach, Martin, St. Lucie,
Indian River, Broward, Miami-Dade), completeness progress bars (19 required fields + 6 standard
documents via `permitCompleteness`), and missing-document flags. **LIVE**.

#### Permit detail — `/portal/permits/$id`

A hub that stacks every sub-feature below onto one permit.

### 4.2 Submittal Package — **LIVE**
`submittal-package.ts` + `submittal-package-section.tsx`. Freezes the compliance documents you
toggled at intake into an immutable snapshot attached to the permit, so what was submitted is
always reproducible.

### 4.3 Bundled Permit Submission — **LIVE**
`bundle.ts`, `submissions-api.ts`, table `submissions`.
- **Bundle Manager** (`/portal/permits/$id/bundle`) — master GC fee input, per-trade cards with
  signature tracking, and partial-submit support (`bundle-partial-submit-dialog.tsx`).
- **Ops Queue** (`/portal/submissions`) — staff review each package and download a merged ZIP.

### 4.4 Subcontractors & compliance intelligence — **LIVE**

**Table:** `subcontractors`. Hub at `/forms/subcontractors` (also `/portal/subcontractors`).

- **Intake link generator** — creates a UUID `completion_token`, writes a "pending invite" row,
  and produces a public `/sub-intake/$token` URL. The intake **updates** that row rather than
  creating a duplicate.
- **Compliance OCR layer** (`compliance.functions.ts` → `compliance-core.server.ts`) fires on
  upload and uses the AI gateway to:
  - **COI scan** — extracts carrier, limits, and expiry; flags gaps against `gc_coi_minimums`.
  - **License verification** — DBPR check writing `dbpr_status`, `dbpr_holder_name`, `dbpr_expiration`.
  - **W-9 scan** — extracts entity/TIN details.
  Each writes a `*_status`, `*_extracted`, `*_flags`, and `*_verified_at` column.
- **Security:** these scans are expensive, so the server functions run
  `.middleware([requireSupabaseAuth])` and call `assertSubAccess()`
  (`compliance-access.server.ts`) to prove the caller can see that sub through RLS before
  spending an AI call. The public intake path bypasses the wrapper and instead validates the
  one-time token.
- **File visibility** — storage policy allows team members to read `subs/<token>/…` as well as
  `<permit-id>/…` and `<sub-id>/…` paths.

### 4.5 Financials

| Feature | File / table | Status |
| --- | --- | --- |
| Service fee invoices | `service_fee_invoices`, `service-fee-invoice-panel.tsx` | **LIVE (sandbox Stripe)** |
| Subscriptions | `subscriptions` — Solo $149 / Pro $299 / Firm $599 | **LIVE (sandbox)** |
| Permit fees log | `portal.permit-fees.tsx`, `log-permit-fee-dialog.tsx` | **LIVE (manual entry)** |
| Manual project fees | `manual-fees.ts` | **LOCAL** |
| Financials overview / "Before Cleard" | `portal.financials.tsx`, `before-cleared-panel.tsx` | Computed from live permits |
| Savings calculator | `savings-calculator.tsx` | **LIVE** (client math) |
| `/invoices` (legacy page) | queries a `fees` table that does not exist → falls back to seed rows | **MOCK** |

**Fee model:** flat service fee of **1% of total project value under $1M, 0.5% at $1M+**,
invoiced when a permit reaches *Cleared for Takeoff*, with Stripe processing fees passed through.
All money is stored in **cents**. (Historical brand rules also reference a 1.5% permitting fee
plus an $8,856 flat private-provider/admin fee — the Stripe rails implement the 1%/0.5% model.)

### 4.6 Inspections — **LIVE**
`permit_inspections` + `inspections-api.ts`, `inspections-panel.tsx`. Request type, requested
and scheduled dates, inspector, result, notes. The standalone `/portal/inspections` route still
renders from `mock-data.ts` — **MOCK**; the per-permit panel is the real one.

### 4.7 Resubmittal workflow — **LIVE**
`permit_resubmittals` — versioned correction cycles with correction notes and document paths,
supporting the statutory 48-hour correction window.

### 4.8 Certificate of Occupancy checklist — **LIVE**
`co_checklist_items` — an 11-item ordered checklist per permit with completion timestamps and
attribution (`co-checklist-panel.tsx`).

### 4.9 Victoria — the intelligence layer

Four distinct pieces, with different maturity:

1. **Voice-fill** — **LIVE (browser API only)**. Fixed field script (ask → listen → write →
   advance), not free-form parsing. Shared helpers in `src/lib/victoria-speech.ts`. `/join`
   uses `victoria-voice-signup.tsx`; New Permit uses the floating mic in
   `victoria-permit-assistant.tsx` (`data-tour="victoria-permit"`). Renders nothing where
   `SpeechRecognition` is missing (Safari/Firefox); typing always still works. There is no
   AI backend on this path.
2. **Submittal intelligence** — **LIVE**. Tables `submittal_intelligence` and
   `submittal_corrections`, surfaced by the functions `intel_municipality_stats(slug)`
   (sample size, avg days to first response, avg days to resolution, avg fee, approval rate)
   and `intel_common_corrections(slug, trade, limit)`. Rendered by
   `victoria-intelligence-panel.tsx` on intake and on the Building Departments page.
3. **Proactive alerts** — **PARTIAL**. Table `victoria_alerts` with a scanning worker at
   `/api/public/victoria-scan` that flags stale permits. The table, UI (`/portal/alerts`,
   `alerts-list.tsx`), and endpoint all work — but nothing calls the endpoint on a schedule yet
   (needs `pg_cron` or an external scheduler). It is gated by the private `CRON_SECRET` header.
4. **Ask Victoria chat** (`/ask-victoria`) — **LOCAL**. Threads and the 50-questions/day quota
   live in `localStorage`. The floating `VictoriaWidget` is shown only to internal
   `@floridianinc.com` users.

**First-login tour** (`src/components/first-login-tour.tsx`, driver.js): dashboard spots
New Permit + Documents, then hands off via `sessionStorage` to `/portal/permits/new` and
ends on the Victoria mic. Do not point it at "Generate Intake Link" — that control is plan-
gated and would teach a trial account to click a lock. Targets are `data-tour` attributes.

### 4.10 Notifications — **LIVE**
`notifications` (in-app feed, `NotificationBell`) and `notification_prefs` (per-channel email/SMS
toggles for permit issued, inspection passed/failed, action required, submission received).
In-app delivery works; outbound email depends on the outbox (§4.16), and SMS has no provider.

### 4.11 Expiration & renewal alerts — **LIVE**
`use-expiration-alerts.ts` + `expiration-alerts.ts` compute red-dot badges in the navigation:
COI expired → *Request COI*; COI expiring < 60 days → *Sub Insurance*; license expiring →
*My Permits*. `permit-expiration.ts` drives auto-renewal reminders and the
`extension_requested_at` flow.

### 4.12 HOA submittals — **LIVE / PARTIAL**

A full community repository:

- `hoa_templates` + `hoa_template_versions` — per-community boilerplate: contacts, submission
  method/portal, required documents, deposit amount and type, ARC meeting notes, versioned
  snapshots with change summaries and usage counts.
- `hoa_submittals` — two intake paths: **upload an existing HOA form** (OCR extraction into
  `extracted_fields` / `missing_fields`) or **build from a template**. Tracks project-type
  document checklists, deposit status, homeowner notification, and `sent_to_hoa_at`.
- Auto-generated **removal agreements** for fence scopes (`removal_agreement_path`).
- `hoa_submittal_events` — immutable audit timeline (insert-only, tenant-scoped, authenticated
  users only; no anonymous inserts).
- `hoa_submittal_replies` — reply threads captured by the `/api/public/hoa-reply` webhook.
- Outbound email to the HOA is queued in the outbox → **PARTIAL** until a mail provider is set.

### 4.13 Lien releases & NTO/NOC/NTBO

| Feature | Status |
| --- | --- |
| `lien_releases` — per-sub status, requested/signed/notarized/filed timestamps, reminders, SignWell ID | **LIVE (manual)** |
| Lien waiver generation (`generate-lien-waiver-dialog.tsx`) | **LIVE** (PDF) |
| **NTO** `nto_filings` + `nto-pdf.ts` | PDF generation **LIVE**; delivery tracking manual |
| **NOC** auto-generation (`noc-auto.ts`, Palm Beach County standards) | **LIVE** (internal only) |
| **NTBO** Notice to Building Official (`ntbo-auto.ts`) | **LIVE** (internal only) |
| NOC awareness ribbon (`noc-awareness-ribbon.tsx`) | **LIVE** |
| Notary requests / queue (`notary-requests.ts`, `/portal/notary-queue`) | **LOCAL** |
| SignWell send-for-signature | **LIVE (manual)** — request tracked, signature collected out-of-band |

Private-provider documents (NOC, NTBO, affidavits) are **hidden from GCs** — internal staff only.

### 4.14 Building departments & portal logins — **LIVE**
`/portal/building-dept` — a simplified grid: **bold city name + one button**, linking to the
confirmed portal URL, with Victoria's common corrections for that jurisdiction below.
`gc_portal_logins` stores city credentials **encrypted with AES-256-GCM**
(`portal-logins-crypto.server.ts`, key from `APP_USER_CONNECTION_KEY_SECRET`); ciphertext never
leaves the server unencrypted, and decryption happens inside a server function only.

### 4.15 Bid review — **LIVE**
`/portal/bid-review` compares 2–4 subcontractor bids side by side in a matrix with a
"Select Winner" action (`bid-comparison-dialog.tsx`).

### 4.16 Email outbox — **PARTIAL**
`email_outbox` queues every outbound message (kind, to/cc, subject, text+HTML body, attachments,
related submittal) with `attempts`, `next_attempt_at`, and exponential retry. The worker lives at
`/api/public/email-outbox/process`, gated by the `x-cron-secret` header. **It needs a mail
provider API key and a scheduler to actually send.** Until then messages queue and stay `pending`.

### 4.17 Project guides & building specs — **LIVE (content)**
`/portal/guides` — 40+ guides split across `portal-guides-*.ts` batches (single-family,
commercial, PSL-specific schedules), with equipment specs merged into trade-based accordions
under the title "Project Guides & Building Specs".

### 4.18 Blog / CMS — **LIVE**
`blog_posts`. Admin editors at `/admin/blog` and `/portal/blog`. **Write access is admin-only at
the database level**; read is restricted to `status = 'published'` unless you are an admin, so
drafts never leak.

### 4.19 Feature requests — **LIVE**
`feature_requests` + `feature_request_votes`. Type, title, affected areas, description, workflow
impact, priority, status, pinning, internal note vs public response, and shipped notifications.
Public board at `/portal/feature-requests`, triage at `/admin/feature-requests`.

### 4.20 Marketplace — Static
`/portal/marketplace` — editorial partner cards in obsidian ALL-CAPS: Insurance, Bookkeeping,
No-PG Business Cards, Gusto (payroll), Handoff AI (takeoff), JobTread (CRM). Outbound links only.

### 4.21 Weekly status reports — **PARTIAL**
`weekly-reports.functions.ts` compiles a per-tenant digest. Generation is **LIVE**; automatic
weekly delivery depends on the scheduler + mail provider.

### 4.22 HubSpot integration — **LIVE**
`/api/public/hubspot.deal-webhook` drafts a permit when a deal hits *Closed Won*. Signature
verification **fails closed** — if the signing secret is unset, the request is rejected.
`/admin/hubspot-simulate` lets staff replay a payload for testing.

### 4.23 Google Drive — **LIVE**
Per-user OAuth via the app-user connector; picker dialog (`google-drive-picker-dialog.tsx`) lets
you attach Drive files to a permit. Connection keys are AES-256-GCM encrypted in
`app_user_connections`.

### 4.24 Access requests — **LIVE** (legacy front door)
`access_requests` is no longer filled by `/join`. The table still backs staff triage
(`/admin/invites` → Access Requests, also `/admin/access-requests`) and the Google-sign-in
fallback in `evaluatePortalAccessFn`. `POST /api/public/access-request` remains: the insert
policy validates strictly (`status` must be `'new'`, `approved_tenant_id` must be null,
name/email regex + length). Approving creates a **full**-plan tenant + invite
(`approveAccessRequestFn`).

### 4.25 Messages — **LIVE**
`/messages` reads `message_threads` + `message_posts` (`src/lib/messages-api.ts`). GCs open a
thread; staff reply as Cleard Support (`help@cleardinc.com`). A trial plan can only address
Cleard (`info@cleardinc.com`) — the recipient picker is fixed, not chosen. Tenant on a new
thread follows impersonation (`getImpersonatedTenantId()`), not view-mode.

### 4.26 Company profile — **LIVE**
`/portal/company` — one `gc_company_profiles` row per tenant + private bucket
`company-compliance-docs`. Save auto-validates qualifiers through existing
`verifyDbprLicense()` (`/api/verify-license`). Client: `src/lib/gc-company.ts`.

### 4.27 Legal document library — **LIVE**
`/legal` — `legal_documents` + `legal_document_versions` + private bucket `legal-documents`.
Admin-only (RLS `is_admin()`). Versioning mirrors HOA templates but each version has a real
`file_path`. Notary queue remains **LOCAL** (`notary-requests.ts`).

### 4.28 Insurance requests — **LIVE**
`/portal/request-coi` — `insurance_requests` (`coi_request` | `sub_update`). Subs come from
`listSubs()` / `subcontractors`, never `subcontractor-library.ts`. Optional COI PDFs reuse
bucket `coi-documents`. Submit also writes a `notifications` row. **Plan-gated** for trial.

### 4.29 Staff workload — **LIVE**
`/admin/workload` — roster from `user_roles` (role=`admin`) ⨝ `profiles` via
`listStaffAdmins()`. Assignments from `staff_assignments`. Gate with `session.isAdmin`, not
`isInternalUser()`. Excludes `@test.invalid`; duplicate local-parts keep `@cleared.com`.

### 4.30 Other local-only stores

These modules persist to `localStorage` and are per-browser demo data:
`project-notes.ts`, `project-documents.ts`, `project-pcn.ts`, `property-appraiser.ts`,
`signature-requests.ts`, `payment-auth.ts`, `manual-fees.ts`, `notary-requests.ts`,
`lien-waivers.ts`, `gc-clients.ts`, `hubspot-projects.ts`, `contractors-store.ts`,
`subcontractor-library.ts`, `municipalities-store.ts`, `municipality-docs-store.ts`,
`inspections.ts` (the legacy one), `client-notifications.ts`.

---

## 5. Admin-only surfaces

| Route | Purpose |
| --- | --- |
| `/admin` | Staff landing |
| `/admin/invites` | Invite pipeline + Access Requests + Review Queue + **Plans** (trial/full switch) |
| `/admin/access-requests` | Same access-request queue (standalone route) |
| `/admin/builders`, `/admin/gc-clients` | GC account management |
| `/admin/contractors` | Contractor directory |
| `/admin/blog`, `/admin/blog/new`, `/admin/blog/$id` | CMS |
| `/admin/feature-requests` | Triage, status, public responses (also receives in-app "Request access") |
| `/admin/hubspot-simulate` | Replay webhook payloads |
| `/admin/workload` | Live staff roster + `staff_assignments` |
| Sidebar Cleard / Flōridian toggle | View mode (§2.5) — scopes permit lists |
| Tenant switcher (top nav) | Impersonation (§2.5) — `effectiveTenantId` |
| Internal docs | NOC / NTBO / private-provider affidavits, hidden from GCs |
| Victoria widget | Only rendered for `@floridianinc.com` sessions |

---

## 6. Background jobs & webhooks

| Endpoint | Trigger | Auth | Status |
| --- | --- | --- | --- |
| `/api/public/email-outbox/process` | Scheduler | `x-cron-secret` header | **PARTIAL** — no scheduler, no mail key |
| `/api/public/victoria-scan` | Scheduler | `x-cron-secret` header | **PARTIAL** — no scheduler |
| `/api/public/hubspot.deal-webhook` | HubSpot | HMAC signature, fails closed | **LIVE** |
| `/api/public/hoa-reply` | Inbound mail parser | Verified in handler | **LIVE** |
| `/api/public/payments/webhook` | Stripe | `PAYMENTS_SANDBOX_WEBHOOK_SECRET` | **LIVE (sandbox)** |
| `/api/public/access-request` | Legacy request form / Google fallback | Validated + RLS-checked insert | **LIVE** |
| `/api/public/sub-intake-upload` | Sub intake | One-time token | **LIVE** |
| `/api/verify-license` | Compliance layer | Authenticated | **LIVE** |

---

## 7. Security posture

- **RLS on every public table**, with explicit `GRANT`s to `authenticated` / `service_role`
  (and `anon` only where a policy genuinely allows public reads).
- **`SECURITY DEFINER` helpers** (`is_admin`, `current_tenant_id`, `has_role`,
  `permit_in_current_tenant`, `sub_can_see_permit`) evaluate policies without recursion.
  `EXECUTE` on the sensitive ones (`handle_new_user`, `consume_invite_token`,
  `current_user_email`) is revoked from `PUBLIC` and `anon`.
- **Encryption at rest for credentials** — AES-256-GCM for building-department logins and
  OAuth connection keys.
- **Fixed findings:** unsigned HubSpot webhook, a public staff-seeding endpoint with a hard-coded
  password (deleted), any-authenticated blog writes, and the homeowner share-token flaw where
  the policy checked that a token *existed* rather than that it *matched*.
- **Known open warnings:** a notifications update policy that also matches `user_id IS NULL`,
  a permit-files storage `UPDATE` policy whose `WITH CHECK` only verifies `bucket_id`, and two
  Supabase linter notices about `SECURITY DEFINER` functions being executable.

---

## 8. Brand & content rules (enforced platform-wide)

- Name: **Cleard**. Parent: **Flōridian** (macron over the O). The phrase "by Flōridian" was
  removed from the product UI.
- Colors: **Obsidian `#153157`** dominates, White Sand `#FFFFFF`, Sky `#B6DAEA`,
  Concrete `#E6E7E7`. Nothing outside this palette.
- Type: **Cormorant Garamond** for the wordmark and display headlines, **DM Sans** for all body
  copy, labels, buttons and nav, **JetBrains Mono** for eyebrows and metadata.
- Headers in ALL CAPS. 3px border radius on every button. No emojis anywhere — lucide icons only.
- Locked verbiage: **"2-day plan review"** and **"same-day inspections"**. Never "fast",
  "quick", "next-day", or "rapid".
- Permit number prefix: `CLR-`.
- All monetary values stored in **cents**.

---

## 9. What would make this fully production-real

1. Add a transactional mail provider key and schedule `/api/public/email-outbox/process` — this
   single change activates HOA sends, homeowner deposit notices, notification emails, and
   weekly reports.
2. Schedule `/api/public/victoria-scan` to turn proactive alerts on.
3. Move Stripe from sandbox to live keys.
4. Unify view-mode (`useActiveTenantId`) and impersonation (`effectiveTenantId`) so a client
   picked in one place scopes permits, messages, and plan reads together.
5. Migrate the `localStorage` modules in §4.30 to tenant-scoped tables.
6. Add an SMS provider to honor the `sms_*` notification preferences.
7. Retire the leftover `/invoices` mock (`fees` table does not exist).
