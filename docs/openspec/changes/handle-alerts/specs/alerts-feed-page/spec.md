## Purpose

The Alerts page: every tamper and offline event the user may see, in plain words, filterable by
type and state, with a Resolve action for the people who fix them.

## ADDED Requirements

### Requirement: The Alerts page lists events in a compact table
<!-- source: backend `alerts-feed` · A8 · Prototype "Alerts" -->
The Alerts page SHALL call `GET /v1/alerts` and show one table row per event, newest first, with the columns When (`occurred_at`), Alert (the type label as a pill), Person (the employee `name`, linking to the employee page for roles that may open it), Computer (`hostname`) and What happened (a one-line description built from `event_type` and `detail`), plus a repeat count when `repeat_count` is above 1.

#### Scenario: Two events
- **WHEN** the feed returns a `hosts_modified` and an `offline` event
- **THEN** each is one table row with time, label, person, computer and description, newest first

#### Scenario: A manager sees another team's person
- **WHEN** a person on the alert is not one the user may open
- **THEN** the Person column shows the name as text, not a link

### Requirement: Alert types read in plain language
<!-- source: A4 · D24 · backend `tamper-ingestion` · Prototype "Alerts" -->
The page SHALL label `process_restart` "WorkBeat was closed", `hosts_modified` "Website blocking changed", `config_changed` "WorkBeat settings edited", `clock_tampered` "Computer clock changed", `permission_revoked` "Permission turned off", `offline` "Computer offline" and `duplicate_device_id` "Possible duplicate computer". No technical term (hosts file, heartbeat, watchdog, enum value) MUST appear in a label or description.

#### Scenario: A hosts file event
- **WHEN** the feed returns `hosts_modified`
- **THEN** the row reads "Website blocking changed" and "Another program tried to undo website blocking. WorkBeat put it back."

### Requirement: Alerts are filtered by type, state and search
<!-- source: backend `alerts-feed` (`counts`, `employee_id`) · A8 · Prototype "Alerts" -->
The toolbar SHALL offer a search box sent as `q` (up to 100 characters; text matching a type label also selects that `type`), an alert-type dropdown ("All alerts" and each type with its count from the response's `counts`) and a state filter Open / Resolved / All defaulting to Open, sent as `type` and `state` to `GET /v1/alerts`. Opened from an employee page, it MUST also send `employee_id` and show a removable "Person" chip. Rows come from `items`; more load through `next_cursor`. A filter change MUST restart at page one.

#### Scenario: Only offline alerts
- **WHEN** the user picks "Computer offline (5)" in the type dropdown
- **THEN** the page calls `GET /v1/alerts?type=offline&state=open` and shows only those rows

#### Scenario: Opened from an employee page
- **WHEN** the user follows "All alerts" from Ana Silva's employee page
- **THEN** the page calls `GET /v1/alerts` with Ana's `employee_id` and shows a Person chip that clears the filter

### Requirement: Each role sees its own alerts
<!-- source: backend `alerts-feed` · backend `role-access` · D41 -->
The Alerts page SHALL be open to `company_admin`, `it_admin` and `manager`, showing what `GET /v1/alerts` returns for the caller: every computer for admins and IT, only the own team's for a manager. A `super_admin` MUST NOT see the page or its navigation item.

#### Scenario: A manager's alerts
- **WHEN** a manager opens Alerts
- **THEN** only alerts for computers of employees on their team are shown

### Requirement: Admins and IT resolve an alert
<!-- source: backend `alerts-feed` · A7 · A14 -->
For `company_admin` and `it_admin` each open row SHALL offer Resolve, which calls `POST /v1/alerts/:id/resolve`; on `200` it shows the row as resolved with when and by whom (`resolved_by_name`, or "a removed user" when `null`). A `manager` MUST NOT see the Resolve control. Resolving MUST NOT need a confirmation, since it deletes nothing. On `202 { change }` (an `it_admin`) the row MUST stay open and the page show "Waiting for approval" per `change-approvals`.

#### Scenario: An admin resolves a tamper alert
- **WHEN** a `company_admin` clicks Resolve on an open alert
- **THEN** the row leaves the Open view and shows in Resolved with their name and the time

#### Scenario: IT requests a resolve
- **WHEN** an `it_admin` clicks Resolve and the API answers `202`
- **THEN** the row stays in the Open view and the page says the resolve waits for approval

### Requirement: The page explains each alert and refreshes itself
<!-- source: A5 · A4 · Prototype "Alerts" -->
Below the table a collapsed "What each alert means" section SHALL explain each type in one plain sentence, including that a Computer offline alert is often a computer switched off. The table MUST poll every 30 seconds while visible without losing the user's filters, search or page.

#### Scenario: A new alert while reading
- **WHEN** a new event is stored while the page is open on the Open view
- **THEN** it appears at the top within 1 minute and the filters stay as they were
