# Cléared by Flōridian — Platform Feature Report

A complete, feature-by-feature account of what the platform does, why each piece exists,
how it is implemented, and — critically — **which features run on live backend data and
which are still demo/mock data.**

Last audited: 31 August 2026.

---

## Legend

| Tag | Meaning |
| --- | --- |
| **LIVE** | Backed by the Lovable Cloud database (Postgres + RLS). Real reads/writes that persist per user/tenant. |
| **LIVE (empty)** | Wired end-to-end to the database, but the table currently has 0 rows — it works, it just has nothing in it yet. |
| **LOCAL** | Persists to the browser's `localStorage` only. Real interactivity, but data is per-device, not shared across users, and is lost when storage is cleared. |
| **MOCK** | Hard-coded/generated demo data in a TypeScript file. Deterministic, presentational, no persistence. |
| **EXTERNAL** | Calls a real third-party service (Stripe, HubSpot, Google, Census, DBPR, AI Gateway). |

---

## 0. What the platform is

Cléared is Flōridian's **private-provider permitting arm**, operating under Florida Statute
**553.791**. Managed GC accounts are invited; licensed contractors can also self-serve at
`/join` onto a **trial** plan (own permits only). Full-plan work is still the invited /
staff-managed path.

The business promise it exists to operationalize:

- **2-day plan review** instead of county queues measured in weeks.
- **Same-day inspections** performed by Cléared's own certified inspectors.
- Statutory guarantees: affidavit → 10 business day permit-or-cite; certificate of
  compliance → 2 business day CO on residential.

Every feature below exists to either (a) compress that timeline, (b) protect the statutory
paper trail that makes private provider work legally defensible, or (c) capture the fee
float (Permitting Fee = construction value × 1.5%; Private Provider & Admin Fee = $8,856 flat).

---

## 1. Identity, Access & Roles

### 1.1 Authentication — **LIVE**
- **What it does:** Email/password + Google sign-in gates the entire portal. Staff accounts
  (`@floridianinc.com`) require TOTP 2FA.
- **Why:** The portal contains signed statutory affidavits, license numbers, insurance
  certificates and payment authorizations. It cannot be public.
- **How:** Lovable Cloud Auth. Session read through `src/lib/use-session.ts`; the client is
  `src/integrations/supabase/client.ts`. Route gating lives in `src/routes/login.tsx` and
  the portal shell.
- **Status:** Fully functional. 6 real profiles exist.

### 1.2 Role model (`user_roles`) — **LIVE**
- **What it does:** Separates `admin` (Cléared staff) from GC/builder users, and drives every
  role-aware screen in the app.
- **Why:** Staff see internal ops, escalations, workloads and margins. GCs must never see them.
- **How:** Dedicated `user_roles` table + a `has_role()` security-definer function used inside
  RLS policies — roles are deliberately **not** stored on the profile row, to prevent
  privilege escalation. Client-side convenience helpers: `src/lib/portal-role.ts`,
  `src/lib/is-internal-user.ts`.
- **Status:** Live, 10 role rows assigned.

### 1.3 Tenants / Clients (`tenants`, `tenant_members`, `tenant_invites`) — **LIVE**
- **What it does:** Each GC firm is a tenant. Members belong to a tenant; all permit data is
  scoped to it.
- **How they get in:**
  - **Self-serve** at `/join` or `/signup` (`selfServeSignupFn`) — creates the tenant
    (`plan: 'trial'`) and an unconfirmed `gc_owner`. Rate-limited via `signup_attempts`.
  - **Invite token** at `/join/$token` — joins an existing tenant. Staff-created tenants
    are written `plan: 'full'`.
  - **Google sign-in** — `evaluatePortalAccessFn` allows known seats or self-provisions a
    trial tenant; unverified email is refused.
- **Why:** Multi-GC isolation — Coastline Builders must never see another builder's jobs.
- **How:** Tenant ID column on scoped tables, enforced by RLS. Invite pipeline in
  `src/lib/invite-pipeline.functions.ts`.

### 1.4 Access requests (`access_requests`) — **LIVE** (legacy)
- **What it does:** Staff queue at `/admin/invites` → Access Requests. `/join` no longer
  writes this table. `POST /api/public/access-request` and the Google-sign-in fallback
  still do. Approving creates a full-plan tenant.
- **How:** `src/routes/api/public/access-request.ts`; `approveAccessRequestFn`.

### 1.5 Onboarding & PAA gate — **LIVE + LOCAL**
- **What it does:** Three-step onboarding ending with a mandatory **Permit Agent
  Authorization** signature before portal access is granted.
