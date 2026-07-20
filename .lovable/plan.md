
# MVP: Real Backend for Permits + Subcontractors

Right now Permits and Subcontractors are hard-coded arrays + `localStorage`. This plan turns those two flows into a real product on Lovable Cloud, leaves everything else (guides, HubSpot sim, fee calculator, etc.) untouched, and makes the dashboard reflect the real numbers.

## 1. Enable Lovable Cloud

Enable the built-in backend (managed Postgres + Auth + Storage). No external accounts.

## 2. Database schema (one migration)

Two tables, both RLS-protected. Any signed-in Cleared user can read/write for the MVP — we can tighten to per-firm ownership later.

**`permits`**
- `id` uuid pk, `created_at`, `updated_at`, `created_by` (auth.uid)
- `project_name`, `owner_name`, `job_address`, `city`, `county`, `municipality_key`
- `permit_number` (nullable), `permit_type`, `construction_value_cents` (bigint)
- `status` enum: `intake` | `submitted` | `in_review` | `corrections_required` | `approved` | `permit_issued` | `on_hold` | `outsourced` | `complete`
- `pcn` nullable, `notes` text
- `documents` jsonb — array of `{ key, label, required, fileName, filePath, status: 'uploaded'|'deferred'|'missing' }` (Storage paths, not blobs)
- `intake_payload` jsonb — full form snapshot so the detail page can render exactly what was submitted

**`subcontractors`**
- `id` uuid pk, `created_at`, `updated_at`, `created_by`
- `company_name`, `trade`, `qualifier_name`, `license_number`, `license_type`, `license_expiration`, `license_file_path`
- `contact_first_name`, `contact_last_name`, `email`, `phone`, `company_address`
- `insurance_carrier_name`, `insurance_carrier_email`, `coi_file_path`, `coi_expiration`
- `w9_file_path`
- `completion_token` uuid unique — public tokenized signup link
- `status` enum: `invited` | `in_progress` | `complete`

**Storage bucket** `permit-files` (private) — used for both permit docs and sub COI/license/W-9 uploads. Signed URLs on read.

**RLS**
- `permits`, `subcontractors`: `SELECT/INSERT/UPDATE/DELETE` to `authenticated`.
- `subcontractors`: additional narrow `SELECT` + `UPDATE` policy `TO anon` restricted to `completion_token = current_setting('request.jwt.claims', true)::json` — no, simpler: add a server function `submitSubIntake({ token, patch })` that uses the service role, so no anon policy is needed. Public link stays fully server-mediated.

## 3. Data layer

Replace the localStorage stores with thin Supabase-backed hooks (TanStack Query):

- `src/lib/permits-api.ts` — `listPermits`, `getPermit`, `createPermit`, `updatePermit`, `deletePermit`, `uploadPermitDoc`.
- `src/lib/subs-api.ts` — `listSubs`, `getSub`, `createSub`, `updateSub`, `deleteSub`, `uploadSubFile`, `getSubByToken` (server fn, public), `submitSubIntake` (server fn, public).

Hard-coded `PROJECTS`/`SEED` and `loadSubLibrary` become deprecated for these flows — Guides/HubSpot sim keep working off their own data untouched.

## 4. UI wiring

- **My Permits (`/portal/permits`)** — reads from `permits` table via `useQuery`. Each row is a link to `/portal/permits/$id`. Status badges + inspection counter stay. Empty state when 0 rows.
- **New Permit (`/portal/permits/new`)** — existing wizard, but on submit calls `createPermit` + uploads any attached files to Storage, then routes to the new detail page. "Defer" saves the document row with `status: 'deferred'`.
- **Permit Detail (`/portal/permits/$id`)** — NEW route. Shows every field from `intake_payload`, a "Missing information" banner listing empty required fields + deferred docs (with inline upload buttons that patch the row), an Edit button (opens the wizard pre-filled), and a Delete button (confirm dialog).
- **Subcontractors index (`/portal/subcontractors`)** — DB-driven list, "Copy intake link" builds `${origin}/sub-intake/{completion_token}`, Delete + Edit buttons.
- **New Subcontractor (`/portal/subcontractors/new`)** — creates a real row with a generated `completion_token` and shows the copy-link CTA.
- **Public intake (`/sub-intake/$token`)** — calls `getSubByToken` server fn (no auth), lets the sub upload license/COI/W-9 to Storage via signed URLs, and calls `submitSubIntake` server fn to mark `status = complete`.
- **Dashboard (`/portal` + `/dashboard`)** — replaces mock stat cards with live counts:
  - Permits: total, in-review, issued, on-hold
  - Subcontractors: total, complete, missing COI, expired COI
  - "Recent activity" list = 5 most recent permits + subs.

## 5. Out of scope for this pass

Guides, Vicky, Signwell, HubSpot sim, Notary queue, permit-status auto-sync, invoices, gc-clients — untouched. Once you sign off, I'll ship the permit + sub slice end-to-end and we'll layer the rest onto the same schema.

## Technical notes

- Files uploaded via Supabase Storage `permit-files` bucket, path pattern `{permit_id}/{doc_key}/{filename}` and `subs/{sub_id}/{kind}/{filename}`.
- Server functions live in `src/lib/subs-public.functions.ts` (`getSubByToken`, `submitSubIntake`) — public, token-gated, use `supabaseAdmin` inside the handler.
- All authenticated reads/writes use the browser `supabase` client under RLS.
- Migration file will `CREATE TABLE` + `GRANT SELECT,INSERT,UPDATE,DELETE ... TO authenticated` + `ENABLE RLS` + policies, per project rules.
- No changes to routing structure other than adding `/portal/permits/$id`.
