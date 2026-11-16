> **Read first — this task list is not the requirement.**
> Capabilities: `alerts-feed-page · alert-email-settings`
> The requirements are in [`specs/`](specs/). Run `cd docs && openspec show handle-alerts`.
> Design: [design/README.md](../../../design/README.md) · Decisions: [admin-decisions.md](../../../decisions/admin-decisions.md).

## 1. alerts-feed-page

- [ ] 1.1 Alerts table from `GET /v1/alerts`: When, Alert, Person, Computer, What happened, repeat count
- [ ] 1.2 Labels and one-line descriptions per `event_type` from `detail`, in the shared label map, with "Other" fallback
- [ ] 1.3 Toolbar: search, type dropdown with `counts`, Open/Resolved/All, `employee_id` Person chip; `items` / `next_cursor` paging
- [ ] 1.4 Resolve for `company_admin` and `it_admin` via `POST /v1/alerts/:id/resolve`
- [ ] 1.5 Collapsible "What each alert means"; 30 s polling keeping state
- [ ] 1.6 Tests: label for every event type, no technical words; filters map to query params; resolve moves the row; role test — manager sees own team only and no Resolve, IT sees Resolve, super admin has no page; poll keeps filters

## 2. alert-email-settings

- [ ] 2.1 Subtitle from `alert_email` for company admins
- [ ] 2.2 Email settings dialog, `PATCH /v1/company/settings`
- [ ] 2.3 Client checks (a role and a type required); `422` beside the field
- [ ] 2.4 Tests: subtitle per delivery and "nobody"; save sends the shape; empty roles refused; role test — only company admin sees the button
