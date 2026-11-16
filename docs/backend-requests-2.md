# Backend requests from WorkBeat Admin — round 2

> **Answered (16 Nov 2026)** in `WorkBeat-Backend/docs/integration/admin-requests-2-response.md`: staff TOTP, password reset and sign-in rate limits are built (B22–B25), and the backend openspec is updated. The specs now use them. Section 3 field names are confirmed for when the staff API lands.

**From:** the web platform (WorkBeat Admin) specs, `WorkBeat-Admin/docs/openspec/`
**To:** the backend owner, WorkBeat-Backend
**Date:** 16 November 2026
**Follows:** [backend-requests.md](backend-requests.md) (round 1). It was answered in
`WorkBeat-Backend/docs/integration/admin-requests-response.md` (commit `6eb34ff`). Every round-1
item is either live or agreed for the staff API. The admin specs now use all of them.

These are the last answers the admin specs need. The company pages are fully specified; what is
left is staff sign-in, password recovery and the backend's own specs.

---

## 1. Needed before the specs can be finished (blocking)

### 1.1 Staff MFA
- **Why:** Plan v3.5 D41 and §4.6 require MFA for every staff (`super_admin`) sign-in. The old
  design used Supabase `aal2`. With Supabase gone (16 Nov) there is no design.
- **Ask:** decide and specify:
  1. The method. TOTP (authenticator app) is the suggestion.
  2. Enrolment routes: start enrolment (returns the secret or QR data) and confirm with a first code.
  3. The challenge: what `POST /v1/auth/login` returns for a staff user before the second factor.
     For example `{ mfa_required: true, mfa_token }` with no session, then
     `POST /v1/auth/mfa/verify { mfa_token, code }` → `{ token, expires_at, user }`.
  4. Recovery when a staff member loses their device. For example, another `super_admin` resets
     their factor.
  5. The code for "wrong MFA code", and whether attempts are rate-limited.
- **Today in the admin spec:** the staff MFA requirement says "the API's staff MFA routes (not yet
  specified)". The staff area can't be built until this is answered.

### 1.2 Staff sign-in route
- **Ask:** confirm that `super_admin` signs in through the same `POST /v1/auth/login`, and that
  `GET /v1/me` returns `company: null` for them, as `user-authentication` specifies.
  The staff API is not built yet, so this is unconfirmed.

### 1.3 Bring the backend openspec up to date
- **Why:** the admin specs cite backend capabilities as the contract (config: "routes, fields,
  roles and codes are fixed in WorkBeat-Backend/docs/openspec"). The backend's own rule 10 is
  "spec before code". Today the 16 Nov additions exist only in code, `apps/api/README.md` and the
  reply document. The specs still describe Supabase.
- **Ask:** spec deltas for:
  - `user-authentication`:
    - `POST /v1/auth/login`, `/logout` and `/password`, with their codes;
    - the session token (`wbs_…`, 7 days) and what ends it (logout, password change, user removed);
    - `POST /v1/invitations/accept` returning a session;
    - the Supabase wording removed.
  - `user-authentication`: `company.timezone` on `GET /v1/me`.
  - `employee-directory`: `presence` (values and order of the rule), `devices`, and the
    `manager_user_id` filter.
  - `device-status`: the `health` fields; `released_at` and `deactivated_at` on list rows.
  - `usage-reports`: `group_by` and `periods`.
  - `alerts-feed`: the `{ items, next_cursor, counts }` shape and the `employee_id` filter.
  - `block-rules`: `created_by_name`.
  - `agent-updates` (or a new capability): `GET /v1/agent-versions`.
- **Today in the admin spec:** source comments cite "backend reply 16 Nov 2026". They will be
  switched to the capability names once these exist.

---

## 2. Needs a decision (non-blocking)

### 2.1 Password reset
- **Today:** the API has login, logout and change password, but no "forgot password".
- **Ask:** one of these:
  - **(a)** Add `POST /v1/auth/password-reset/request { email }`. It should always answer `204`
    and email a link. Add `POST /v1/auth/password-reset/confirm { token, new_password }`.
    Single-use token, short expiry, ends other sessions.
  - **(b)** Confirm there is no self-service reset, and say what a locked-out user does. For
    example, a Company Admin removes and re-invites them. For the last Company Admin, WorkBeat
    support does it.
- **Today in the admin spec:** the sign-in page has no "Forgot password" link.

### 2.2 Sign-in protection
- **Ask:** confirm how repeated wrong passwords are handled on `POST /v1/auth/login`: rate limit
  (`429 RATE_LIMITED`), lockout, or both. The page needs to know which message to show.

---

## 3. Check when the staff API is built (agreed in round 1)

No new ask. Please confirm the exact field names when these land, so the specs match:

| Round 1 | Route | Fields the admin spec assumes |
|---|---|---|
| 1.4 | `POST /v1/staff/agent-releases/upload-url` | in: `product`, `platform`, `arch`, `version`; out: `upload_url`, `storage_path`, `expires_at` |
| 2.8 | `POST /v1/staff/invitations/:id/resend` | same rules and codes as the company team's resend |
| 2.9 | `custom_domain_checked_at` on `GET /v1/staff/companies` | ISO timestamp or `null` |

---

## Not for the backend

- **macOS uninstall command:** for the Mac agent owner. Plan §5.4 gives only the Windows form.
  Until then the Deployment page shows the Windows command only.
