## Why

Plan-v3.5 §4.5 "Settings" gives the Company Admin the company profile, custom domain, retention,
screenshot tier and billing. The backend `company-settings`, `custom-domains` and
`subscription-sync` serve them, all to `company_admin` only (`role-access`). Screenshot frequency
is per employee and bounded by the tier (D37, B11), so this page changes the tier through billing
and leaves the interval to each employee's monitoring settings.

## What Changes

- **Company settings**: name, read-only address (slug), data retention 1–365 days, time zone,
  idle threshold 60–3600 s.
- **Custom domain**: add, change and remove a domain; show the CNAME and TXT records with copy
  buttons; pending, active and failed states.
- **Billing**: plan, seats used of the limit, screenshot tier with a change scheduled for the end
  of the period, next-invoice estimate, and the Stripe billing portal for card and invoices.

## Capabilities

### New Capabilities

- `company-settings`: the company form.
- `custom-domain`: the custom domain card and its DNS steps.
- `billing`: the billing card, the tier change and the Stripe portal.

### Modified Capabilities

None.

## Impact

- Consumes backend `company-settings` (`GET/PATCH /v1/company/settings`), `custom-domains`
  (`GET/PUT/DELETE /v1/company/custom-domain`), `subscription-sync` (`GET /v1/billing`,
  `PUT /v1/billing/screenshot-tier`, `POST /v1/billing/portal-session`), `company-status`,
  `role-access`.
- The monitoring notice card on this page belongs to `edit-policies` `monitoring-notice`.
- Design reference: Prototype "Company settings". Deviations in [design.md](design.md).
