# Backend requests from WorkBeat Admin — round 6: IT Admin changes need Company Admin approval

> **Answered (17 Nov 2026)** in `WorkBeat-Backend/docs/integration/admin-requests-6-response.md`;
> built and checked end to end from the console (request, approve, reject, cancel, double approve
> refused, IT Admin 403 on the licence). Differences adopted: `resource` on `GET /v1/changes` takes
> one value (the console filters several in the browser); approve and reject answer `{ change }`.

**From:** WorkBeat Admin (the web console) · **To:** WorkBeat-Backend · **Date:** 17 November 2026
**Follows:** round 5, answered (`admin-requests-5-response.md`).
**Decided by the product owner (17 Nov 2026), changing the permission matrix (`role-access`):**

1. An **IT Admin** can do what a Company Admin does on employees, devices, alerts, the block list,
   private sites and productivity rules, **but every change waits for a Company Admin's approval**.
   No IT Admin write takes effect directly.
2. An IT Admin still sees **no activity, reports, calendar, timesheets or screenshots** (unchanged).
3. An IT Admin no longer has the **Deployment** area (licence key, uninstall token, minimum agent
   version, setup checklist); the Company Admin gives them the licence key. They keep the
   **installer downloads**. No Team & roles, no Company settings (unchanged).
4. A Company Admin approves or rejects each change on an **Approvals** page.

The console is being built against the contract below. Please add it to `portal-api.md`, the code
catalog and the specs (`role-access`, plus a new capability such as `change-approvals`), and say if
any name or code differs.

---

## 1. `it_admin` access, route by route

| Route | `it_admin` today | `it_admin` after |
|---|---|---|
| `GET /v1/employees`, `GET /v1/employees/:id` | 4 fields (B18) | the Company Admin's fields (incl. `presence`, `devices`, `manager_user_id`) |
| `POST /v1/employees`, `PATCH /v1/employees/:id`, `DELETE /v1/employees/:id`, `POST /v1/employees/import` | `403` | **approval** (§2) |
| `GET /v1/employees/:id/monitoring-settings`, `GET …/pauses` | `403` | allowed |
| `PUT …/monitoring-settings`, `POST …/pauses`, `PATCH …/pauses/:pause_id`, `POST …/pauses/:pause_id/cancel` | `403` | **approval** |
| `POST /v1/devices/:id/release`, `POST /v1/devices/:id/deactivate` | allowed | **approval** |
| `POST /v1/alerts/:id/resolve` | allowed | **approval** |
| `POST/PATCH/DELETE /v1/block-rules…` | allowed | **approval** |
| `GET /v1/sensitive-domains` | `403` | allowed |
| `POST/DELETE /v1/sensitive-domains…` | `403` | **approval** |
| `GET /v1/productivity-rules` | `403` | allowed |
| `POST/PATCH/DELETE /v1/productivity-rules…` | `403` | **approval** |
| `GET /v1/license`, `POST /v1/license/reveal`, `POST /v1/license/uninstall-token/reveal`, `PUT /v1/deployment/min-agent-version`, `GET /v1/company/setup`, `POST /v1/company/setup/steps` | allowed | **`403`** |
| `GET /v1/downloads`, `GET /v1/rollout`, `GET /v1/agent-versions`, devices and alerts reads | allowed | allowed (unchanged) |
| reports, calendar, timesheet(.pdf), screenshots, exports, notice acknowledgements | `403` | `403` (unchanged) |

`manager` and `company_admin` are unchanged; a Company Admin's writes still apply at once.

## 2. A write by an `it_admin` becomes a pending change

Every route marked **approval** above, called by an `it_admin`, validates the request exactly as
today (so `400`/`404`/`409`/`422` still come back at once), but **does not apply it**. It answers:

`202 Accepted` → `{ change }` (the object in §3, `status: "pending"`).

The CSV import validates the whole file first (same `422` with `lines`), then stores the file as one
pending change.

## 3. The change object

| field | type | notes |
|---|---|---|
| id | uuid | |
| status | enum(pending\|approved\|rejected\|cancelled\|failed) | |
| resource | enum(employee\|employee_import\|monitoring_settings\|pause\|device\|alert\|block_rule\|sensitive_domain\|productivity_rule) | |
| action | enum(create\|update\|delete\|release\|deactivate\|resolve\|cancel\|import) | |
| target_id | uuid \| null | the employee, rule, device, … it acts on; null for a create or an import |
| summary | string | one plain sentence for people, e.g. "Add employee Ada Lovelace (ada@acme.com)", "Release computer NG-LT-0141", "Block website facebook.com" — no enum values, no ids |
| requested_by | object | `{ id, name }` |
| requested_at | ISO-8601 datetime | |
| decided_by | object \| null | `{ id, name }` of the Company Admin |
| decided_at | ISO-8601 datetime \| null | |
| reason | string \| null | the rejection reason, ≤ 500 characters |
| error | object \| null | when `failed`: `{ code, message }` of the API error the approval met (e.g. `409 CONFLICT` because the employee was archived meanwhile) |

## 4. Routes

| Route | Roles | Answer |
|---|---|---|
| `GET /v1/changes?status=&resource=` | `company_admin` (every change of the company), `it_admin` (own changes only); `manager` → `403` | array, newest first, at most 500 |
| `POST /v1/changes/:id/approve` | `company_admin` | `200 { change }`: applies the stored request as the Company Admin, in one transaction; `status` becomes `approved`, or `failed` with `error` if the request no longer applies. Not `pending` → `409 CONFLICT` |
| `POST /v1/changes/:id/reject` | `company_admin` | body `{ reason? }` → `200 { change }`, `status: rejected`. Not `pending` → `409` |
| `DELETE /v1/changes/:id` | the `it_admin` who asked, while `pending` | `204`, `status: cancelled`. Otherwise `404` / `409` |

Notes:
- The record a change produces is attributed to the Company Admin who approved it (`created_by` /
  `resolved_by` …), and the change keeps who asked.
- Emails (please): to every Company Admin when a change is waiting (at most one email per 15 minutes
  per company), and to the IT Admin when their change is approved, rejected or failed.
- A pending change of a removed IT Admin stays pending; a Company Admin can still approve or reject it.

---

**Reply with:** what is built (commit), any difference in names or codes, and the email wording if it
differs.
