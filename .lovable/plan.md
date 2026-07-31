## Goal

Stop cross-tenant reads of HOA contact PII (`hoa_contact_name`, `hoa_contact_email`, `hoa_contact_phone`) while keeping the shared community repository and the ability to submit to a community whose template another tenant created. Contact PII becomes usable server-side only, never sent to the browser.

## 1. Database (one migration, only `hoa_templates` policies touched)

Before:
```sql
CREATE POLICY "hoa_templates read all authenticated" ON public.hoa_templates
FOR SELECT USING (true);
```
After:
```sql
CREATE POLICY "hoa_templates read own tenant" ON public.hoa_templates
FOR SELECT TO authenticated
USING (is_admin() OR created_by_tenant_id = current_tenant_id());
```
Plus a non-PII sharing view (owner-owned, so it reads past the base table's RLS; access controlled by GRANT to `authenticated` only, never `anon`):
```sql
CREATE VIEW public.hoa_templates_shared AS
SELECT id, community_name, city, submission_method, submission_portal_url,
       required_documents, deposit_amount_cents, deposit_type, arc_meeting_notes,
       form_template, uploaded_form_path, last_used_at, usage_count,
       created_by_tenant_id, created_at, updated_at, current_version,
       (hoa_contact_email IS NOT NULL) AS has_contact_email
FROM public.hoa_templates;
GRANT SELECT ON public.hoa_templates_shared TO authenticated;
```
No contact columns in the view. `has_contact_email` is a boolean only — it drives the "can send" check without leaking the address. Insert/update/delete policies on `hoa_templates` are untouched, and no other table is touched.

## 2. What changes in `src/lib/hoa-templates.ts`

- `listHoaTemplates()` / `searchHoaTemplates()` / `getHoaTemplate()` read from `hoa_templates_shared` and return a new `HoaTemplateShared` type (no contact fields, plus `has_contact_email`). This is what the picker and detail page use.
- New `getHoaTemplateOwn()` reads the base table (full row incl. contact) — used only by the create/edit + versioning path, which is already own-tenant/creator-only.
- `searchHoaTemplates()` drops `hoa_contact_name` from its `.or()` filter; `/portal/hoa-submittals/new`'s client-side filter drops the same field. Search still matches community and city.

## 3. What changes in `src/lib/hoa-send.ts`

The whole send routine moves server-side. `hoa-send.ts` becomes a thin client caller; the logic lands in `src/lib/hoa-send.server.ts`, exposed by `sendHoaSubmittalFn` in `src/lib/hoa.functions.ts` (`requireSupabaseAuth` middleware).

Inside the handler:
1. Read the submittal via `context.supabase` — RLS confirms the caller's tenant owns it. No submittal, no send.
2. Resolve the template contact with the service-role client (loaded inside the handler, after that check), reading only `hoa_contact_name/email/phone`, `community_name`, `city`, `deposit_amount_cents` for that one `template_id`.
3. Build the HOA email body and the homeowner deposit notice exactly as today (same wording, same attachments, same `Dear …`/contact-block interpolation), enqueue both through `context.supabase` so `email_outbox` inserts stay tenant-scoped and attributed to the caller.
4. Update the submittal status/timestamps and write the two `hoa_submittal_events` rows via `context.supabase` — same values as today.
5. Bump `last_used_at`/`usage_count` with the admin client so shared-repository usage stats work even for another tenant's template (today this silently no-ops cross-tenant, since template UPDATE is admin-or-creator).

Return shape stays `{ hoaEmailId, homeownerEmailId, warnings }`. The "No HOA contact email on file" error keeps its exact text but is now raised server-side.

## 4. What changes on `/portal/hoa-submittals/$id`

- Contact block: `hoa_contact_name` and `hoa_contact_email` lines are removed. It keeps template name, city, deposit, and gains a neutral line — "HOA contact on file · used automatically when sending" — rendered from `has_contact_email`. If the flag is false it reads "No HOA contact on file", matching the old failure hint.
- `sendToHoa()` pre-check switches from `template?.hoa_contact_email` to `template?.has_contact_email`, so the user still gets the same early toast instead of a failed send.
- Send call goes through `useServerFn(sendHoaSubmittalFn)`; the surrounding confirm dialogs, PDF-generation prompt, and toasts are unchanged.

## 5. Reply logging (the client-side default you flagged)

Today `submitReply()` falls back to `template?.hoa_contact_email` / `hoa_contact_name` in the browser — that breaks once the email isn't there. Fix: a second server function, `logHoaReplyFn`, takes `{ submittalId, direction, subject, bodyText, fromEmail? }`. It verifies submittal access via `context.supabase`, and when `fromEmail` is empty it resolves the default sender email and name from the template contact server-side, then inserts the `hoa_submittal_replies` row as the caller. Behavior is identical: leave the field blank and the reply is attributed to the HOA contact on file.

- The input placeholder changes from `From email (default hoa@example.com)` to `From email (defaults to the HOA contact on file)`.
- The `hoa_reply_logged` timeline event stays a client call — it carries no contact data.

## 6. Tests

Two fake tenants in a rolled-back transaction (no persisted data):
- Same-tenant read of the base table returns full rows including contact fields.
- Cross-tenant read of the base table returns zero rows.
- Cross-tenant read of `hoa_templates_shared` returns the community with `has_contact_email = true` and no contact columns available at all.
- Send path: confirm the server-side resolution picks the correct contact for another tenant's template, then grep the browser-facing modules to prove no contact column is selected client-side.

## Technical notes

- The view is intentionally not `security_invoker` — that's what allows cross-tenant browsing of non-PII after the base table is locked down. Its exposure is bounded by the column list plus the `authenticated`-only grant.
- Service-role usage is confined to the two handlers, loaded via dynamic import inside the handler after the caller's access to the submittal has been proven through RLS.
- Cross-tenant template *edits* remain impossible; only reads of non-PII columns and server-side contact use are shared.
