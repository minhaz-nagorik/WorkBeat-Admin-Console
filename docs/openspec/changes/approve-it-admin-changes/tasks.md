> **Read first — this task list is not the requirement.**
> Capabilities: `change-approvals · downloads-page`
> The requirements are in [`specs/`](specs/). Run `cd docs && openspec show approve-it-admin-changes`.
> Decisions: [admin-decisions.md](../../../decisions/admin-decisions.md) (A14) · Contract: [backend-requests-6.md](../../../backend-requests-6.md).

## 1. change-approvals

- [x] 1.1 Types for the change object and the four `/v1/changes` routes; status and resource labels in the shared label map
- [x] 1.2 A `202 { change }` answer to any write shows "Waiting for approval" with the summary and a link to My requests, and changes nothing on screen
- [ ] 1.3 Approvals page for `company_admin`: list, pending first, status and type dropdowns, search, pager
- [x] 1.4 Approve, Reject with an optional reason (≤ 500 characters), `409` reload; Failed shows the reason in plain words
- [x] 1.5 My requests for `it_admin`: own changes, Cancel a pending one with `DELETE /v1/changes/:id`
- [x] 1.6 Approvals navigation item with the pending count, polled every 30 s while visible
- [ ] 1.7 Tests: 202 shows the waiting message and leaves the row unchanged; approve, reject, cancel, failed and 409; manager has no page; count polls

## 2. downloads-page

- [x] 2.1 `/downloads` for `it_admin`: installers from `GET /v1/downloads`, fresh link on click; WorkBeat Setup steps without the key
- [ ] 2.2 Tests: no `GET /v1/license` or setup-step call; company admin and manager are sent to Overview

## 3. Rework for the new IT Admin role

- [x] 3.1 Navigation per role (Downloads, Approvals; no Deployment for IT)
- [x] 3.2 Employees, employee page (What is collected and Pause monitoring only), settings and pauses for `it_admin` as requests
- [x] 3.3 Devices: no seats header for IT; release as a request
- [x] 3.4 Alerts: Resolve as a request for IT; Person links to the employee page
- [x] 3.5 Block list, private sites, productivity rules: IT reads and requests
- [x] 3.6 Deployment and setup checklist `company_admin` only; IT Overview without checklist
- [x] 3.7 Team & roles "Who can do what": IT Admin column "Needs approval"
- [ ] 3.8 Update the role tests in changes 3–8 to the new matrix
