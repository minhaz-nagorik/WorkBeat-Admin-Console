## Why

On 23 November 2026 the product owner asked for a second list of private sites, kept by WorkBeat
staff and applied to every company (A19). Each company already keeps its own private sites; the
WorkBeat list sits on top of it and companies can see but not change it.

## What Changes

- **Staff page** `/staff/private-sites`: list, search, add and remove the WorkBeat private sites.
- **Block list**: the Private sites card also shows the WorkBeat sites, tagged "Set by WorkBeat",
  without a remove control, for every company role that sees the card.

## Capabilities

### New Capabilities

- `workbeat-private-sites`: the staff list and how companies see it.

### Modified Capabilities

None (`sensitive-sites` is unchanged; a company's own list works as before).

## Impact

- Consumes backend round 9 (`docs/backend-requests-9.md`): `GET/POST/DELETE
  /v1/staff/sensitive-domains`, `source` on `GET /v1/sensitive-domains` items, and the WorkBeat
  sites in every agent policy's `sensitive_domains`.
- Until the backend ships it, the staff page shows the API error and the Block list shows only the
  company's own sites.
