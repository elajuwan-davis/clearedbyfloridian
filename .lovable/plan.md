## Scope: 5 features

### 1. Sub License Verification (DBPR)

DBPR (`myfloridalicense.com`) has no public API — it's a JS form. I'll implement a server route that hits their internal POST endpoint with the license number and parses the HTML response for holder name, type, status, expiration.

- New column on `subcontractors`: `dbpr_verified_at`, `dbpr_status`, `dbpr_holder_name`, `dbpr_license_type`, `dbpr_expiration`.
- Server route `src/routes/api/verify-license.ts` (auth-required) scrapes DBPR and returns parsed result.
- Bundle sub card gets license input + "Verify" button + badge (green Active / red Expired / amber Not Found).
- Result stored on the sub row. **Non-blocking** — informational only.

**Caveat:** DBPR HTML structure can change; if they break the page or add a captcha, verification stops working. That's the tradeoff of scraping.

### 2. COI Expiration Tracking

- `subcontractors.coi_expiration` column already exists — I'll surface it in the Bundle sub card as an editable date field beside the COI upload.
- Badge logic: green ≥60 days, amber <60 days, red past.
- New page `/portal/compliance` listing every sub with COI expired or expiring in 60 days, grouped by permit. Linked from sidebar under Insurance.

### 3. Notification Preferences + Bell

- New table `notification_prefs` (user_id, email_permit_issued, email_inspection_passed, …, sms_*, phone_number).
- New table `notifications` (user_id, kind, title, body, permit_id, read_at, created_at) for the bell dropdown.
- Settings section on `/portal/profile` with toggles per event + phone number field.
- Bell in portal header with unread count, dropdown list, mark-as-read.
- Trigger point: when `updatePermit` changes status client-side, we insert a notification row + send email via existing Lovable email infra (`sendTransactionalEmail`). SMS stubbed — if no Twilio secret, we log "SMS would send to X" and no-op.
- **Not** a Supabase trigger — we fire from the app-side status update, which is where all status changes come from today. Simpler and reliable.

### 4. NTO Filing

- `nto_filings` table linked to `permit_id`: owner name/address, property address, contractor name/address (defaults to Flōridian), work description, first-work date, status (`not_filed` | `draft` | `sent` | `confirmed`), sent_via, sent_at, pdf_path.
- NTO section on `/portal/permits/$id` with form + generate button.
- PDF generated client-side with `pdf-lib` (matches existing generator patterns) and uploaded to `permit-files/nto/{permit_id}.pdf`.
- "Send via email" uses existing email infra to the owner email (add owner_email field). "Send via certified mail" = mark status `sent` + on-screen instruction to print and mail.
- Warning banner on permit detail if `nto_status !== "sent"/"confirmed"` and permit is in intake/preparing.

### 5. `/join` Landing + Access Request

- New public route `src/routes/join.tsx` (no auth gate).
- Layout: obsidian hero, wordmark "Cléared by Flōridian", headline "Permitting, handled.", one-line subhead, single "Request Access" CTA opening a modal form (Name, Company, License #, Email, Phone).
- Below fold: 3 stat blocks (400+ jurisdictions / Bundled submissions / Invite only). Simple footer.
- New table `access_requests` (name, company, license_number, email, phone, status, created_at) with narrow `TO anon` INSERT policy.
- On submit: insert row + email `team@floridianinc.com` via existing email infra.

## Ordering and DB work

I'll batch DB migrations into 3 files (verification cols on subs, notifications tables + prefs, nto_filings + access_requests) and get them approved before wiring the UI so the types regenerate cleanly.

## One decision I need from you

**Email sending.** You mentioned "existing email infrastructure (Resend/SendGrid)." This project uses Lovable's built-in email infra (React Email templates + queued sends), not Resend directly. That's what I'll use for the notification emails, NTO email-to-owner, and `/join` team notification. If you actually want Resend specifically, say so — I'll wire the Resend connector instead.

Everything else I'll proceed with as described unless you push back.