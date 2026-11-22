> **Read first — this task list is not the requirement.**
> Capabilities: `company-settings · custom-domain · billing`
> The requirements are in [`specs/`](specs/). Run `cd docs && openspec show configure-company`.
> Design: [design.md](design.md) · [design/README.md](../../../design/README.md) · Decisions: [admin-decisions.md](../../../decisions/admin-decisions.md).

## 1. company-settings

- [x] 1.1 Company form: name, read-only address, time zone picker, idle threshold in minutes
- [x] 1.2 Retention as 30, 60 or 90 days, with a shorten confirmation naming the date
- [x] 1.4 Time zone dropdown in the site's style: opens the full list on click, filters as you type, keyboard picks
- [ ] 1.3 Tests: `422` beside fields; out-of-range idle refused; shorten confirmation date; role test — only company admin reaches the page

## 2. custom-domain

- [x] 2.1 A17: card back on Company settings; states none, pending ("Waiting for WorkBeat approval"), active, failed ("Not approved")
- [x] 2.2 Add/change form; CNAME and TXT records shown until the domain is active
- [x] 2.3 Remove with a confirmation naming the effect
- [x] 2.5 Host gate in the middleware: an address that is not WorkBeat's own opens only when `GET /v1/hosts/resolve` answers 200 (60 s cache); else redirect to `APP_URL/sign-in`, or 404 for `/api/`. `isOwnHost` unit test
- [ ] 2.4 Tests: `409` and `422` messages; records shown after save; remove returns to empty state; role test — no other role calls the route

## 3. billing

- [x] 3.1 Billing card from `GET /v1/billing` with estimate
- [x] 3.2 Tier change via `PUT /v1/billing/screenshot-tier`, scheduled tier and date shown
- [x] 3.3 Stripe portal button via `POST /v1/billing/portal-session`
- [ ] 3.4 Tests: estimate per tier; scheduled tier shown; no card field anywhere; works while suspended; role test — only company admin sees billing
- [x] 3.5 A15: Company settings holds only time zone and idle threshold; Billing card, notice editor, name and retention removed (the custom domain card came back with A17); billing links in the shell banner and screenshot tab replaced by "contact WorkBeat"
