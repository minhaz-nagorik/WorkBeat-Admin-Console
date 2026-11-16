# Backend requests from WorkBeat Admin — round 3 (final)

> **Answered (16 Nov 2026)** in `WorkBeat-Backend/docs/integration/admin-requests-3-response.md`. Everything is answered; the specs use the answers. The staff items wait for the staff API to be built.

**From:** the web platform (WorkBeat Admin) specs
**To:** the backend owner, WorkBeat-Backend
**Date:** 16 November 2026
**Follows:** [backend-requests.md](backend-requests.md) and [backend-requests-2.md](backend-requests-2.md), both answered.

**This is the last request.** To make sure nothing is left for a later round, it was built from
three passes:
- a review of all ten admin changes against each other;
- a check that every route the admin specs call exists in the backend specs (all do, except the two
  staff routes already agreed);
- every "not specified" note in the backend's own `portal-api.md`, `staff-api.md` and `README.md`.

None of these blocks the start of development. Each admin spec says what the page does until the
answer lands. Numbers are from [decisions/open-questions.md](decisions/open-questions.md).

---

## A. Fields and parameters to add

| # | Ask | Page that needs it | Until then | Capability |
|---|---|---|---|---|
| Q26 | `key_last4` on each `GET /v1/staff/companies` row | Staff → Licences: masked key and search by last four | No last-four column | `staff-companies` |
| Q27 | `expired_blocking_grace_days` on `GET /v1/staff/companies` and `/:id` | Staff → company dialog prefilled | Empty field, "Default 30" | `staff-companies` |
| Q28 | `resolved_by_name` on `GET /v1/alerts` items, and `created_by_name` on `GET /v1/employees/:id/pauses` items (`null` when the user is gone) | "Resolved by …", "Scheduled by …". IT Admins and Managers can't turn a user ID into a name | Time only | `alerts-feed`, `monitoring-pauses` |
| Q30 | `q` (free-text search over type label, hostname, employee name and detail) on `GET /v1/alerts`. The feed is cursor-paged, so the browser can't search it | Alerts search box | Search box hidden | `alerts-feed` |

## B. Behaviour to state in the spec

| # | Question | Why the page needs it | Until then |
|---|---|---|---|
| Q29 | What does `POST /v1/invitations/accept` return for a `super_admin` invitation? We assume no session, because a staff session exists only after TOTP | Staff invitation sends the person to sign-in and authenticator set-up | App ignores any session for staff |
| Q31 | Are portal writes refused while the company is `suspended` or `expired`? If so, with which status and `code`? (Your README "Unspecified") | Every form needs to know whether to stay enabled and what to say | Forms stay enabled; an unknown refusal shows the generic retry message |
| Q32 | Lists other than alerts are "returned whole". Confirm that this holds for `GET /v1/employees` and `GET /v1/devices` at the largest company you support, or add paging (and the parameter names) | Employees and Devices lists page and search in the browser | Paged in the browser over the whole list |
| Q33 | Staff invitations: `409 CONFLICT` for an email with an open invitation or an existing user, as for company invitations? (your staff-api "Unspecified") | Invite staff error message | Same message as company invitations |
| Q34 | `PATCH /v1/staff/companies/:id/license`: may it move a `starter` or `growth` licence to `enterprise`? | Staff plan dialog: whether to offer Enterprise on a Starter or Growth company | Enterprise offered only on Enterprise companies |
| Q35 | Windows release `signature`: required, empty string or null? | Agent releases publish form | Field optional for Windows |

## C. Name everything that is still "not specified"

The admin app types every request and response from `packages/shared`. Please replace every "not
specified" in `docs/core/api/portal-api.md`, `staff-api.md` and `README.md` with the names the code
uses, and export the same names from `packages/shared`. Today's open names:

- **Responses:**
  - invitation lookup's company name;
  - billing's scheduled tier and date;
  - the billing portal-session URL;
  - the uninstall-token reveal field;
  - the setup-step shape;
  - the `GET /v1/rollout` counts shape;
  - import's skipped emails;
  - the screenshot list key;
  - report list keys and the activity `hours` rows;
  - timesheet sections;
  - daily-summary CSV columns;
  - the `EXPORT_TOO_LARGE` cap field;
  - staff company list totals and the staff team row fields.
- **Requests and parameters:**
  - the alerts cursor parameter;
  - how `type` takes several values on `GET /v1/alerts`;
  - the CSV import transport (multipart or raw body);
  - whether `PUT …/monitoring-settings` needs every field;
  - the staff company search parameter, paging and sort.
- **Write responses:** the record each write returns, as listed in your three "Unspecified" sections.
- **`GET /v1/employees/:id` for `it_admin`:** confirm it returns the same four fields as the list.
- **404 for an unknown ID on staff routes:** state it in the staff spec.

## D. Already agreed; confirm when the staff API is built

- `POST /v1/staff/agent-releases/upload-url`: `upload_url`, `storage_path`, `expires_at`.
- `POST /v1/staff/invitations/:id/resend`.
- `custom_domain_checked_at` on `GET /v1/staff/companies`.

## E. Spec housekeeping

- `authenticate-users/specs/team-invitations/spec.md` (around line 106): "update `app_metadata`" is
  Supabase wording left over after B22. Make it "update the `users` row `role` and revoke the
  user's sessions".

## F. Not requested: the admin console goes without these

Listed so this round closes everything. No answer needed unless the product wants one back:
- an Overview table with tracked time per employee;
- an employee status timeline and "Right now" card;
- today's idle total;
- seats on `GET /v1/rollout`;
- alert-email recipients shown to Managers and IT Admins;
- a staff "Check DNS now" button.

## Not for the backend

- The macOS uninstall command belongs to the Mac agent owner (Plan §5.4 gives only Windows).
