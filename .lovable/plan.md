## Overview

Three connected features layered onto the existing permit → subs data model. Today subs are stored inline as a JSON array on `permits.subs` (denormalized; no separate join table). We'll extend that structure with a per-sub access token + confirmation state, and add a new public sub portal route that reads project-level documents only.

## Assumptions (flag if wrong)

- "Confirmed and fully submitted" = a `subs[]` entry on the permit whose `confirmed: true` flag has been set by the GC or ops (we'll add a "Confirm" toggle in the permit detail Subcontractors tab). It is NOT the library-level `subcontractors.status = complete` — that's the sub's Cleared profile, not per-job confirmation.
- "Project" = a single permit row. There is no separate projects table; job address + permit is the project. Cross-trade visibility is scoped to the same permit's `subs[]`.
- Sub portal access is via a shareable link (UUID token per sub-per-permit), emailed/copied by the GC — not a login. Consistent with existing `/sub-intake/$token` pattern.
- NOC "on file" = the permit has a `notice_of_commencement_review` document entry (the auto-generated draft counts — the sub still doesn't need to file their own).

## Technical Details

### 1. Data model changes

Extend the inline `PermitSub` type on `permits.subs`:
```ts
type PermitSub = {
  companyName, trade, license, contactName, contactEmail, // existing
  accessToken?: string;   // uuid, generated when sub is added
  confirmed?: boolean;    // toggled true in permit detail Subs tab
  confirmedAt?: string;   // iso timestamp
};
```
No migration needed — the column is already `jsonb`. Backfill on read: generate tokens for existing subs the first time the permit detail loads (lazy upsert via `updatePermit`).

### 2. Public sub portal route

New file `src/routes/sub-portal.$token.tsx` (public, `noindex`). Route calls a new server fn `getSubProjectViewFn({ token })` that:
- Uses `supabaseAdmin` to find the permit whose `subs` JSON contains a sub with `accessToken = token AND confirmed = true`.
- Returns: permit summary (project_name, job_address, city, permit_number, status, submitted_date), the sub's own trade/company, the sanitized `documents[]` (only sub-visible entries), and the sanitized `subs[]` (trade + company only).
- Signed URLs for viewable documents are minted on demand via `getSubProjectDocUrlFn({ token, path })` — path must start with `noc/<permit.id>/` or `documents/<permit.id>/` etc.

**Sub-visible doc filter** — allowlist by key:
- `notice_of_commencement_review` (NOC)
- `stamped_plans`, `site_survey`, `tdh_calculations`, `equipment_specification` (project-level plans)
- `permit_card` / issued permit PDF once status = `permit_issued`
- Excluded: anything with `source: "internal"`, key starting `ntbo`, `coi_*`, `w9_*`, `license_*` (sub compliance docs), private-provider forms.

### 3. NOC awareness ribbon

Component `src/components/noc-awareness-ribbon.tsx` (dismissible, sessionStorage-keyed). Shown when the sub-facing view has an NOC document. Copy verbatim:
> "A Notice of Commencement is already on file for this project. You do not need to file a separate NOC."

Displayed on:
- `sub-portal.$token.tsx` (top of page).
- `portal.permits.new.tsx` when in `edit` mode AND the permit has NOC — appears above the Subcontractors section so the GC sees it while adding trades.

### 4. Cross-trade visibility panel

Component `src/components/trades-on-job-panel.tsx`. Renders a compact list of confirmed subs on the permit: `Trade — Company` only. No contact info, no license, no compliance status.

Displayed on:
- `sub-portal.$token.tsx` (both before-first-login and after-submission; the sub always sees the panel).
- `portal.permits.new.tsx` Subcontractors step (shows already-added trades on the current permit).

### 5. Trade-reuse suggestion

Inside `portal.permits.new.tsx`, when the GC picks a trade for a new sub row and `form.subs` already contains a sub with that trade + `companyName`, render an inline suggestion card above that row:
> "Save on this job — {Trade} is already on file with {Company Name}."
> [Use {Company Name}] [Dismiss]

Clicking "Use" copies companyName / license / contact into the new row. Dismiss hides the suggestion for that row (local state).

For a cross-permit variant (same job address on other permits), we can extend later — out of scope for this build to keep it tight.

### 6. Permit detail: confirm subs

In `src/components/project-detail.tsx` Subcontractors tab: add a "Confirm on job" toggle per sub row and a "Copy portal link" button that reveals `${origin}/sub-portal/${accessToken}`. Confirmation writes back to `permits.subs[i].confirmed = true`.

## Files touched

- New: `src/routes/sub-portal.$token.tsx`, `src/lib/sub-portal.functions.ts`, `src/components/noc-awareness-ribbon.tsx`, `src/components/trades-on-job-panel.tsx`
- Edit: `src/lib/permits-api.ts` (extend `PermitSub` type, token backfill helper), `src/routes/portal.permits.new.tsx` (ribbon + trades panel + reuse suggestion + token generation on save), `src/components/project-detail.tsx` (confirm toggle + copy link in Subs tab)

## Out of scope

- Sub authentication (still token-based link, no account).
- Cross-permit trade suggestions across the same property.
- Notifying subs by email when confirmed — link is copied by GC for now.
- New table for per-job sub confirmations — keeps everything in `permits.subs` JSON.

Approve and I'll ship all six files in one pass.