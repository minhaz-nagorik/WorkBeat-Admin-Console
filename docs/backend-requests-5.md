# Backend requests from WorkBeat Admin — round 5: create companies, temporary passwords

**From:** WorkBeat Admin (the web console) · **To:** WorkBeat-Backend · **Date:** 17 November 2026
**Follows:** round 4, answered (`admin-requests-4-response.md`).
**Decided by the product owner (17 Nov 2026):**
- WorkBeat staff create companies from the console, with a mandatory Company Admin email. That email
  receives the licence key and the link to create their account.
- Staff can reissue a Company Admin's password as a **temporary password**: shown once to the staff
  member to copy, **and** emailed to the Company Admin. Signing in with it forces the person to set
  their own password before anything else.

The console is built against the contract below and shows "not available yet" until each route
exists. Please add these to `staff-api.md` / `portal-api.md` and the specs (`staff-companies`,
`staff-accounts`, `user-authentication`), and say if any name or code differs.

---

## 1. `POST /v1/staff/companies` — create a company

Roles: `super_admin` (others `403 FORBIDDEN`).

Request:

| field | type | required | notes |
|---|---|---|---|
| name | string | yes | 1–100 characters |
| slug | string | yes | `^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$`, unique; the address `{slug}.workbeat.io` |
| plan | enum(starter\|growth\|enterprise) | yes | |
| seat_limit | int \| null | yes | ≥ 1; `null` = unlimited, only with `enterprise` |
| screenshot_tier | enum(off\|light\|standard\|intensive) | yes | |
| status | enum(trial\|active) | yes | |
| trial_days | int | when `status` = `trial` | 1–90; sets `trial_ends_at` |
| timezone | string | yes | IANA zone, `companies_timezone_check` |
| data_retention_days | int | no | 1–365, default 90 |
| admin_email | string | yes | the first Company Admin |

Response `201`: `{ company, invitation }` — `company` is a `GET /v1/staff/companies` row;
`invitation` is `{ email, expires_at }`. Never the licence key or the invitation token in the body.

Errors:

| status | code | when |
|---|---|---|
| 409 | `CONFLICT` | `slug` taken, or `admin_email` belongs to any `users` row or an open invitation; body names `fields: ["slug"]` or `["admin_email"]` |
| 422 | `VALIDATION_FAILED` | any value out of range; `fields` names each |

Notes:
- One transaction: `companies` row, its `licenses` row with a new key, and a `company_admin`
  invitation for `admin_email` (same rules and expiry as `POST /v1/team/invitations`, `invited_by` =
  the staff member).
- After commit, one email to `admin_email`: the company name, the licence key and the link
  `PORTAL_URL/invite?token=…`. The key and token are never logged.
- Staff can resend it through the existing staff `POST /v1/staff/companies/:id/license/reissue`
  (key) or by inviting again once the invitation expires — no new route asked for that.

## 2. `GET /v1/staff/company-admins` — Company Admins across companies

Roles: `super_admin`. Query: `q` (≤ 100 characters, literal, case-insensitive on name, email,
company name or slug), optional `company_id`.

Response `200`: array, newest first, enabled `company_admin` users only:

| field | type | notes |
|---|---|---|
| id | uuid | user id |
| name | string | |
| email | string | |
| company | object | `{ id, name, slug }` |
| created_at | ISO-8601 datetime | |
| must_change_password | bool | true while a temporary password is unused |

Only `company_admin` users: no manager, IT admin, employee, device or activity data (D41).

## 3. `POST /v1/staff/users/:id/temporary-password` — reissue as temporary

Roles: `super_admin`. Request: none.

Response `200` with `Cache-Control: no-store`: `{ temporary_password, expires_at }`.
`temporary_password` is server-generated (at least 12 characters, readable: no `0/O`, `1/l/I`),
returned once.

Errors: `404 NOT_FOUND` when `:id` is not an enabled `company_admin` (staff can't reset staff or
other company roles here).

Notes:
- Sets the password to the temporary one, `must_change_password` = true, a temporary-password expiry
  of **72 hours**, and revokes every session of that user.
- After commit, emails the temporary password to the user: that WorkBeat staff reset it, that it
  works once for 72 hours, and that they must choose a new password at sign-in. Never logged.
- After expiry the temporary password answers `401 UNAUTHENTICATED` like a wrong password.

## 4. Signing in with a temporary password

- `POST /v1/auth/login` and `GET /v1/me`: add `must_change_password` (bool) to `user`.
- While it is true, every route except `GET /v1/me`, `POST /v1/auth/password` and
  `POST /v1/auth/logout` answers `403 PASSWORD_CHANGE_REQUIRED`.
- `POST /v1/auth/password` with `current_password` = the temporary password and a valid
  `new_password` (10–200 characters, not equal to the temporary one → `422` naming `new_password`)
  clears the flag and the expiry; other sessions end as today; the current session stays.

---

**Reply with:** what is built (commit), any difference in names or codes, and whether the emails go
through the temporary SMTP until Resend.