- **Why:** Under 553.791 Cléared must hold written authorization to act as the GC's permit
  agent. No signed PAA, no filings.
- **How:** `src/routes/onboarding.tsx` (profile + tenant writes are LIVE);
  `src/lib/paa.ts` + `src/components/paa-sign-dialog.tsx` store the signature record
  **locally** (LOCAL) with version tracking and download.
- **Gap to close:** move PAA signature records into a `paa_signatures` table so they are
  legally retrievable server-side.

### 1.6 Plan gating (`tenants.plan`) — **LIVE**
- **What it does:** `trial` (self-serve) vs `full` (invited/managed). Trial can file its own
  permits; sub invites, licence verification, COI requests and lien rights show a lock that
  files a real `feature_requests` row.
- **How:** `src/lib/plan-access.ts` (`usePlanAccess`, `TRIAL_PATHS`, fail-open to `full`).
  UI: `src/components/feature-lock.tsx`. Staff switch at `/admin/invites` → Plans
  (`setTenantPlanFn`). Column default is `full`; only self-serve writes `trial` explicitly.
  Admins are never gated.

### 1.7 Staff view mode vs impersonation — **LOCAL** (UI filter)
- **View mode** (`src/lib/view-mode-context.tsx`): sidebar Cleard / Flōridian toggle.
  Flōridian view hard-scopes permit lists to tenant `3e137bde-7c3b-46b6-bcf9-57b703fd5592`.
  Admin view with no client picked uses sentinel `"__none__"` and `listPermits` returns `[]`.
  Drives My Permits, both dashboards, documents, financials, inspections, and which nav rail
  renders.
- **Impersonation** (`cleard_impersonate_tenant` via the top-bar switcher): sets
  `session.effectiveTenantId` for plan reads, messages and contacts. Does **not** fill
  My Permits. Both are UI filters, not RLS.

---

## 2. Permits — the core pipeline

### 2.1 Permit records (`permits`) — **LIVE**
- **What it does:** The canonical permit object: number (always `CLR-` prefixed), address,
  jurisdiction, scope, valuation, status, submitted/updated timestamps.
- **Why:** Everything else in the platform hangs off a permit.
- **How:** `src/lib/permits-api.ts` reads/writes the table; surfaced at `/portal/permits`,
  `/my-permits`, `/portal/permits/$id`.
- **Status:** **Fully live — 28 real permit rows.**

### 2.2 Permit intake (Smart Intake Form) — **LIVE + EXTERNAL + MOCK assists**
- **What it does:** GC-facing submission form at `/forms/permit-intake` with address
  auto-complete, automatic county/jurisdiction resolution, contractor license validation on
  blur, live fee estimation, and an AI "Draft with Victoria" scope-of-work writer.
- **Why:** Bad intake is the #1 cause of correction cycles. Catching a wrong jurisdiction or
  a lapsed license at intake protects the 2-day review promise.
- **How:**
  - Address autocomplete + geocode → `src/routes/api/geocode-census.ts` (**EXTERNAL**, US Census).
  - License validation → `src/routes/api/verify-license.ts` / `src/lib/dbpr-api.ts` (**EXTERNAL/MOCK hybrid** — DBPR has no open API, so the shape is real but the verification result is simulated).
  - Fee estimate → `src/lib/fee-schedules.ts` (**MOCK** schedule tables, real formula).
  - Scope drafting → Lovable AI Gateway (**EXTERNAL**, real model call).
  - Submission → writes a `permits` row (**LIVE**).

### 2.3 Document requirements & deferral — **LIVE**
- **What it does:** Six intake document slots — Stamped Construction Plans (required, but
  **deferrable** via "Defer — I'll upload this later"), Site/Spot Survey, Product Approvals/NOA,
  Truss Packet, Energy Calcs, Civil/Other.
- **Why:** GCs frequently have everything except the sealed plans. Blocking submission delays
  the clock; deferral starts the file while staff chase the missing item.
- **How:** Deferred docs are stored with `status: pending` so staff can track outstanding items.
  Uploads go to Cloud storage via `src/lib/project-documents.ts`.

### 2.4 Submittal packages & partial submittal — **LIVE (empty)**
- **What it does:** Bundles a permit's documents into a numbered submittal package;
  supports partial submittal when only some trades are ready.
- **Why:** Trade permits (pool, electric, gas, screen) move at different speeds; partial
  submittal keeps the fastest trades moving.
- **How:** `src/lib/submittal-package.ts`, `src/lib/bundle.ts`,
  `src/components/bundle-partial-submit-dialog.tsx`, route `/portal/permits/$id/bundle`.

