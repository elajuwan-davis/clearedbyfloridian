# Local edge-function test rig

Runs the agent edge functions against a throwaway Postgres + PostgREST, without
touching the live Lovable Cloud database. Needs Docker and Deno.

```bash
# 1. Postgres
docker run -d --name cleard-pg -e POSTGRES_PASSWORD=postgres -p 54329:5432 postgres:15

# 2. Stub schema, then the real migration(s) under test.
#    pg_net is not installable in the plain postgres image and fixture.sql already
#    stubs net.http_post, so drop the CREATE EXTENSION line when loading a migration.
docker exec -i cleard-pg psql -v ON_ERROR_STOP=1 -U postgres < scripts/local-test/fixture.sql
sed '/CREATE EXTENSION IF NOT EXISTS pg_net/d' supabase/migrations/20260805120000_intake_validator.sql \
  | docker exec -i cleard-pg psql -v ON_ERROR_STOP=1 -U postgres

# 3. Vault secrets the trigger reads, then the acceptance fixtures
docker exec -i cleard-pg psql -U postgres -c "insert into vault.secrets(name,secret) values
  ('edge_functions_service_role_key','test-service-key'),
  ('edge_functions_base_url','http://localhost:54331/functions/v1')
  on conflict (name) do update set secret = excluded.secret;"
docker exec -i cleard-pg psql -v ON_ERROR_STOP=1 -U postgres < scripts/local-test/seed-agent1.sql

# 4. PostgREST (JWT secret is local-only)
SECRET=super-secret-jwt-token-with-at-least-32-characters
docker run -d --name cleard-postgrest --network host \
  -e PGRST_DB_URI="postgres://postgres:postgres@localhost:54329/postgres" \
  -e PGRST_DB_SCHEMAS=public -e PGRST_DB_ANON_ROLE=anon \
  -e PGRST_JWT_SECRET="$SECRET" -e PGRST_SERVER_PORT=54330 postgrest/postgrest:v12.2.3

# 5. Mock app (REST gateway + /api routes) — SERVICE_JWT is an HS256 token with
#    {"role":"service_role"} signed with $SECRET
SERVICE_JWT=... deno run --allow-net --allow-env scripts/local-test/mock-app.ts

# 6. The function under test
SUPABASE_URL=http://localhost:54331 SUPABASE_SERVICE_ROLE_KEY="$SERVICE_JWT" \
  APP_BASE_URL=http://localhost:54331 \
  deno run --allow-net --allow-env supabase/functions/intake-validator/index.ts

curl -s -X POST http://localhost:8000 -H 'Content-Type: application/json' \
  -d '{"permit_id":"33333333-3333-3333-3333-333333333333"}'   # compliant  → green
curl -s -X POST http://localhost:8000 -H 'Content-Type: application/json' \
  -d '{"permit_id":"44444444-4444-4444-4444-444444444444"}'   # expired GC → red
```

## Agent 2 — document-generation

```bash
sed '/CREATE EXTENSION IF NOT EXISTS pg_net/d' supabase/migrations/20260805130000_document_generation.sql \
  | docker exec -i cleard-pg psql -v ON_ERROR_STOP=1 -U postgres
docker exec -i cleard-pg psql -v ON_ERROR_STOP=1 -U postgres < scripts/local-test/seed-agent2.sql
docker exec -i cleard-pg psql -U postgres -c "notify pgrst, 'reload schema';"

SUPABASE_URL=http://localhost:54331 SUPABASE_SERVICE_ROLE_KEY="$SERVICE_JWT" \
  deno run -A --config supabase/functions/deno.json supabase/functions/document-generation/index.ts

# fully-populated permit -> 2-form bundle, no notification
curl -s -X POST http://localhost:8000 -H 'Content-Type: application/json' \
  -d '{"permit_id":"33333333-3333-3333-3333-333333333333"}'
# permit missing owner_name / company_address -> un-fillable notification
curl -s -X POST http://localhost:8000 -H 'Content-Type: application/json' \
  -d '{"permit_id":"55555555-5555-5555-5555-555555555555"}'
```

