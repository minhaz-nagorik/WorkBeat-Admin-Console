## Why

WorkBeat Admin is one Next.js app for four roles (D41, Plan-v3.5 §4.5–4.6). Every later page needs
the same shell: navigation that follows the role, a single way to call the API with the user's
token and turn its codes into plain language (A2, A12), and the list, confirmation, label, time and
accessibility conventions the prototype established (A4, A7–A9, A11). Building them once keeps
every page consistent and keeps access control in the API, not in hidden links.

## What Changes

- **App shell**: sidebar navigation and landing page per role from `GET /v1/me`, company name or
  "Internal console" in the header, route guard that redirects a role away from pages it may not
  open, company status banner for suspended, expired and trial companies.
- **API access**: every call is made by the app's server with the session token from `POST /v1/auth/login`; `401` returns to sign-in, other codes become plain messages; polling every 30 s for
  live pages.
- **UI conventions**: lists with search, filters and pager; inline confirmation for destructive
  actions; one plain-language label map; company time zone for every date; WCAG 2.2 AA.

## Capabilities

### New Capabilities

- `app-shell`: layout, role navigation, route guard, landing pages and the company status banner.
- `api-access`: authenticated API calls, error-to-message mapping, session expiry and polling.
- `ui-conventions`: lists, confirmations, labels, dates and accessibility every page follows.

### Modified Capabilities

None.

## Impact

- Consumes backend `user-authentication` (`GET /v1/me`), `role-access`, `company-status`
  (`GET /v1/company/status`), `api-envelope` (error `code` catalog).
- Every later change builds on these three capabilities.
- Design reference: the prototype's rail, page header, `.pill`, list toolbar, pager and
  `confirmBox`.
