## Why

Tamper and offline alerts are how a company learns that WorkBeat was interfered with or a computer
stopped connecting (Plan-v3.5 §4.4 "Ingestion and device health", D24). The backend `alerts-feed`
lists, filters and resolves them and `alert-emails` sends them by the company's settings. The
Alerts page must show them in words customers use (A4), densely enough to scan (prototype review
of 16 Nov 2026), and let Company Admins choose who is emailed and how.

## What Changes

- **Alerts page**: compact table (When, Alert, Person, Computer, What happened), an alert-type
  dropdown with counts, an open/resolved filter, search, cursor paging, a collapsible "What each
  alert means", Resolve for Company Admin and IT Admin, manager scoped to own team, 30 s polling.
- **Alert email settings**: a Company Admin dialog for `alert_email` roles, types and delivery, and
  a page subtitle that says who gets emails and how.

## Capabilities

### New Capabilities

- `alerts-feed-page`: the Alerts page, its filters, labels, resolve action and refresh.
- `alert-email-settings`: who is emailed about which alerts, and how often.

### Modified Capabilities

None.

## Impact

- Consumes backend `alerts-feed` (`GET /v1/alerts`, `POST /v1/alerts/:id/resolve`),
  `company-settings` (`GET/PATCH /v1/company/settings` `alert_email`), `alert-emails` (what an
  email contains), `role-access`.
- Uses `establish-admin-foundation` `ui-conventions` (label map, lists, times) and `api-access`
  (polling).
- Design reference: Prototype "Alerts" as redesigned on 16 Nov 2026.