`signed_url` in the response is downloadable straight from the mock storage
(`curl "$signed_url" -o bundle.pdf`). The trigger is exercised with a status
transition rather than an insert:

```bash
docker exec -i cleard-pg psql -U postgres \
  -c "update public.permits set validation_status='amber' where id='55555555-5555-5555-5555-555555555555';" \
  -c "update public.permits set validation_status='green' where id='55555555-5555-5555-5555-555555555555';" \
  -c "select url, body->>'permit_id' from net.sent_requests;"
```

Assert the trigger itself fired (it records its pg_net call instead of sending it):

```bash
docker exec -i cleard-pg psql -U postgres -c "select url, body->>'permit_id' from net.sent_requests;"
```

What is real here and what is not:

- Postgres, the migrations, the triggers, RLS grants, PostgREST, and supabase-js are real.
- `net.http_post` is a stub that records into `net.sent_requests`.
- `/api/geocode-census` proxies to the real US Census geocoder.
- `/api/verify-license` is a fixture: `myfloridalicense.com` answers server-side
  requests with a `302` and no body, so the live DBPR checker returns `unknown`
  from any automated caller.
- No `LOVABLE_API_KEY` locally, so the model-written summary falls back to the
  deterministic one. The status is identical either way — the model never decides it.

## Agent 4 — pre-submission-check

```bash
psql < scripts/local-test/seed-agent4.sql          # fixtures + service_fee_invoices
deno run -A scripts/local-test/make-plan-pdfs.ts   # sheet-size + letter-size plan sets
psql < supabase/migrations/20260805150000_pre_submission_check.sql   # re-run: the RLS policy
                                                   # needs permit_in_current_tenant from the seed

APP_BASE_URL=http://localhost:54331 SUPABASE_URL=http://localhost:54331 \
SUPABASE_SERVICE_ROLE_KEY=$(cat /tmp/service.jwt) \
deno run -A supabase/functions/pre-submission-check/index.ts

# 6666… complete -> pass; 7777… identical but signature still 'sent' -> blocked
curl -s -X POST http://localhost:8000 -H 'Content-Type: application/json' \
  -d '{"permit_id":"66666666-6666-6666-6666-666666666666"}'
curl -s -X POST http://localhost:8000 -H 'Content-Type: application/json' \
  -d '{"permit_id":"77777777-7777-7777-7777-777777777777"}'
```

Point a permit's plan doc at `99999999-…/plans.pdf` (letter-size) to see the format
check reject it, and set `service_fee_invoices.status='pending'` / an unknown licence
number to see those blocks. The provider-truth guard:

```bash
# 'provider' from a browser role is rejected; from service_role it is accepted
psql -c "set role authenticated; insert into public.signature_requests
  (permit_id, document_name, recipient_email, status, status_source)
  values ('66666666-6666-6666-6666-666666666666','forged','x@y.com','signed','provider');"
```

`plans_format` is deterministic (pdf-lib page count + sheet dimensions); the
claude-haiku-4-5 call is advisory text only and is skipped entirely without
`LOVABLE_API_KEY`.

## SignWell — signwell-send + signwell-webhook

The retry policy and the event-hash scheme are covered by unit tests, no rig needed:

```bash
deno test -A supabase/functions/_shared/signwell_test.ts
```

The rest runs against the local rig with a mock SignWell API, so no real
`SIGNWELL_API_KEY` is involved:

