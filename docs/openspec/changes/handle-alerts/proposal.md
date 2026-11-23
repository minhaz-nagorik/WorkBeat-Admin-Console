## Why

Tamper alerts are how a company learns that WorkBeat was interfered with (Plan-v3.5 §4.4
"Ingestion and device health", D24). The backend `alerts-feed` lists, filters and resolves them.
There are no alert emails and no offline alert: a silent computer shows as Offline on the device
and employee pages (backend B34). The
Alerts page must show them in words customers use (A4), densely enough to scan (prototype review
of 16 Nov 2026),.

## What Changes

- **Alerts page**: compact table (When, Alert, Person, Computer, What happened), an alert-type
  dropdown with counts, an open/resolved filter, search, cursor paging, a collapsible "What each
  alert means", Resolve for Company Admin and IT Admin, manager scoped to own team, 30 s polling.

## Capabilities

### New Capabilities

- `alerts-feed-page`: the Alerts page, its filters, labels, resolve action and refresh.

### Modified Capabilities

None.

## Impact

- Consumes backend `alerts-feed` (`GET /v1/alerts`, `POST /v1/alerts/:id/resolve`),
  `role-access`.
- Uses `establish-admin-foundation` `ui-conventions` (label map, lists, times) and `api-access`
  (polling).
- Design reference: Prototype "Alerts" as redesigned on 16 Nov 2026.
