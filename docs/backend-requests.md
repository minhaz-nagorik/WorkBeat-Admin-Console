# Backend requests from WorkBeat Admin

> **Answered (16 Nov 2026)** in `WorkBeat-Backend/docs/integration/admin-requests-response.md`. Everything here is live, except 1.4, 2.8 and 2.9, which are agreed and come with the staff API. Next: [backend-requests-2.md](backend-requests-2.md).

**From:** the web platform (WorkBeat Admin) specs, `WorkBeat-Admin/docs/openspec/`
**To:** the backend owner, WorkBeat-Backend
**Date:** 16 November 2026
**Source of truth:** WorkBeat Plan v3.5. Every request below is something a page in Plan §4.5–4.6 or
the prototype needs and the backend specs do not provide today.

The admin specs never invent a route. Where something below is missing, the page either leaves the
feature out or works around it. The table at the end lists each item's number from
[decisions/open-questions.md](decisions/open-questions.md).

---

## 1. Needed before the pages can be built (blocking)

### 1.1 Company time zone for every company role
- **Today:** `timezone` is returned only by `GET /v1/company/settings`, which only `company_admin` may call.
- **Problem:** Managers and IT Admins must see times in the company's day (B19). Their pages have no way to read the zone.
- **Ask:** add `company.timezone` to `GET /v1/me` for company users.
- **Capability:** `authenticate-users` / `user-authentication` ("The signed-in user can read who they are").

### 1.2 Live status per employee
- **Today:** status is derived per device (`device-status`). There is no per-employee status. `GET /v1/devices` refuses Managers.
- **Problem:** the Employees list and employee header show Active / Idle / Offline / Paused / Tamper / No device (prototype "Employees"). Managers, the main readers, get nothing.
- **Ask:** add to `GET /v1/employees` and `GET /v1/employees/:id` a derived `presence` field. Values: `active`, `idle`, `offline`, `paused`, `tamper`, `no_device`. Use the same role scoping as the directory.
  - Rule suggestion: `paused` if a pause is in force. Otherwise `tamper` if any live binding is `tamper`. Otherwise `active` / `idle` from the latest activity bucket within 15 minutes. Otherwise `offline`. With no live binding: `no_device`.
- **Also:** add `devices` there as a short list (`id`, `hostname`, `os`, `status`, `last_heartbeat_at`) for the employee page. That lets Managers see their team's devices without opening `GET /v1/devices` to them.
- **Capability:** `manage-employees` / `employee-directory`, reading `receive-device-health` / `device-status`.

### 1.3 Define `health` on `GET /v1/devices/:id`
- **Today:** `device-status` says the detail "adds `health`" but never defines it.
- **Ask:** specify its fields. The likely ones are the heartbeat's store size, drop and skip counters, `outdated` and `notice_ack_version`, so the Device detail page can label them.
- **Capability:** `receive-device-health` / `device-status`.

### 1.4 Upload route for agent releases
- **Today:** `POST /v1/staff/agent-releases` needs a `storage_path` to an object already in the private `agents` bucket. No route puts it there.
- **Problem:** staff can't publish a release from the console (Plan §4.6 "agent release management").
- **Ask:** `POST /v1/staff/agent-releases/upload-url`. It takes `product`, `platform`, `arch` and `version`, and returns a signed upload URL and the `storage_path` to pass to publish. The API should check size and SHA-256 on publish, as it does today.
- **Capability:** `distribute-agents` / `agent-releases`.

---

## 2. Cheap additions that remove workarounds (should have)

| # | Ask | Why (page) | Capability |
|---|---|---|---|
| 2.1 | `group_by=day\|week\|month` on `GET /v1/reports/activity` and `/reports/productivity`, returning one row per period | Employee report "Breakdown by day/week/month". Today the page would need up to 13 calendar calls for one range | `report-usage` / `usage-reports` |
| 2.2 | `released_at` and `deactivated_at` on `GET /v1/devices` | Devices list shows when a device was released | `receive-device-health` / `device-status` |
| 2.3 | `manager_user_id` filter on `GET /v1/employees` | Team & roles "Manager teams" card, and the warning when demoting a manager | `manage-employees` / `manager-teams` |
| 2.4 | `created_by_name` on `GET /v1/block-rules` | Block list "Added by" column | `serve-agent-policy` / `block-rules` |
| 2.5 | `counts` per `event_type` (for the current filters, without `type`) on `GET /v1/alerts` | Alerts type dropdown shows a count per type | `process-tamper-alerts` / `alerts-feed` |
| 2.6 | `employee_id` filter on `GET /v1/alerts` | Recent alerts section on the employee page | `process-tamper-alerts` / `alerts-feed` |
| 2.7 | `GET /v1/agent-versions` for `company_admin` and `it_admin`: live (non-withdrawn) agent versions per platform | Deployment: pick the company's minimum version from a list instead of typing `x.y.z` | `distribute-agents` / `agent-updates` |
| 2.8 | `POST /v1/staff/invitations/:id/resend` | Staff team: same as the company team's resend | `authenticate-users` / `staff-accounts` |
| 2.9 | `custom_domain_checked_at` on `GET /v1/staff/companies` | Staff custom domains: "last checked" | `administer-platform` / `staff-companies` |

---

## 3. Questions, not requests

- **Staff "Check DNS now".** The prototype has it, and the cron runs every 5 minutes. Is a manual trigger wanted? If not, the console leaves it out. The admin specs leave it out today.
- **Staff setting the global minimum version.** Today it is derived from `min_supported` of the newest release (`agent-releases`). The prototype has a dropdown for it. Confirm that the derived rule is final; the console then shows the minimum read-only.
- **macOS uninstall command.** Plan §5.4 gives only the Windows `msiexec /x … UNINSTALL_TOKEN=` form. The Deployment page shows the command per platform. This needs an answer from the Mac agent owner, not the backend.

---

## 4. Not asked: the console goes without these

These prototype features are dropped from the specs, so they need no backend work:
- the Overview table of every employee with tracked time, activity and split;
- the employee "Right now" card and the status timeline (active / idle / offline stretches);
- the "today" stats for idle time;
- seats on `GET /v1/rollout` (the page calls `GET /v1/license`);
- showing alert recipients to Managers and IT Admins;
- the notice template line on whether screenshots are on, which the frontend spec will word generically.

Raise any of them if the product wants them back.

---

## Mapping to the admin open questions

| Here | Open question |
|---|---|
| 1.1 | Q1 |
| 1.2 | Q2, Q3 |
| 1.3 | Q9 |
| 1.4 | Q19 |
| 2.1 | Q6 |
| 2.2 | Q8 |
| 2.3 | Q12 |
| 2.4 | Q14 |
| 2.5 | Q15 |
| 2.6 | Q16 |
| 2.7 | Q10 |
| 2.8 | Q21 |
| 2.9 | Q18 |
| 3 | Q18, Q20, Q11 |
| 4 | Q4, Q5, Q7, Q13, Q17, Q22 |
