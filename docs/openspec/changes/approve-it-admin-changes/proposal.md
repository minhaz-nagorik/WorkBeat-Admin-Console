## Why

On 17 November 2026 the product owner changed the IT Admin role (A14, backend round 6): an IT Admin
may now act on employees, monitoring settings, pauses, devices, alerts, the block list, private
sites and productivity rules, but no such change takes effect until a Company Admin approves it.
The IT Admin also loses the Deployment area (licence key, uninstall token, minimum agent version,
setup checklist) and keeps only the installers. The console needs a place to approve, reject and
follow these changes, and a Downloads page for IT.

## What Changes

- **Approvals page**: Company Admins list every change from `GET /v1/changes`, pending first, and
  approve or reject each; IT Admins see their own requests in "My requests" and cancel a pending one.
- **Waiting for approval**: every IT Admin write that answers `202 { change }` says it waits for a
  Company Admin and changes nothing on screen.
- **Navigation count**: an Approvals item with the number of pending changes, polled every 30 s.
- **Downloads page**: installers and install steps for IT, without the licence key.
- Earlier changes edited in place to the new matrix: `app-shell`, `device-list`, `device-actions`,
  `alerts-feed-page`, `block-list`, `sensitive-sites`, `productivity-rules`, `employee-directory`,
  `monitoring-settings`, `monitoring-pauses`, `employee-report`, `deployment-page`,
  `setup-checklist`, `overview-dashboard`, `team-management`.

## Capabilities

### New Capabilities

- `change-approvals`: the Approvals page for both roles, the waiting state after an IT Admin write,
  cancel, approve, reject, failed approvals and the navigation count.
- `downloads-page`: the IT Admin's Downloads page.

### Modified Capabilities

None (the capabilities above are still `ADDED` deltas in their own unarchived changes and were
edited there).

## Impact

- Consumes backend round 6 (`docs/backend-requests-6.md`): `GET /v1/changes`,
  `POST /v1/changes/:id/approve`, `POST /v1/changes/:id/reject`, `DELETE /v1/changes/:id`, the
  `202 { change }` answer, `GET /v1/downloads`, and the new `role-access` matrix.
- Uses `establish-admin-foundation` `ui-conventions` (label map, lists, times, errors) and
  `api-access` (polling).
- Reworks pages built in changes 3, 4, 5, 6, 7 and 8 for the `it_admin` role.