### 2.5 Review queue — **LIVE (empty)**
- **What it does:** Staff work queue at `/admin/review-queue`; claim, review, approve or
  return with corrections.
- **Why:** This is where the 2-day plan review promise is actually executed and measured.
- **How:** `src/lib/review-queue.functions.ts` (server functions) +
  `src/components/admin-permit-review-actions.tsx`.

### 2.6 Corrections / Revisions (`permit_resubmittals`, `submittal_corrections`) — **LIVE (empty) + LOCAL**
- **What it does:** Tracks correction rounds: `corrections_requested` → `revised_uploaded` →
  `resubmitted`, with round numbering, reviewer comments, and revised-plan filing straight
  into the document vault.
- **Why:** Correction cycles are the hidden killer of permit timelines. Round-count is a
  reportable KPI and feeds Victoria's per-municipality intelligence.
- **How:** `src/lib/resubmittals-api.ts` (LIVE) + `src/lib/project-revisions.ts` (LOCAL demo
  state) rendered by `src/components/project-revisions-tab.tsx` and `resubmittal-panel.tsx`.

### 2.7 Permit status, sync & expiration — **LIVE + LOCAL**
- **What it does:** Normalized status badges, per-permit-type status, expiration monitoring
  with warning banners (FBC 105.4.1 — a permit dies without an active inspection).
- **Why:** An expired permit on a $3M job is a catastrophic, avoidable failure.
- **How:** `src/lib/status-badges.ts`, `src/lib/permit-type-status.ts` (presentation),
  `src/lib/permit-expiration.ts` + `src/hooks/use-expiration-alerts.ts` +
  `src/components/expiration-banner.tsx` (LIVE query against permits),
  `src/lib/permit-sync.ts` (LOCAL demo sync log).

### 2.8 Permit card & export — **LIVE**
- **What it does:** Printable job-site permit card (`/permit-card/$id`) and CSV/PDF export
  of the permit list.
- **Why:** Florida requires the permit card posted on site; inspectors scan it.
- **How:** `src/lib/permit-export.ts`, `src/lib/permit-storage.ts`.

---

## 3. Inspections

### 3.1 Inspection scheduling & results (`permit_inspections`) — **LIVE**
- **What it does:** Request an inspection, get a same-day slot, receive pass/fail with
  inspector notes and photos; failures open a 48-hour correction window.
- **Why:** Real-time virtual inspections are the single biggest schedule advantage private
  provider offers over county queues.
- **How:** `src/lib/inspections-api.ts` (LIVE, 1 row today),
  `src/components/inspections-panel.tsx` / `inspections-section.tsx`, route `/portal/inspections`.
  `src/lib/inspections.ts` supplies LOCAL demo inspection history for populated-looking screens.

### 3.2 Certificate of Occupancy checklist (`co_checklist_items`) — **LIVE**
- **What it does:** Per-project CO readiness checklist — every item that must clear before the
  2-business-day certificate of compliance → CO handoff.
- **Why:** CO delays are usually one missed sub-item. Making it a checklist makes it a process.
- **How:** `src/lib/co-checklist.ts`, `src/components/co-checklist-panel.tsx`.
- **Status:** **Live and populated — 88 rows.**

---

## 4. Financials

### 4.1 Fee model (`fees`, `service_fee_invoices`) — **LIVE (empty)**
- **What it does:** Auto-invoices at submittal. Permitting Fee = construction value × 1.5%;
  Private Provider & Admin Fee = $8,856 flat. All amounts stored in cents.
- **Why:** This is the revenue engine. Cléared also earns float on collected county fees
  between collection and disbursement.
- **How:** `src/components/permit-fees-panel.tsx`, `src/components/service-fee-invoice-panel.tsx`,
  `src/components/log-permit-fee-dialog.tsx`, `src/lib/manual-fees.ts` (LOCAL for ad-hoc line items).

### 4.2 Fee calculator & savings calculator — **MOCK**
- **What it does:** Public marketing tools at `/fee-calculator` that model county fees vs.
  Cléared pricing, including the HB 803 reductions (25% partial / 50% full county fee
  reduction, effective July 1 2026).
- **Why:** Top-of-funnel proof that private provider is cheaper *and* faster.
- **How:** Pure client-side math over `src/lib/fee-schedules.ts` county schedules.
  Schedules are hand-maintained mock tables, not a live county feed.

### 4.3 Billing & subscriptions (`subscriptions`) — **LOCAL + LIVE (empty)**
- **What it does:** `/portal/billing` — role-aware. GCs see plan, payment method, invoice
  history; staff see issued invoices, transaction-fee breakdown and margin.
