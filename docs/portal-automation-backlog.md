# Portal automation backlog

Municipalities we hold building-department credentials for whose portal is **not** Accela Citizen
Access, so neither the submission worker
(`scripts/portal-worker/municipality-submit-worker.ts`) nor the status worker
(`scripts/portal-worker/permit-status-worker.ts`) can drive them. Nothing here is automated; staff
file and check these by hand.

Each vendor needs its own login + navigation driver, and each one is a new place a headless browser
can blunder through a CAPTCHA, an MFA prompt or an "invalid login" page. That is a per-vendor
decision to take deliberately, not a batch of scripts to write speculatively.

## Tyler EnerGov (Self Service)

Three cities, one vendor — the highest-value driver to build first, since one EnerGov driver covers
all three.

| City               | County     | Portal                                                                       |
| ------------------ | ---------- | ---------------------------------------------------------------------------- |
| Palm Beach Gardens | Palm Beach | https://palmbeachgardensfl-energovweb.tylerhost.net/apps/SelfService#/home   |
| Miami Beach        | Miami-Dade | https://energovcss.miamibeachfl.gov/energovprod/selfservice#/home            |
| Hallandale Beach   | Broward    | https://energovpub.tylerhost.net (sheet gives the host only, no tenant path) |

Notes: EnerGov Self Service is an Angular SPA behind a hash route, so navigation is client-side and
selectors are Tyler's, not the city's — a driver would look nothing like `acaLogin()`. Hallandale
Beach's exact tenant URL needs confirming before anything can be pointed at it.

## CityView

| City     | County     | Portal                                                |
| -------- | ---------- | ----------------------------------------------------- |
| Westlake | Palm Beach | https://cityviewportal.westlakegov.com/Permit/Locator |

## No portal URL in the sheet

We hold credentials for these but no link, so the portal software is unknown. Someone needs to
record the URL each login is actually used against before automation can even be assessed:

Greenacres, Jupiter, Palm Beach County, Wellington, Ft. Lauderdale, Port St. Lucie, Port St. Lucie
Public Works, West Palm Beach, Boca Raton, Miami-Dade (RER Class I), Oakland Park, Weston, Wilton
Manors, Davie, Boynton Beach, Ft Myers, Doral, Parkland, North Palm Beach, Tequesta, St. Lucie
County, and the "ProjectDocx" login (a document system, not a jurisdiction).

The sheet also lists Coral Springs, Miramar, Pembroke Pines, Royal Palm Beach and Lighthouse Point
without a usable username/password pair, so we have no credential for them at all.

## What is automated today

| City          | Driver       | Enabled                                |
| ------------- | ------------ | -------------------------------------- |
| Plantation    | `accela_aca` | yes (pilot)                            |
| Martin County | `accela_aca` | no — staged, needs a staff walkthrough |
| Sunrise       | email intake | no — example row                       |

Enabling a target is a manual decision per city
(`municipality_submission_targets.enabled`), and it does not bypass the approval gate: a package
still only leaves the building after a staff member approves it
(`approve_municipality_submission()`), and the worker refuses to file anything that is not
`approved`.
