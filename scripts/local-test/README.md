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
