## Why

Plan-v3.5 §4.5 "Policies" gives the company four rule sets: the block list (domain and url rules,
D39), sensitive domains that are never recorded (D4), productivity rules that colour reports, and
the monitoring notice employees acknowledge (D25). The backend `serve-agent-policy` stores them
and pushes three of them to every device. The pages must let the right role edit each one, read
them to the others, and say plainly where a rule works and where it does not (D39, Plan-v3.5 §4.3).

## What Changes

- **Block list**: domain rules ("A whole website") and url rules ("One part of a website") with a
  reason; edit and delete; regex input shows the url rules the API created; a note on which
  browsers get domain blocking only. Admin and IT edit, manager reads.
- **Private sites**: the sensitive-domain list; Company Admin adds and removes, defaults included;
  manager reads; IT has no access.
- **Productivity rules**: app and website rules with a category; Company Admin edits, manager
  reads; a change re-categorises past reports.
- **Monitoring notice**: Company Admin edits the notice text; a changed text asks every employee
  again; a printable template.

## Capabilities

### New Capabilities

- `block-list`: the block-list page and its add, edit and delete flows.
- `sensitive-sites`: the private sites section.
- `productivity-rules`: the productivity rules page.
- `monitoring-notice`: the notice editor and template.

### Modified Capabilities

None.

## Impact

- Consumes backend `block-rules`, `sensitive-domains`, `productivity-rules`, `collection-notice`
  (all in `serve-agent-policy`) and `role-access`.
- Design reference: Prototype "Block list", "Productivity rules", "Company settings" (notice card).
  Deviations in [design.md](design.md).