```bash
sed '/CREATE EXTENSION IF NOT EXISTS pg_net/d' supabase/migrations/20260805160000_signwell_integration.sql \
  | docker exec -i cleard-pg psql -v ON_ERROR_STOP=1 -U postgres
docker exec -i cleard-pg psql -U postgres -c "notify pgrst, 'reload schema';"

# The webhook id is the HMAC key; register one locally.
docker exec -i cleard-pg psql -U postgres -c "insert into public.signwell_webhooks (id, callback_url)
  values ('hook_local_test','http://localhost:54331/functions/v1/signwell-webhook') on conflict do nothing;"

# signwell-send against a mock that 429s once, then succeeds (proves the retry path,
# the X-Api-Key header, and that the embedded_signing_url is stored)
SIGNWELL_BASE_URL=http://localhost:8200/api/v1 SIGNWELL_API_KEY=local-test-key \
SIGNWELL_TEST_MODE=true SUPABASE_URL=http://localhost:54331 \
SUPABASE_SERVICE_ROLE_KEY=$(cat /tmp/service.jwt) \
  deno run -A supabase/functions/signwell-send/index.ts

# signwell-webhook: hash = HMAC-SHA256(webhook_id, "<type>@<time>")
HASH=$(python3 -c "import hmac,hashlib;print(hmac.new(b'hook_local_test',b'document_completed@1700000200',hashlib.sha256).hexdigest())")
curl -s -X POST http://localhost:8000 -H 'Content-Type: application/json' \
  -d "{\"event\":{\"type\":\"document_completed\",\"time\":1700000200,\"hash\":\"$HASH\"},
       \"data\":{\"object\":{\"id\":\"doc_local_1\",\"status\":\"Completed\"}}}"
```