- **How:** `src/lib/billing.ts` (LOCAL demo store) with a live `subscriptions` table wired
  but unpopulated. Invoice list at `/invoices` reads live.

### 4.4 Payments / Stripe — **EXTERNAL, test mode**
- **What it does:** Payment Authorization form vaults a card via Stripe Embedded Checkout;
  webhook records the result.
- **Why:** Fees are charged automatically at submittal — the card must be on file first.
- **How:** `src/lib/payments.functions.ts`, `src/lib/stripe.server.ts`,
  `src/components/stripe-embedded.tsx`, webhook at `src/routes/api/public/payments/webhook.ts`.
  `PaymentTestModeBanner` is displayed while keys are in test mode.
- **Status:** Real Stripe integration, **test mode — no live money moves yet.**

### 4.5 Payment authorization form — **LOCAL**
- `src/lib/payment-auth.ts` + `/forms/payment-authorization`: captures the signed ACH/card
  authorization document. Currently stored locally; should be promoted to a table.

---

## 5. Compliance & Legal

### 5.1 GC company profile — license, insurance, bond — **LIVE**
- **What it does:** `/portal/company` tracks the qualifier's DBPR license, General Liability,
  Workers' Comp and surety bond, each with expiration dates. Warns at 60 days (amber) and
  **blocks new permit submissions** when anything is expired (red).
- **Why:** Filing a permit under a lapsed license is a licensing violation for both the GC and
  Cléared. This is a hard compliance gate, not a nicety.
- **How:** `src/lib/gc-company.ts` against `public.gc_company_profiles` (one row per tenant)
  and private bucket `company-compliance-docs`. Save reuses `verifyDbprLicense()`
  (`/api/verify-license`). Uploads via `src/lib/company-docs.functions.ts`. Staff monitoring
  at `/admin/gc-compliance`; banner `company-compliance-banner.tsx`.
- **Status:** Live. Needs migration `20260804140000_gc_company_profiles.sql` applied on the
  hosted project.

### 5.2 Subcontractor compliance (`subcontractors`, `sub_accounts`, `gc_coi_minimums`) — **LIVE + AI**
- **What it does:** Sub roster per GC, COI (certificate of insurance) collection, minimum
  coverage rules per GC, AI document scanning to extract carrier/policy/limits/expiry, and a
  token-gated sub portal (`/sub-portal/$token`, `/sub-intake/$token`) so subs can upload
  without an account.
- **Why:** An uninsured sub on a $3M pool job is an existential liability. Automating COI
  chase-down removes the most tedious admin task in the business.
- **How:** `src/lib/subs-api.ts`, `src/lib/compliance.functions.ts`,
  `src/lib/compliance-core.server.ts` (AI extraction via Lovable AI Gateway — **EXTERNAL**),
  `src/lib/compliance-access.server.ts` (authorization guard so nobody can trigger paid AI
  scans on arbitrary sub IDs), `src/components/subcontractors-manager.tsx`,
  `src/components/coi-alerts-widget.tsx`.
- **Status:** Live (4 subs, COI minimums configured). AI scanning is real.

### 5.3 Notices — NOC, NTO, NTBO — **LIVE (empty) + LOCAL**
- **What it does:** Notice of Commencement awareness ribbon, Notice to Owner filings
  (`nto_filings`), and automated Notice to Building Official generation.
- **Why:** Florida lien law and 553.791 both hinge on these notices being filed on time.
  A missed NTBO invalidates the private-provider filing.
- **How:** `src/lib/noc-auto.ts`, `src/lib/nto-api.ts`, `src/lib/nto-pdf.ts`,
  `src/lib/ntbo-auto.ts`, `src/components/noc-awareness-ribbon.tsx`, `nto-section.tsx`.

### 5.4 Lien waivers & releases (`lien_releases`) — **LIVE (empty) + LOCAL**
- `src/lib/lien-releases.ts` (LIVE) and `src/lib/lien-waivers.ts` (LOCAL) generate conditional
  and unconditional waivers; `generate-lien-waiver-dialog.tsx` drives the flow.

### 5.5 Legal document library & Remote Online Notary queue — **LIVE + LOCAL**
- **What it does:** `/legal` holds PAA templates, NTBO templates and Terms of Service with
  version history (`legal_documents` + `legal_document_versions`, private bucket
  `legal-documents`). `/legal/notary-queue` schedules RON sessions — that queue is still
  **LOCAL** (`notary-requests.ts`).
- **Why:** Several statutory documents require notarization; keeping the library inside the
  platform preserves the chain of custody.
