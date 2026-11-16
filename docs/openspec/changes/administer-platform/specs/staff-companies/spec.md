## Purpose

The Companies page of the staff area: every customer account with its plan, seats, status and
estimated revenue, and the actions staff may take on it.

## ADDED Requirements

### Requirement: Staff pages state the data boundary
<!-- source: D41 · backend `staff-data-boundary` · Prototype "Companies" -->
Every staff page SHALL open with a notice that employee names, activity, URLs and screenshots are never visible here, and MUST show no employee, device, activity, URL or screenshot data. Staff pages MUST be open to `super_admin` only.

#### Scenario: A company admin opens a staff address
- **WHEN** a `company_admin` opens `/staff/companies`
- **THEN** the app shows Overview

### Requirement: Companies are listed with totals
<!-- source: backend `staff-companies` · Prototype "Companies" -->
The Companies page SHALL call `GET /v1/staff/companies` and show totals (companies, seats used, monthly revenue labelled an estimate, suspended), and a row per company with `name`, `slug` address, `created_at`, `plan`, `seats_used` of `seat_limit`, `screenshot_tier`, `mrr_estimate` and `status` (with `suspended_reason`), filterable by status (sent as `status`) and searchable by name or slug.

#### Scenario: Only suspended companies
- **WHEN** staff pick the Suspended filter
- **THEN** the page calls `GET /v1/staff/companies?status=suspended`

### Requirement: Staff suspend and restore a company
<!-- source: D29 · backend `staff-companies` · A7 -->
Suspend SHALL confirm that every device of the company stops collecting and shows the employee a notice, then call `POST /v1/staff/companies/:id/suspend`; Restore MUST confirm and call `.../restore`. Neither MUST be offered for an `expired` company, and a `409 CONFLICT` MUST read "An expired company can't be suspended or restored".

#### Scenario: Suspending a company
- **WHEN** staff confirm Suspend on an active company
- **THEN** its row shows Suspended with the reason "By WorkBeat"

### Requirement: Staff set an Enterprise plan and seat limit
<!-- source: D43 · backend `staff-companies` -->
"Enterprise seats" SHALL be offered on every company and set plan `enterprise` with `seat_limit` (a number, or empty for unlimited) through `PATCH /v1/staff/companies/:id/license`, showing seats in use; a Starter or Growth company moves to Enterprise. A `409 CONFLICT` MUST read that the limit cannot go below seats in use.

#### Scenario: A limit below seats in use
- **WHEN** staff set 40 seats for a company using 45
- **THEN** the dialog shows the below-seats-in-use message and nothing changes

### Requirement: Staff set the expired-licence grace period
<!-- source: D36 · backend `staff-companies` -->
The company dialog SHALL edit `expired_blocking_grace_days` (0–365, default 30) through `PATCH /v1/staff/companies/:id`, prefilled from the company row's `expired_blocking_grace_days`, explaining that after this many days an expired company's computers stop blocking websites. A `422` MUST appear beside the field.

#### Scenario: A longer grace period
- **WHEN** staff set 60 days
- **THEN** the page sends `expired_blocking_grace_days` 60 and confirms
