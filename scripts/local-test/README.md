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

## Degraded-path checks (added after review)

```bash
# address lookup outage -> amber, not red
cat > /tmp/outage.ts <<'TS'
Deno.serve({ port: 54334 }, (req) =>
  new URL(req.url).pathname === "/api/geocode-census"
    ? Response.json({ matches: [], error: "Lookup service unreachable." })
    : Response.json({ license_number: "x", status: "active", expiration: "2030-01-01" }));
TS
deno run --allow-net /tmp/outage.ts &
APP_BASE_URL=http://localhost:54334 ... deno run -A supabase/functions/intake-validator/index.ts

# no admin recipient -> notified 0 and an explicit console error, no rejected insert
docker exec -i cleard-pg psql -U postgres -c "delete from public.user_roles where role='admin';"
```
