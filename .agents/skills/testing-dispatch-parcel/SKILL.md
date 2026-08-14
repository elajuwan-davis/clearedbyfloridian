---
name: testing-dispatch-parcel
description: How to run and end-to-end test the Cleard permit-intake Dispatch card (flood zone + FDOR/PAPA parcel lookup) locally, including the Google-Maps and Vite gotchas that otherwise make the dispatch card silently show mock data.
---

# Testing the Dispatch / parcel-lookup flow

## Running the app

- Node 22 + bun are required: `export PATH=$HOME/.nvm/versions/node/v22.23.2/bin:$HOME/.bun/bin:$PATH`,
  then `bun run dev` (fixed port **8080**). Vite refuses Node 20.
- If Vite dies with `Error: Cannot find native binding`, the `@oxc-parser/binding-linux-x64-gnu`
  package is missing from `node_modules`. Re-run `bun install --frozen-lockfile`; if the guard in
  `bunfig.toml` (`minimumReleaseAge`) skips it, download the exact matching version of the binding
  and drop it into `node_modules/@oxc-parser/` — do NOT edit `package.json`/`bun.lock`.
- Login: credentials for the pre-confirmed admin account live in `/home/ubuntu/cleard-e2e/.env`
  (`TEST_EMAIL` / `TEST_PASSWORD`). Do not delete that account or the test permit.

## Reaching the Dispatch card

The card lives at `/portal/permits/new` → *Property Address* → resolve the address.
`handleAddressResolved` in `src/routes/portal.permits.new.tsx` is what calls `runDispatch`.

Typing the full address (`2300 Virginia Ave, Fort Pierce, FL 34982`) into the field and pressing
Enter is enough: the form keeps only the street line in the input but dispatches the full
`r.formatted` address. On a checkout that has PR #25, live FDOR data reaches the card with **no
local edits at all** — if you find yourself needing to patch app code to see live data, that is a
regression, not a setup step.

Three gotchas that make this look "broken" or silently fake:

1. **Which address provider renders** depends on `VITE_GOOGLE_MAPS_API_KEY`: with no key,
   `activeProvider()` in `src/lib/address-lookup.ts` returns `"census"` and the field shows a
   *Look up* button (this is the reliable mode — a fresh clone's `.env` has no key). If a key IS
   present, Google Places may still not load (referrer-restricted) and the field never resolves;
   setting `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY=""` in `.env.local` did NOT reliably
   switch providers, so prefer testing from a clone whose `.env` has no browser key.
2. **A "Preview data" badge means the card is fabricated.** `runDispatch` took its
   `if (!base) return buildMock(...)` branch, i.e. `SUPABASE_URL` was `undefined` in the browser and
   no network call happened (the mock even produces negative assessed values). Historically this was
   caused by reading the env through an alias (`const env = import.meta as any`), which Vite does not
   inline; the module must reference `import.meta.env.VITE_SUPABASE_URL` literally. **Always check
   for the badge before believing any value in the Dispatch card.**
3. **The hosted `dispatch-parcel` edge function is deployed out of band and is often stale.** The
   browser can therefore show old *matching* behaviour even on freshly-pulled code. Client-side
   things (live-vs-mock, formatting such as the roll-year suffix) are provable in the UI; the
   matching heuristics in `_shared/statewide-parcels.ts` are not — probe the checked-out source
   directly instead, and say plainly in the report which part is stale.

## Testing the edge function without secrets

`supabase/functions/dispatch-parcel/index.ts` only needs a service-role key for its Supabase
*insert*; the geocode + ArcGIS lookups need nothing. Run the real handler under Deno with an import
map that stubs `@supabase/supabase-js` with an object whose `.from().insert().select().single()`
echoes the row back, or import `lookupStatewideParcel` from `_shared/statewide-parcels.ts` directly.
Harness examples live in `/home/ubuntu/parcel-test/` (`router.ts`, `probe.ts`, `probe2.ts`,
`diag.ts`, `supabase-stub.ts`). `probe2.ts` takes the module path in `MOD=`, so the same probe can
be run against two revisions for a diff:

```
git worktree add /tmp/wt <branch>            # keeps the dev server serving main
MOD=/tmp/wt/supabase/functions/_shared/statewide-parcels.ts \
  deno run -A probe2.ts "1-3 Harbour Isle Dr W, Fort Pierce, FL 34949"
```

Useful endpoints:
- statewide FDOR: `https://services9.arcgis.com/Gh9awoU677aKree0/arcgis/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query`
- Palm Beach PAPA: `https://gis.pbcgov.org/arcgis/rest/services/Parcels/PARCEL_INFO/MapServer/4/query`
- the ArcGIS layer intermittently times out; a `The operation was aborted due to timeout` is an
  upstream flake, not necessarily a code bug — retry before reporting.

## What to probe adversarially

Parcel matching can return a *neighbour's* parcel, which is the worst failure mode. Always check the
returned `PHY_ADDR1` against the address you asked about, not just "did we get a parcel".
High-yield inputs: hyphenated house numbers (`1-3 Harbour Isle Dr W`), condo/unit stacks, addresses
typed without a directional in a quadrant-gridded city (`100 2nd St` in Fort Pierce has both
`100 N 2ND ST` and `100 S 2ND ST` within 40 m), spelled-out ordinals (`First` vs `1st`), corner lots,
PO boxes and unnumbered streets.

Known-useful fixtures (values as of the 2025 roll): `2300 Virginia Ave, Fort Pierce` →
`2416-504-0770-000-8` / St Lucie County (control, always matches); `1556 16th Ave, Vero Beach` →
`33391100001002000014.0` / DOYLE MARGARET M; `101 SE Ocean Blvd, Stuart` → a parcel with
`assessment_year` set but **`assessed_value` null** (the fixture for "roll year must not print
without a value"); `10 Golfview Rd, Palm Beach` → `50434326020000092` / JAMES WILLIAM ELLERY &
(matches PAPA's PCN, though it arrives via the statewide fallback, not the PAPA path).

Caveats seen in practice: a `point_in_polygon` hit was once accepted without any address check
(mis-geocoded points returned the wrong owner silently) — re-verify this guard exists on whatever
branch you test. Condo stacks still resolve to an arbitrary unit of the right building
(`18 Harbour Isle Dr W` → `18 HARBOUR ISLE DR W 201`, `ambiguous_candidates: 23`), so the owner shown
may belong to a different unit. And a stricter matcher can *lose* correct answers: rejecting
provisional matches whenever a rival exists within 40 m turned a correct
`100-102 SE Ocean Blvd` → `100 SE OCEAN BLVD` hit into "unavailable". Report both directions.

## Devin Secrets Needed

None. The hosted `SUPABASE_SERVICE_ROLE_KEY` / `LOVABLE_API_KEY` are Lovable-managed and not
required for any of the above; the test login comes from `/home/ubuntu/cleard-e2e/.env` on the box.
