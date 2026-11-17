## Purpose

Changes an IT Admin asks for and a Company Admin approves: what the IT Admin is told after a write,
the Approvals page for both roles, and the navigation count of pending changes.

## ADDED Requirements

### Requirement: An IT Admin's write waits for approval
<!-- source: A14 · product owner 17 Nov 2026 · backend round 6 `202 { change }` -->
When a write returns `202 Accepted` with `{ change }`, the page SHALL close the dialog or confirmation, say "Waiting for approval" with the change's `summary` and that a Company Admin must approve it, link to My requests, and MUST leave the data on screen as it was. A `400`, `404`, `409` or `422` MUST be shown at once as for any write (A12).

#### Scenario: IT releases a laptop
- **WHEN** an `it_admin` confirms Release on NG-LT-0141 and the API answers `202`
- **THEN** the page says "Waiting for approval: Release computer NG-LT-0141" and the device keeps its status

#### Scenario: A refused request
- **WHEN** an `it_admin` adds an employee whose email is taken and the API answers `409`
- **THEN** the dialog shows the duplicate-email message and no waiting message

### Requirement: Company Admins list every change
<!-- source: A14 · A8 · backend round 6 `GET /v1/changes` -->
For `company_admin` the Approvals page at `/approvals` SHALL list `GET /v1/changes` with summary, requester (`requested_by.name`), when asked, status and, once decided, who and when; pending changes MUST come first, then the rest newest first. A status dropdown (Waiting for approval, Approved, Rejected, Cancelled, Failed, All) and a type dropdown from `resource`, search and a pager MUST be offered.

#### Scenario: Two pending and one approved
- **WHEN** the company has two pending changes and one approved
- **THEN** the two pending ones are listed first, each with Approve and Reject

### Requirement: A Company Admin approves a change
<!-- source: A14 · A12 · backend round 6 `POST /v1/changes/:id/approve` -->
Each pending row SHALL offer Approve, confirmed in place with the `summary`, which calls `POST /v1/changes/:id/approve` and shows the returned status. `409 CONFLICT` MUST reload the list and say the change was already decided or cancelled.

#### Scenario: Approving a block rule
- **WHEN** a Company Admin approves "Block website facebook.com"
- **THEN** the row shows Approved with their name and the time, and the rule is on the block list

#### Scenario: Decided meanwhile
- **WHEN** another Company Admin rejected the change first and the approve returns `409`
- **THEN** the list reloads and says the change was already decided

### Requirement: A failed approval says why
<!-- source: A14 · A4 · A12 · backend round 6 change `error` -->
When the approve answers `200` with `status` `failed`, the row SHALL show Failed and say in plain language why the change could no longer be applied, from `error.code` (for `409 CONFLICT`, that the record changed meanwhile), never the raw code. A failed change MUST offer no action.

#### Scenario: The employee was removed meanwhile
- **WHEN** an approval of "Edit employee Ada Lovelace" returns `failed` with a `409` error
- **THEN** the row shows Failed and that the employee changed since the request, with no Approve button

### Requirement: A Company Admin rejects a change with a reason
<!-- source: A14 · backend round 6 `POST /v1/changes/:id/reject` -->
Each pending row SHALL offer Reject, which asks for an optional reason of up to 500 characters and calls `POST /v1/changes/:id/reject` with `{ reason }`. The row MUST then show Rejected with the reason; `409 CONFLICT` MUST reload the list as for Approve.

#### Scenario: Rejecting with a reason
- **WHEN** a Company Admin rejects a change with "Not before the audit"
- **THEN** the row shows Rejected and the reason

### Requirement: IT Admins follow their own requests
<!-- source: A14 · backend round 6 `GET /v1/changes` · `DELETE /v1/changes/:id` -->
For `it_admin` the page SHALL be "My requests", listing the caller's own changes from `GET /v1/changes` with the same columns, filters and the rejection reason or failure, and no Approve or Reject. A pending row MUST offer Cancel, confirmed in place, calling `DELETE /v1/changes/:id`; on `204` it MUST show Cancelled, and `404` or `409` MUST reload and say it was already decided.

#### Scenario: Cancelling a request
- **WHEN** an IT Admin cancels a pending request
- **THEN** the row shows Cancelled and leaves the pending count

#### Scenario: Reading a rejection
- **WHEN** a Company Admin rejected the IT Admin's request with a reason
- **THEN** My requests shows Rejected with that reason

### Requirement: Managers and staff have no Approvals page
<!-- source: A14 · backend round 6 (`manager` → `403`) · A3 -->
The Approvals page and its navigation item SHALL be shown to `company_admin` and `it_admin` only; a `manager` or `super_admin` opening `/approvals` MUST be sent to their landing page and MUST NOT call `GET /v1/changes`.

#### Scenario: A manager types the address
- **WHEN** a `manager` opens `/approvals`
- **THEN** the app shows Overview and makes no `GET /v1/changes` call

### Requirement: The navigation counts pending changes
<!-- source: A14 · A5 · backend round 6 `GET /v1/changes?status=pending` -->
The Approvals item SHALL show the number of pending changes the caller sees from `GET /v1/changes?status=pending` when it is above zero, refreshed every 30 seconds while the tab is visible and after the caller approves, rejects, cancels or requests a change.

#### Scenario: A new request arrives
- **WHEN** an IT Admin requests a change while a Company Admin has the console open
- **THEN** the Company Admin's Approvals count goes up within 1 minute