- **How:** `src/lib/legal-docs.ts` + `src/lib/legal-docs.functions.ts`. Admin-only
  (`is_admin()` + `AdminOnly`). Versioning mirrors HOA templates with a real `file_path` per
  version. Needs migration `20260804150000_legal_documents.sql`.

### 5.6 Signatures — **LOCAL**
- `src/lib/signature-requests.ts` + `send-for-signature-dialog.tsx`: request, track and record
  e-signatures on affidavits and authorizations. Demo-grade; not yet a certified e-sign provider.

### 5.7 ID verification — **LIVE + EXTERNAL**
- `src/lib/id-verification.functions.ts` + `/api/public/id-upload`: government-ID capture and
  AI verification for notary and qualifier identity checks.

---

## 6. Projects & Documents

### 6.1 Project records — **MOCK**
- **What it does:** 24–31 canonical Flōridian projects with permit number, client, address,
  city/county resolution, scope, status, construction value and permit types. Drives
  `/projects`, `/projects/$id`, `/my-permits`, `/portal`, `/portal/projects`.
- **Why:** Projects are the organizing unit staff actually think in; permits hang off them.
- **How:** `src/lib/projects-data.ts` — a hand-curated TypeScript array with a
  city→county mapping table. **All values default to $50,000 construction value** until
  updated with real figures.
- **Status:** **MOCK.** This is the single largest remaining gap: the projects that most of
  the portal renders are static data, while `permits` (28 rows) is live. Unifying these is the
  highest-value next step.

### 6.2 Document vault (`project_documents` in Cloud storage) — **LIVE**
- **What it does:** Central per-project file store — plans, surveys, NOAs, truss packets,
  energy calcs, revised plans, notarized documents, COIs. Versioned by upload.
- **Why:** One authoritative location for everything a county or an attorney could ask for.
- **How:** `src/lib/project-documents.ts` (Cloud storage + table), uploader
  `src/components/permit-doc-uploader.tsx`.

### 6.3 Cloud file pickers — **EXTERNAL**
- Google Drive picker (`src/lib/google-drive.functions.ts`,
  `src/components/google-drive-picker-dialog.tsx`) lets GCs pull plan sets straight from Drive
  via per-user OAuth (`app_user_connections`, 1 connection live).

### 6.4 Project notes & PCN lookup — **LOCAL + EXTERNAL**
- `src/lib/project-notes.ts` (LOCAL) for GC-visible notes;
  `src/lib/project-pcn.ts` + `pcn-lookup-dialog.tsx` + `property-appraiser.ts` /
  `property-appraiser-dialog.tsx` resolve the county Parcel Control Number and property
  appraiser record for an address (**MOCK** lookup shape, real UX).

---

## 7. Internal Operations (staff only)

### 7.1 Staff assignment, priority & escalation — **LIVE**
- **What it does:** Every project gets an assignee from the Cléared staff roster, a priority
  (Normal / High / Urgent) and an escalation flag that notifies senior staff.
  Rendered by `src/components/project-internal-ops.tsx` behind an "Internal Ops — Staff Only" header.
- **Why:** Ownership is what makes a 2-day SLA enforceable. Escalation surfaces the jobs at risk.
- **How:** `src/lib/staff-ops.ts` — roster from `user_roles` ⨝ `profiles`
  (`listStaffAdmins()`), assignments from `staff_assignments`. Gate with `session.isAdmin`,
  not `isInternalUser()`.

### 7.2 Internal notes — **LOCAL**
- Free-text ops notes explicitly labeled **"Not Visible To The GC."** Authored under the
  signed-in user, timestamped, append-only in practice.

### 7.3 Staff workload — **LIVE**
- `/admin/workload` aggregates open assignments per staff member so work can be rebalanced.
  Role column shows `—` when `profiles.job_title` is unset. Excludes `@test.invalid`;
  duplicate local-parts keep `@cleared.com`.

### 7.4 Audit trail (`activity_events`) — **LIVE (empty) + LOCAL**
- **What it does:** Append-only log of every meaningful action — status changes, uploads,
  assignments, fee events — with a global view at `/admin/audit` (filters + CSV export) and a
  per-project Activity tab.
- **Why:** Private provider work is legally auditable. If the county challenges a filing,
  the log is the defense.
- **How:** `src/lib/audit-log.ts` (LOCAL today) writing toward the live `activity_events` table;
  `src/components/project-audit-tab.tsx`, `/admin/activity`.

