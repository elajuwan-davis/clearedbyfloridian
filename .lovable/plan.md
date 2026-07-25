# Bundled Permit Submission

Consolidates multi-trade permits into one GC-fee master package. Each trade becomes a tracked sub-permit; the GC submits full or partial packages to Ops.

## Data model

Store bundle state on the existing `permits` row inside `intake_payload.bundle` (JSON) — no migration required. New `submissions` table for the Ops queue.

`intake_payload.bundle` shape:
```text
{
  enabled: boolean,
  gc_fee_cents: number,
  gc_license_number: string,
  status: "draft" | "subs_signing" | "ready" | "submitted" | "partial",
  trades: [{
    key: "pool" | "gas" | "electric" | "plumbing" | "fencing" | ...,
    label: string,
    sub_id: string | null,          // references subcontractors.id
    sub_snapshot: { company, contact, email, phone, license },
    signature_status: "pending" | "sent" | "signed",
    signature_sent_at, signature_signed_at,
    doc_keys: string[],             // which permit-level docs belong to this trade
    ready: boolean                   // Ops override / GC readiness flag
  }]
}
```

Migration (single call): create `public.submissions`
- `permit_id uuid` FK to permits, `submitted_by uuid`, `type text` (`full`|`partial`),
  `trades_included jsonb`, `trades_pending jsonb`, `fee_cents bigint`,
  `package_manifest jsonb` (list of `{trade, doc_key, filename, storage_path}`),
  `notes text`, `status text` default `received` (`received`|`in_review`|`submitted_to_muni`|`complete`),
  `created_at`, `updated_at` + touch trigger.
- GRANTs: `SELECT/INSERT/UPDATE/DELETE` to authenticated, `ALL` to service_role.
- RLS: authenticated can view/insert/update all (matches existing permits policy).

## Files

New:
- `src/lib/bundle.ts` — types, `getBundle(permit)`, `setBundle(permit, patch)`, `bundleProgress(bundle)`, trade constants, pre-fill payload builder using `FLORIDIAN_FIRM`.
- `src/lib/submissions-api.ts` — `createSubmission`, `listSubmissions`, `updateSubmissionStatus`, `getSubmission`, `downloadSubmissionZip` (uses JSZip on client side; signed URLs from `permit-files`).
- `src/routes/portal.permits.$id.bundle.tsx` — bundle management page.
- `src/routes/portal.submissions.tsx` — Ops queue list.
- `src/routes/portal.submissions.$id.tsx` — Ops detail with package manifest + status controls + zip download.
- `src/components/bundle-partial-submit-dialog.tsx` — modal with per-trade checkboxes and remaining-trades note.

Edited:
- `src/routes/portal.permits.new.tsx` — add "Bundle Submission" toggle (shown when 2+ trades entered); on create, seed `intake_payload.bundle` from the trade rows, then redirect to `/portal/permits/$id/bundle` when toggle is on.
- `src/routes/portal.permits.$id.tsx` — link to bundle view when `bundle.enabled`; hide per-trade fee inputs, show single GC Permit Fee.
- `src/components/portal-shell.tsx` — add "Submissions" nav item under Projects, `FileStack` icon.
- Financials page (`src/routes/portal.permit-fees.tsx` — closest match) — detect bundled permits, render one consolidated row with "Bundle" badge + trades tooltip.

## Bundle page layout (`/portal/permits/:id/bundle`)

1. **Header card**: address, municipality, permit type, GC = Flōridian (locked), GC license (editable, persists to `bundle.gc_license_number`), GC Permit Fee input (cents), overall status pill.
2. **Progress bar**: `X of Y trades signed`. Colored segments per trade.
3. **Trade cards grid** (one per bundle trade):
   - Sub picker (dropdown of `subcontractors` + inline "invite new" link).
   - Doc count from permit `documents` filtered by `doc_keys`.
   - Signature status badge with buttons: **Send to Sub** (POST to `signature-requests` lib with pre-filled payload — reuses existing Signwell scaffold; marks `signature_status: sent`), **Mark Signed** (manual override for now until Signwell webhook is wired).
   - Row indicator: green = docs complete + signed; amber = signed but docs missing; red = not contacted.
4. **Sticky action bar**: **Save Draft**, **Partial Submit**, **Submit Full Package** (disabled unless every trade signed).

## Submit flow

- **Submit Full Package**: build manifest from every trade's `doc_keys`, insert `submissions` row (`type=full`, `trades_included=all`, `trades_pending=[]`), set `bundle.status=submitted`, toast + navigate to `/portal/submissions`.
- **Partial Submit**: dialog with checkboxes; submit selected trades, remaining trades stay in bundle, `bundle.status=partial`, submission row records pending list + note.

## Ops queue (`/portal/submissions`)

Table: address, submitted_at, `Full`/`Partial` badge, trades included, trades pending, doc count, status select, row link to detail. Detail page shows manifest grouped by trade with per-file **View** buttons (signed URLs) and **Download Package** (JSZip stream of all files).

## Financials integration

On the fees page, group rows by `permit_id`; if `bundle.enabled`, render one row with:
- Amount = `bundle.gc_fee_cents`
- "Bundle" pill (obsidian bg, sky text)
- Tooltip listing trades
- Suppress per-trade manual fee rows for that permit.

## Sub pre-fill payload

Built in `buildBundlePrefill(permit, trade)`:
```text
{
  project_address, municipality, permit_type,
  trade: trade.label,
  gc_name: "Flōridian LLC",
  gc_license: bundle.gc_license_number || FLORIDIAN_FIRM.license,
  poc_name: "José Maceda Gutiérrez",
  poc_email: "team@floridianinc.com",
  poc_phone: "(772) 675-3274"
}
```
Passed to the existing signature request lib.

## Out of scope (this pass)

- Real Signwell webhook wiring (Mark Signed stays manual — same pattern as existing signature scaffold).
- Fee comparison "vs. per-trade est." — leave a `TODO` slot on the fees row for a later pass.
- Ops role gating — Submissions page is visible to all authenticated portal users for now, matching current portal RLS posture.

## Approval

Reply "go" to build. I'll open the migration for the `submissions` table first (needs your approval), then ship all page/component code in a single follow-up.
