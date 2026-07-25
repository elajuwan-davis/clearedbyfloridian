
# Multi-Tenant GC Access — Foundational Auth & Isolation

This is a large, cross-cutting change. Below is the build sequence. I'll implement in this order once you approve.

## 1. Data model (one migration)

New tables in `public`:
- `tenants` — id, name, license_number, service_areas (text[]), primary_coi_path, primary_license_path, status ('active'|'suspended'), created_at/updated_at.
- `tenant_members` — tenant_id, user_id, role ('gc_owner'|'gc_member'), unique(user_id) — a user belongs to one tenant.
- `app_role` enum: `admin`, `gc_owner`, `gc_member`, `subcontractor`.
- `user_roles` (user_id, role) — separate table (never on profiles) per security rules.
- `sub_accounts` — links `auth.users` → `subcontractors.id` (so a sub user can be matched to their sub records across tenants by email/company).

New columns (nullable initially, backfilled, then NOT NULL):
- `tenant_id uuid references tenants(id)` on: `permits`, `subcontractors`, `design_professionals`, `prior_permits`, `submissions`, `nto_filings`, `gc_coi_minimums`, `gc_portal_logins` (already user-scoped — add tenant_id for team sharing), `blog_posts` stays global, `access_requests` gets `approved_tenant_id`.

Security-definer helpers (SET search_path = public):
- `has_role(_user uuid, _role app_role) returns boolean`
- `current_tenant_id() returns uuid` — reads from `tenant_members` for `auth.uid()`
- `is_admin() returns boolean` — wraps has_role admin
- `sub_can_see_permit(_permit uuid) returns boolean` — checks if `auth.uid()` matches a confirmed sub row in `permits.subs` jsonb (by email).

## 2. RLS rewrite

Replace the current `auth.uid() IS NOT NULL` policies with tenant-scoped policies on every tenant table:

```
SELECT: is_admin() OR tenant_id = current_tenant_id() OR (subcontractor: sub_can_see_permit(id) for permits only)
INSERT: is_admin() OR tenant_id = current_tenant_id()
UPDATE/DELETE: is_admin() OR tenant_id = current_tenant_id()
```

Subs get a narrower permits SELECT policy limited to sanitized fields via a view or handled in sub-portal server fn (already token-gated; we'll switch it to auth-gated too).

`access_requests`: anon INSERT stays; SELECT/UPDATE/DELETE = admin only.
`tenants` / `tenant_members` / `user_roles`: admin-only writes; users can SELECT their own row.

Grants updated on every touched table per the public-schema rule.

## 3. Auth flows

**Sign-up (GC request):** `/join` form already writes to `access_requests`. Add service_areas capture.

**Admin approval:** New `/admin/access-requests` page (already have `admin.tsx` shell). Approve button → server fn:
1. Creates `tenants` row
2. Calls `supabase.auth.admin.inviteUserByEmail(email, { redirectTo: /onboarding })`
3. Inserts `tenant_members(user_id, tenant_id, 'gc_owner')` + `user_roles(user_id, 'gc_owner')` on first sign-in (via `handle_new_user` trigger reading invite metadata).

**GC onboarding:** `/onboarding` route — confirm company, upload COI/license (writes to `tenants`), set password, redirect to `/portal`.

**Login:** `/login` already exists; extend to route by role:
- admin → `/admin`
- gc_owner/gc_member → `/portal`
- subcontractor → `/sub-portal` (new authenticated wrapper; existing token route stays for pre-account subs)

**Team invite:** In `/portal/profile`, add "Team" section. Owner enters email → server fn calls `admin.inviteUserByEmail` with metadata `{ tenant_id, role: 'gc_member' }`.

**Sub invite:** When a sub is added to a permit and marked confirmed, an admin-triggered server fn invites them by email; on accept, `user_roles = subcontractor` and their auth.uid is stored on `sub_accounts`.

## 4. Admin impersonation

- Admin dashboard shows a tenant switcher (dropdown of all tenants).
- Selection stored in `sessionStorage` + a signed cookie read by server fns.
- Server fns that read tenant data check: if `is_admin()` and `x-impersonate-tenant` header set, use that tenant_id; otherwise use `current_tenant_id()`.
- Banner in `portal-shell.tsx`: "Viewing as: {tenant.name}" with "Exit impersonation" button.

## 5. Sub portal (authenticated)

New `/sub-portal` route (authed). Shows only permits where `sub_can_see_permit` allows. Existing `sub-portal.$token` remains for the initial email-token flow (upgrade path: token link → set password → authed portal).

## 6. UI changes

- `src/components/portal-shell.tsx`: show logged-in tenant name in header. For admin, show impersonation banner + switcher.
- `useSession` hook exposing `{ user, role, tenantId, tenantName, isAdmin, impersonatingTenantId }`.
- Route guards: `/portal/*` requires gc_owner/gc_member (or admin impersonating). `/admin/*` requires admin. `/sub-portal/*` requires subcontractor.
- Hide financials/municipality logins/NTBO from sub role in existing components (guarded by role, not just token).

## 7. Backfill

One-time migration: create a "Legacy" tenant, assign all existing permits/subs/etc. to it, assign all existing authenticated users as gc_owner of Legacy. Admin emails (`elajuwan@`, `eman@`, `jose@`, `paul@floridianinc.com`) auto-assigned admin role via trigger on `handle_new_user`.

## Assumptions (please correct if wrong)

1. **One user = one tenant.** No user belongs to multiple GC companies. If a user needs access to two GCs, they use two email addresses. (Simpler RLS; can relax later.)
2. **Existing data → single "Legacy" tenant** owned by an admin, migrated over during the migration. Real GC tenants created going forward.
3. **Sub identity = email match.** A sub user's `auth.email` must match `subcontractors.email` to see the projects they're on. Same email across multiple GCs works — they see all their attached projects.
4. **Team invite emails** go through Supabase Auth's built-in invite (no custom template needed for MVP).
5. **Admin panel already exists** at `/admin` — I'll extend it, not rebuild.
6. **`/onboarding`** is a new route; existing `/portal/profile` stays for ongoing profile edits.

## Out of scope (flag for later)

- Billing per tenant, SSO/SAML, custom subdomains per tenant, granular gc_member permissions beyond "can't manage team/billing", audit log.

## Delivery

Given the size, I'll ship in two turns after approval:

**Turn A** — Migration (tenants, roles, RLS, backfill), auth helpers, role-aware routing, admin approval flow, tenant name in header.

**Turn B** — Team invites, sub invite/auth upgrade, admin impersonation banner + switcher, sub-role UI gating across existing pages.

Approve or adjust any assumption and I'll start with Turn A.