### 7.5 Admin console — **LIVE (mixed)**
- `/admin` hub plus: `/admin/gc-clients`, `/admin/builders`, `/admin/contractors`,
  `/admin/invites` (pipeline, access requests, review queue, **Plans**), `/admin/access-requests`,
  `/admin/protection`, `/admin/utility-locates`, `/admin/feature-requests`, `/admin/blog`,
  `/admin/hubspot-simulate`, `/admin/workload`.

---

## 8. Communications

### 8.1 Messaging (`message_threads`, `message_posts`) — **LIVE**
- **What it does:** Support-desk model — GCs open a thread, Cléared staff (help@cleardinc.com)
  reply. A trial plan can only write to Cleard (`info@cleardinc.com`); the recipient is fixed.
  Route `/messages`.
- **Why:** Permit questions currently live in scattered text threads; centralizing them ties
  every question to a permit record.
- **How:** `src/lib/messages-api.ts`. New-thread `tenant_id` follows impersonation
  (`getImpersonatedTenantId()`), not view-mode.

### 8.2 Notifications (`notifications`, `notification_prefs`) — **LIVE**
- **What it does:** Bell icon with unread count; triggers on permit issued, corrections
  requested, inspection result, fee due, expiration warning, COI lapse.
- **Why:** The platform's value is being *proactive* — the GC should learn about a problem
  from Cléared, not from a stop-work order.
- **How:** `src/lib/notifications-api.ts` + `src/lib/client-notifications.ts`,
  `src/components/notification-bell.tsx`, prefs in `notification-prefs-section.tsx`.

### 8.3 Email outbox (`email_outbox`) — **LIVE (empty)**
- Queued transactional email with a processor at `/api/public/email-outbox.process`,
  so sends are retryable and auditable rather than fire-and-forget.

### 8.4 Homeowner share links — **LIVE**
- `/homeowner/$token` gives the property owner a read-only status view without an account
  (`homeowner-share-dialog.tsx`). Keeps the GC from fielding "where's my permit" calls.

---

## 9. Victoria — AI layer

### 9.0 Voice-fill — **LIVE (browser SpeechRecognition, no AI)**
- **What it does:** Fixed field script on `/join` (`victoria-voice-signup.tsx`) and New Permit
  (`victoria-permit-assistant.tsx`, `data-tour="victoria-permit"`). Ask → listen → write →
  advance. First-login tour ends on that mic, not on "Generate Intake Link" (plan-gated).
- **How:** `src/lib/victoria-speech.ts`. No LLM. Missing API → control is not rendered;
  typing always works.

### 9.1 Ask Victoria — **EXTERNAL (real AI)**
- **What it does:** `/ask-victoria` plus a floating widget: answers Florida Building Code,
  553.791 and jurisdiction-specific questions in context of the current project.
- **How:** Lovable AI Gateway. `src/routes/ask-victoria.tsx`, `victoria-widget.tsx`,
  `victoria-callout.tsx`.

### 9.2 Victoria document scan — **EXTERNAL (real AI)**
- `/api/public/victoria-scan` reads uploaded plan sets and COIs, extracts structured fields,
  and flags likely correction triggers **before** submittal. This is the mechanism that
  protects the 2-day review promise.

### 9.3 Submittal intelligence (`submittal_intelligence`, `submittal_corrections`) — **LIVE (empty)**
- **What it does:** Every permit and HOA submittal writes an intelligence row: municipality,
  trades, scope, days-to-first-response, days-to-resolution, fee, final outcome. Aggregations
  power the Victoria intelligence bar and a "Common Corrections" tab per municipality.
- **Why:** This is the compounding moat — after a few hundred submittals Cléared knows exactly
  which reviewer in which city rejects which detail, and can pre-empt it.
- **How:** `src/lib/intelligence.ts`, `src/components/victoria-intelligence-panel.tsx`.
- **Status:** Schema and write paths exist; **no rows yet**, so the panels currently show
  seeded/empty states.

### 9.4 Victoria alerts (`victoria_alerts`) — **LIVE (empty)**
- Proactive AI-generated risk alerts per permit (`src/lib/victoria-alerts.ts`,
  `permit-alerts-inline.tsx`, `/portal/alerts`).

---

## 10. Jurisdiction knowledge

### 10.1 Municipality directory — **MOCK + LOCAL**
- **What it does:** `/municipalities` and `/portal/building-dept` — per-jurisdiction profiles:
  submittal method, portal URL, turnaround expectations, quirks, readiness score, and an
  interactive map.
- **Why:** Every Florida jurisdiction files differently. This is institutional knowledge that
  otherwise lives in one employee's head.
