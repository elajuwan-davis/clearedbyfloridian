# Importing a spreadsheet of building-department logins

One-off migration tool: takes the "Building Department Login" workbook (or a CSV of the same
shape) and writes each row into `gc_portal_logins`, encrypted the same way the
`/building-dept-logins` form does. It runs on an operator's machine, never on Lovable — the
spreadsheet holds live portal credentials and should not be uploaded anywhere.

## Before you run it

You need both server secrets from Lovable Cloud, plus the project URL:

```bash
export SUPABASE_URL='https://<project-ref>.supabase.co'
export SUPABASE_SERVICE_ROLE_KEY='...'          # Lovable Cloud → project secrets
export APP_USER_CONNECTION_KEY_SECRET='...'     # same key the app encrypts with
```

If `APP_USER_CONNECTION_KEY_SECRET` is not the key the app uses, every imported credential
decrypts to garbage and the portal workers will report rejected logins. Copy it, don't invent it.

Keep the workbook outside the repo (`~/Downloads` is fine). `.gitignore` covers `*.xlsx` as a
backstop, but the safest habit is to never put it in the working tree.

## Dry run first (the default)

```bash
bun install
bun run import-portal-logins -- ~/Downloads/Building\ Department\ Login.xlsx \
  --user-email=gc@example.com
```

Nothing is written without `--apply`. You get a table of `ROW | CITY | STATUS | DETAIL` — no
usernames, no passwords, so the output is safe to paste into Slack or a ticket. Statuses:

| status   | meaning                                                                     |
| -------- | --------------------------------------------------------------------------- |
| `import` | complete row, city resolved against the municipality catalog                |
| `skip`   | no username and/or password in the sheet — nothing to store                 |
| `error`  | needs a human: unknown city, duplicate city, or two credentials in one cell |

Fix what you can in the spreadsheet and re-run. Common cases:

- **"not in the municipality catalog"** — the city is missing from
  `src/lib/municipalities-data.ts`, or spelled differently. Add it to the catalog (preferred, so
  the rest of the app knows the jurisdiction too), correct the sheet, or pass
  `--allow-unmatched` to store it under its literal slug.
- **"duplicate of row N"** — `gc_portal_logins` is `UNIQUE (user_id, municipality_slug)`, so two
  accounts for one jurisdiction cannot both be stored under one user. Decide which one the vault
  should hold, or attribute the second to a different user with a separate run.
- **"credentials with no city"** — a second login written underneath the row it belongs to. Give
  it its own city cell or drop it.

## Apply

```bash
bun run import-portal-logins -- ~/Downloads/Building\ Department\ Login.xlsx \
  --user-email=gc@example.com --apply
```

Each row is upserted on `user_id,municipality_slug`, exactly like `savePortalLogin()`, so
re-running is safe: an existing row for that city is updated, not duplicated.

Other flags: `--user-id=<uuid>` instead of the email lookup, `--tenant-id=<uuid>` when the user
belongs to more than one tenant, `--sheet=<name>` for a workbook with several worksheets.

## Afterwards

1. Open `/building-dept-logins` as that user and confirm the cities are listed and one reveal
   returns the right credential.
2. Delete the local spreadsheet (and any copy in the repo directory).
3. Required documents (COI, WC, BTR, …) are **not** imported — the sheet has none. Those rows
   will show as missing documents until they are uploaded through the form.

## Tests

```bash
bun run test:import-portal-logins
```

Covers the row classification, the city matching, the "no credential in the output" rule and the
encrypt/decrypt round trip against a throwaway key. No hosted Supabase and no real credentials
are involved.
