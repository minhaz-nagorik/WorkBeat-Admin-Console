> **Read first — this task list is not the requirement.**
> Capabilities: `company-settings · custom-domain · billing`
> The requirements are in [`specs/`](specs/). Run `cd docs && openspec show configure-company`.
> Design: [design.md](design.md) · [design/README.md](../../../design/README.md) · Decisions: [admin-decisions.md](../../../decisions/admin-decisions.md).

## 1. company-settings

- [ ] 1.1 Company form: name, read-only address, time zone picker, idle threshold in minutes
- [ ] 1.2 Retention 1–365 with quick picks and shorten confirmation naming the date
- [ ] 1.3 Tests: `422` beside fields; out-of-range idle refused; shorten confirmation date; role test — only company admin reaches the page

## 2. custom-domain

- [ ] 2.1 Card states: none, pending, active, failed, with `checked_at`
- [ ] 2.2 Add/change dialog; CNAME and TXT records with copy
- [ ] 2.3 Inline remove
- [ ] 2.4 Tests: `409` and `422` messages; records shown after save; remove returns to empty state; role test — no other role calls the route

## 3. billing

- [ ] 3.1 Billing card from `GET /v1/billing` with estimate
- [ ] 3.2 Tier change via `PUT /v1/billing/screenshot-tier`, scheduled tier and date shown
- [ ] 3.3 Stripe portal button via `POST /v1/billing/portal-session`
- [ ] 3.4 Tests: estimate per tier; scheduled tier shown; no card field anywhere; works while suspended; role test — only company admin sees billing