- **How:** `src/lib/municipalities-data.ts` (MOCK seed), `municipalities-store.ts` (LOCAL edits),
  `municipality-docs-store.ts` (LIVE doc storage), `municipality-map.tsx`,
  `municipality-readiness-panel.tsx`.

### 10.2 Municipal contact directory — **LOCAL**
- Named contacts (CBO, plan reviewers, inspection schedulers) for Palm Beach County,
  St. Lucie County, City of Port St. Lucie, Martin County and City of Fort Pierce, shown both
  on the municipality card and as a sidebar panel on each project.
  `src/lib/municipal-contacts.ts`, `src/components/municipal-contacts.tsx`.

### 10.3 Building department portal logins (`gc_portal_logins`) — **LIVE (empty), encrypted**
- **What it does:** Stores the GC's credentials for each county e-permitting portal so Cléared
  can file on their behalf. `/building-dept-logins`.
- **How:** `src/lib/portal-logins.functions.ts` with **AES-256-GCM envelope encryption**
  (`src/lib/portal-logins-crypto.server.ts`). Credentials are never readable client-side.

### 10.4 County filter — **LIVE**
- My Permits filters across Palm Beach, Martin, St. Lucie, Indian River, Broward and Miami-Dade.

---

## 11. HOA / ARB submittals

### 11.1 HOA submittal engine (`hoa_submittals`, `hoa_templates`, `hoa_template_versions`, `hoa_submittal_events`, `hoa_submittal_replies`) — **LIVE (empty)**
- **What it does:** Full parallel pipeline to permitting, for architectural review boards:
  build a submittal from a versioned template, generate the PDF, send it, log every event, and
  capture the board's reply via an inbound endpoint (`/api/public/hoa-reply`).
- **Why:** On $1M+ custom residential, HOA/ARB approval blocks the permit. Cléared owns that
  path too so the GC has one throat to choke.
- **How:** `src/lib/hoa-submittals.ts`, `hoa-templates.ts`, `hoa-template-versions.ts`,
  `hoa-pdf.ts`, `hoa-send.server.ts`, `hoa-events.ts`, `hoa-replies.ts`, `hoa.functions.ts`.
  Routes under `/portal/hoa-submittals/*`.
- **Status:** Complete implementation, zero rows — ready for first real submittal.

---

## 12. Reporting & Analytics

### 12.1 Reports — **MOCK data, real charts**
- **What it does:** `/portal/reports`, role-aware. Staff: permit volume by month, average
  turnaround, correction-round distribution, revenue and fee summaries. GCs: their own portfolio
  status and cycle times. CSV export throughout.
- **Why:** Turnaround time *is* the product. If it isn't measured it can't be sold.
- **How:** Recharts bar/line charts over `src/lib/reports-data.ts` (**MOCK** aggregation).
  Once `submittal_intelligence` has volume, these should be repointed at it.

### 12.2 Weekly reports — **LIVE (server function)**
- `src/lib/weekly-reports.functions.ts` compiles a scheduled per-tenant digest.

### 12.3 Calendar / deadline view — **MOCK**
- **What it does:** `/portal/calendar` with month-grid and list views. Five colour-coded
  deadline kinds: permit expiration (red), inspection (blue), correction response (amber),
  fee due (green), NTBO filing (grey). Filterable, deep-links into the right project tab,
  scoped so GCs see only their own.
- **How:** `src/lib/deadlines.ts` **deterministically synthesizes** 2–3 deadlines per active
  project from the mock project list using a seeded PRNG — stable across reloads, but not
  derived from real permit dates yet.

---

## 13. Marketing site (public)

All public pages are **static/MOCK** content by design.

| Route | Purpose |
| --- | --- |
| `/` | Hero — "Permitting, handled." Bold Space Grotesk treatment, portal mockup, Blue/Green/Amber palette. |
| `/services`, `/process`, `/products` | Explains the private-provider model and the 553.791 statutory timeline. |
| `/pricing` | Fee structure — 1.5% + $8,856 flat. |
| `/fee-calculator` | Interactive county-vs-Cléared savings model incl. HB 803. |
| `/versus`, `/versus/$slug` | Competitor comparisons (PermitFlow, GreenLite, FCC) from `src/lib/versus-competitors.ts`. |
| `/blog`, `/blog/$slug` | **LIVE** — `blog_posts`, 4 published posts, editor at `/admin/blog`. |
| `/compliance`, `/insurance`, `/about`, `/contact` | Trust and credential pages. |
| `/project-guides`, `/portal/guides/*` | ~14 batches of jurisdiction and project-type permitting guides (`portal-guides-*.ts`) — substantial static knowledge base. |

---

## 14. Platform UX systems

