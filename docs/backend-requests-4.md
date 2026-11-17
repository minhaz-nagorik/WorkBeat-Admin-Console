# Backend requests from WorkBeat Admin — round 4: build what is specified

**From:** WorkBeat Admin (the web console)
**To:** the backend owner, WorkBeat-Backend
**Date:** 17 November 2026
**Follows:** rounds 1–3, all answered. Every route below is already **specified** in the backend's
own docs; this round asks for them to be **built**. No new contract is asked for.

The admin console is built against these routes and is waiting on them. Until each lands, its page
shows a plain "not available yet" or "This item no longer exists" message.

---

## 1. Staff API — blocks the whole staff area (priority 1)

Signed in as a super admin, every staff page is empty because no `/v1/staff/*` route exists
(`GET /v1/staff/companies` answers `404`). Contract: `docs/core/api/staff-api.md` and the
`administer-platform` / `authenticate-users` specs. Staff sign in with password only (MFA removed,
16 Nov 2026).

| Route | Admin page |
|---|---|
| `GET /v1/staff/companies` (`status`, `q`; `{ items, totals }`; `key_last4`, `expired_blocking_grace_days`, `custom_domain_checked_at` on rows) | Companies, Licences, Custom domains |
| `GET /v1/staff/companies/:id` | Companies (dialogs) |
| `POST /v1/staff/companies/:id/suspend` and `/restore` | Companies |
| `PATCH /v1/staff/companies/:id` (`expired_blocking_grace_days`) | Companies |
| `PATCH /v1/staff/companies/:id/license` (Enterprise on any company) | Companies, Licences |
| `POST /v1/staff/companies/:id/license/reissue` | Licences |
| `GET /v1/staff/agent-releases` | Agent releases |
| `POST /v1/staff/agent-releases/upload-url` (`upload_url`, `storage_path`, `expires_at`) | Agent releases |
| `POST /v1/staff/agent-releases` (Windows `signature` null/omitted, macOS required) | Agent releases |
| `POST /v1/staff/agent-releases/:id/withdraw` | Agent releases |
| `GET /v1/staff/team` (`users` without `mfa_enabled`, `invitations`) | Staff team |
| `POST /v1/staff/invitations`, `POST /v1/staff/invitations/:id/resend`, `DELETE /v1/staff/invitations/:id` | Staff team |
| `DELETE /v1/staff/users/:id` | Staff team |

Every staff route: `super_admin` only (`403` otherwise), staff scope, no employee, device, activity,
URL or screenshot data (D41), unknown ID → `404 NOT_FOUND`.

## 2. Company routes specified but not built (priority 2)

| Route | Admin page | What the page shows today |
|---|---|---|
| `GET` / `PUT` / `DELETE /v1/company/custom-domain` | Company settings → Custom domain | "Custom domains aren't available yet" |
| `GET /v1/hosts/resolve` | Sign-in page on a company address | Plain WorkBeat sign-in, no company name |
| `GET /v1/employees/:id/timesheet.pdf` | Employee → Timesheet → PDF | "This file is not available" (CSV works) |
| `PUT /v1/billing/screenshot-tier` | Company settings → Billing | "Contact WorkBeat" message |
| `POST /v1/billing/portal-session` | Company settings → Billing | "Payment and invoices aren't available here yet" |

The billing pair depends on Stripe; say if it waits for Stripe and the console keeps its messages.

## 3. Small gaps found while building (priority 3)

| # | Ask | Why |
|---|---|---|
| 3.1 | Return `min_agent_version` on a GET (`GET /v1/company/settings` or `GET /v1/license`) | Deployment can save a minimum agent version but can't show the current one |
| 3.2 | `PATCH /v1/company/settings`: refuse `alert_email.roles: []` with `422` naming `alert_email.roles` | The API accepts an alert email with no recipients; only the dialog stops it today |
| 3.3 | Block rules: accept the spec's own regex example `^https?://(www\.)?reddit\.com/r/.*`, or change the spec to the narrower form the API accepts | The console tells users to type the site and path instead; spec and API disagree |
| 3.4 | Migration: `employees.email` `NOT NULL` for non-archived rows | The API now requires an email (16 Nov 2026); the column still allows null |
| 3.5 | Migration: drop the unused MFA columns on `users` and the `mfa_challenges` table (0005) | Staff MFA was removed on 16 Nov 2026; they hold old encrypted secrets |

## 4. Configuration for real use (no code)

- `RESEND_API_KEY` with a verified sending domain (SPF, DKIM, DMARC) and `EMAIL_FROM` on that domain.
  Until then email goes through the temporary Gmail SMTP and lands in spam.
- `PORTAL_URL` set to the console's public https address, so invitation and reset links work
  outside the developer's machine.

## Not for the backend

- macOS uninstall command (Q11): for the Mac agent owner. The Deployment page shows Windows only.

---

**Reply with:** which items are built (with the commit), any change to a field or code from the
specified contract, and which items wait (and on what).