Observed locally: a wrong hash → `401 invalid event hash` with no write;
`document_signed` → `provider_confirmed: false` (status untouched, event recorded);
`document_completed` → row `signed / provider_confirmed` + `activity_events` entry; a
replayed event → `duplicate: true` and no second write. `provider_confirmed` and the
SignWell identifier columns are rejected for the `authenticated` role by the ledger
trigger. pre-submission-check blocks a staff-attested signature ("marked signed but not
confirmed by SignWell") and passes only once the webhook has confirmed it.

## Agent 5 — municipality-submit + the portal worker

Approval-gate tests need no browser; the portal driver is exercised against
`fake-aca.ts`, a local stand-in for an Accela Citizen Access install, so nothing is ever
filed with a real building department.

```bash
sed '/CREATE EXTENSION IF NOT EXISTS pg_net/d' supabase/migrations/20260805170000_municipality_submit.sql \
  | docker exec -i cleard-pg psql -v ON_ERROR_STOP=1 -U postgres
docker exec -i cleard-pg psql -v ON_ERROR_STOP=1 -U postgres < scripts/local-test/seed-agent5.sql
docker exec -i cleard-pg psql -U postgres -c "notify pgrst, 'reload schema';"

deno test supabase/functions/_shared/submission-draft_test.ts     # draft + confirmation parsing

# pre-submission-check must be reachable, so run it on its own port and point the
# submitter at it (SUPABASE_FUNCTIONS_URL).
SUPABASE_URL=http://localhost:54331 SUPABASE_SERVICE_ROLE_KEY="$SERVICE_JWT" \
SUPABASE_FUNCTIONS_URL=http://localhost:8001 \
  deno run -A supabase/functions/municipality-submit/index.ts

curl -s -X POST localhost:8000 -H 'Content-Type: application/json' \
  -d '{"action":"draft","permit_id":"77777777-7777-7777-7777-777777777777"}'   # 409, nothing drafted
curl -s -X POST localhost:8000 -H 'Content-Type: application/json' \
  -d '{"action":"draft","permit_id":"66666666-6666-6666-6666-666666666666"}'   # draft_pending_approval
curl -s -X POST localhost:8000 -H 'Content-Type: application/json' \
  -d '{"action":"execute","submission_id":"<id>"}'                             # 409 until approved
```

Approve as a staff member through PostgREST (an `authenticated` JWT whose `sub` has the
admin role); a GC JWT must be refused:

```bash
curl -s -X POST http://localhost:54330/rpc/approve_municipality_submission \
  -H "Authorization: Bearer $STAFF_JWT" -H 'Content-Type: application/json' \
  -d '{"_submission_id":"<id>","_note":"Reviewed plans + fee"}'
docker exec cleard-pg psql -U postgres -c "select url, body->>'action' from net.sent_requests;"
```

Portal worker (Node 22+, `npm run portal-worker`) against the fake ACA:

```bash
deno run --allow-net --allow-env --allow-read scripts/local-test/fake-aca.ts   # :54340
docker exec cleard-pg psql -U postgres -c "update public.municipality_submission_targets
  set portal_url='http://localhost:54340/CitizenAccess/Default.aspx' where slug='plantation';"
# store aca-user / aca-pass in gc_portal_logins, encrypted with the same AES-256-GCM
# format src/lib/portal-logins-crypto.server.ts uses, then:
SUPABASE_URL=http://localhost:54331 SUPABASE_SERVICE_ROLE_KEY="$SERVICE_JWT" \
APP_USER_CONNECTION_KEY_SECRET="$KEY" npm run portal-worker -- --once [--dry-run]
```

Observed locally: the worker finds nothing while the draft is unapproved ("no approved
portal submissions waiting"); after approval it claims the row, logs in with the decrypted
credentials, uploads all three documents, and records `26BLD-004512` from the receipt.
`--dry-run` stops before Submit and returns the row to `approved`. With
`ACA_NO_RECORD_NUMBER=1` the row is `submitted` with no confirmation number and an explicit
`last_error` instead of an invented one. Wrong stored credentials → `failed`, approval
retained, staff notified, nothing filed. The email channel (seeded `davie` target) queues
into `email_outbox` with three attachments only after approval.

## Agent 6 — status polling (check_permit_status + the status worker)

`fixture.sql` stubs `cron.schedule/unschedule` into a `cron.job` table, so the migration's
schedules apply unchanged locally and can be asserted exactly the way the live jobs are
(`select * from cron.job`). pg_cron itself is not installable in the plain postgres image.

```bash
sed -e '/CREATE EXTENSION IF NOT EXISTS pg_net/d' \
    -e "/IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')/,+2d" \
    supabase/migrations/20260806120000_permit_status_polling.sql \
  | docker exec -i cleard-pg psql -v ON_ERROR_STOP=1 -U postgres
docker exec -i cleard-pg psql -v ON_ERROR_STOP=1 -U postgres < scripts/local-test/seed-agent6.sql
docker exec -i cleard-pg psql -U postgres -c "notify pgrst, 'reload schema';"

deno test supabase/functions/_shared/portal-status_test.ts   # status/correction parsing

docker exec cleard-pg psql -U postgres \
  -c "select jobname, schedule, command from cron.job;" \
  -c "select public.check_permit_status();" \
  -c "select id, status from public.permit_status_polls;"

# the poller itself, against fake-aca's record pages
ACA_RECORD_STATUS="Corrections Required" ACA_CORRECTIONS=1 \
  deno run --allow-net --allow-env scripts/local-test/fake-aca.ts     # :54340
SUPABASE_URL=http://localhost:54331 SUPABASE_SERVICE_ROLE_KEY="$SERVICE_JWT" \
APP_USER_CONNECTION_KEY_SECRET="$KEY" npm run status-worker -- --once
```

Observed locally, in this order:

- `cron.job` holds `check-permit-status` (`0 */4 * * *`) and `permit-status-daily-digest`
  (`0 12 * * *`).
- `check_permit_status()` enqueues one poll for the filed permit and **zero** on the next
  call (nothing is checked twice within the interval, and a wedged poll cannot pile up).
- Worker run against `Corrections Required` + a linked letter: permit → `corrections_required`,
  `permit_status_history` row, staff notification, the letter downloaded into
  `permits/<id>/corrections/…pdf`, and one `correction_notices` row (Agent 7's trigger).
- Re-polling the same status: `{"changed": false}` — no duplicate notice, history row or
  notification.
- Worker run against `Issued`: permit → `permit_issued`, and `check_permit_status()` then
  enqueues nothing (terminal states stop being polled).
- Unknown status text (`Zoning Escalation Tier 2`): permit untouched, staff notified that
  it is unmapped — the status is never guessed.
- Record not found (`26BLD-999999`): poll `failed` with the reason, permit untouched, staff
  notified; the next scheduled run retries.
- `permit_status_digest()` returns `moved`, `stuck` (filed, unchanged >7 days) and
  `check_failing` rows; `send_permit_status_digest()` notifies staff once a day.
- `authenticated` is refused on `claim_permit_status_poll` and `apply_permit_status_check`,
  and can only insert a `correction_notices` row as staff with `source='staff_upload'`.