### 14.1 Icon-rail navigation — **LIVE**
- 64px fixed obsidian left rail with flyout panels, role-aware sections
  (`src/lib/portal-nav.ts`). Replaced the original top nav bar.

### 14.2 Light / dark theme — **LIVE**
- Sun/moon toggle in the portal shell and site header, persisted to `localStorage`, with an
  inline restoration script in `__root.tsx` / `main.tsx` that honours `prefers-color-scheme`
  and prevents flash-on-load.

### 14.3 Brand system — **LIVE**
- Palette: Floridian Obsidian `#153157` (dominant), Sky Blue `#1B84D4`, Green `#12A05C`
  (primary CTA), Amber `#E8861A`, White Sand, Concrete. Space Grotesk display, DM Sans body,
  JetBrains Mono metadata. Gradient LogoMark (Blue→Green). Signature diagonal wave background.
  No emojis anywhere — lucide icons only. All tokens in `src/styles.css`.

### 14.4 Mobile optimization — **LIVE**
- Bottom navigation bar under 768px, full-screen dialogs / bottom sheets, 44px minimum touch
  targets. Verified at 375 / 390 / 430px.

### 14.5 Bookmarks (`user_bookmarks`) — **LIVE**
- Star any project, permit or guide. 13 bookmarks saved today.

### 14.6 Feature requests (`feature_requests`, votes, notes) — **LIVE (empty)**
- In-product feedback board with voting and staff triage notes.

### 14.7 Error capture — **LIVE**
- `src/lib/error-capture.ts` + `lovable-error-reporting.ts` report runtime errors for triage.

---

## 15. Integrations

| Integration | Status | What it does |
| --- | --- | --- |
| **Lovable Cloud (Postgres/Auth/Storage)** | LIVE | System of record for everything marked LIVE above. RLS + GRANTs on every table. |
| **Lovable AI Gateway** | LIVE | Victoria chat, scope drafting, COI/plan document extraction. |
| **Stripe** | LIVE, **test mode** | Embedded Checkout, card vaulting, webhook. No real charges yet. |
| **HubSpot** | LIVE (webhook) | Deal webhook at `/api/public/hubspot.deal-webhook` creates projects from won deals. Simulator at `/admin/hubspot-simulate`. `src/lib/hubspot-projects.ts` is LOCAL. |
| **Google Drive** | LIVE | Per-end-user OAuth file picker for plan sets. |
| **US Census Geocoder** | LIVE | Address → coordinates/county resolution. |
| **DBPR license lookup** | SIMULATED | Correct shape and UX; result is generated because DBPR publishes no API. |

---

## 16. Honest status summary

### Fully live, real data flowing
Authentication and 2FA · roles and RLS · tenants, members and invites · access requests ·
permits (28 rows) · CO checklist (88 rows) · inspections · subcontractors and COI minimums ·
AI compliance scanning · Victoria chat and document scan · notifications · bookmarks ·
blog · document vault and Google Drive picker · encrypted portal-login storage ·
theme, navigation and mobile shell.

### Built and wired, awaiting first real records (LIVE, 0 rows)
Messaging · submittal packages · review queue · resubmittals · service-fee invoices ·
subscriptions · HOA submittal engine (entire module) · submittal intelligence and Victoria
alerts · NTO filings · lien releases · email outbox · activity/audit events ·
feature requests · prior permits · design professionals · sub accounts.

### Interactive but browser-local — **not yet shared or durable**
GC company profile (license/insurance/bond compliance gating) · staff assignment, priority
and escalation · internal notes · staff workload · audit log writes · PAA signature records ·
legal document library · notary queue · signature requests · billing store · manual fees ·
payment authorization · municipal contacts · municipality edits · project notes ·
subcontractor library · permit sync log.

### Presentational demo data
Projects list (24–31 jobs, all defaulted to $50,000 construction value) · calendar deadlines
(seeded from those projects) · reports and analytics aggregates · fee schedules ·
savings/fee calculators · DBPR verification results · property appraiser / PCN lookups ·
the entire public marketing site.

### Recommended order of work to reach full production
1. **Promote projects to the database.** Everything downstream — calendar, reports, workload,
   internal ops — inherits the mock boundary from `projects-data.ts`.
2. **Move GC company compliance to a table.** It is an enforcement gate; it cannot be
   per-browser.
3. **Move the audit log to `activity_events`.** Legal defensibility requires server-side,
   append-only storage.
4. **Repoint reports at `submittal_intelligence`** once real submittal volume exists.
5. **Switch Stripe to live keys** and remove the test-mode banner.
6. **Persist PAA signatures, notary records and signature requests** server-side.
