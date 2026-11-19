## Purpose

The Companies page of the staff area: every customer account with its plan, seats, status and
estimated revenue, and the actions staff may take on it.

## ADDED Requirements

### Requirement: Staff pages show no employee data
<!-- source: D41 · backend `staff-data-boundary` · product owner 16 Nov 2026 (no notice) -->
Staff pages SHALL show no employee, device, activity, URL or screenshot data, and MUST be open to `super_admin` only.

#### Scenario: A company admin opens a staff address
- **WHEN** a `company_admin` opens `/staff/companies`
- **THEN** the app shows Overview

### Requirement: Companies are listed with totals
<!-- source: backend `staff-companies` · Prototype "Companies" -->
The Companies page SHALL call `GET /v1/staff/companies` and show totals (companies, seats used, monthly revenue labelled an estimate, suspended), and a row per company with `name`, `slug` address, `created_at`, `plan`, `seats_used` of `seat_limit`, `screenshot_tier`, `mrr_estimate` and `status` (with `suspended_reason`), filterable by status (sent as `status`) and searchable by name or slug.

#### Scenario: Only suspended companies
- **WHEN** staff pick the Suspended filter
- **THEN** the page calls `GET /v1/staff/companies?status=suspended`

### Requirement: Each company row has one Manage button
<!-- source: A16 · product owner 19 Nov 2026 -->
Each company row SHALL carry a single "Manage" button. It opens a panel listing Plan and seats, Status (with the trial end), Name and retention, and Grace period, each with its current value and a "Change" button that opens that section's dialog.

#### Scenario: Changing the grace period
- **WHEN** staff click Manage on a company and then Change beside Grace period
- **THEN** the panel closes and the grace period dialog opens for that company

### Requirement: Staff end a trial
<!-- source: A16 · backend `staff-companies` (B30) -->
For a company in `trial` the Manage panel SHALL offer "End trial", which confirms and sends `PATCH /v1/staff/companies/:id` with `status` `active`. Suspending and restoring are done with Status.

#### Scenario: Ending a trial
- **WHEN** staff confirm End trial on a trial company
- **THEN** the page sends `status` `active` and the row shows Active

### Requirement: Staff set the plan, seats and screenshot plan
<!-- source: D43 · A16 · backend `staff-companies` (B30) -->
"Plan and seats" SHALL be offered on every company (Companies and Licences pages) and edit the plan (Starter, Growth, Enterprise), the seat limit (empty for unlimited, Enterprise only) and the screenshot plan through `PATCH /v1/staff/companies/:id/license`, showing seats in use. A `409 CONFLICT` MUST read that the limit cannot go below seats in use.

#### Scenario: A limit below seats in use
- **WHEN** staff set 40 seats for a company using 45
- **THEN** the dialog shows the below-seats-in-use message and nothing changes

#### Scenario: Unlimited on Growth
- **WHEN** staff leave the seat limit empty on Growth
- **THEN** the dialog refuses it beside the field and sends nothing

### Requirement: A lower screenshot plan is confirmed
<!-- source: A7 · A16 -->
Lowering the screenshot plan SHALL first confirm that faster employees are slowed to the new plan, or that screenshots stop for Off.

#### Scenario: Intensive down to Light
- **WHEN** staff change the screenshot plan from Intensive to Light and save
- **THEN** a confirmation says employees set faster than every 60 minutes are slowed to every 60 minutes

### Requirement: Staff set the company status
<!-- source: A16 · D29 · D36 · backend `staff-companies` (B30) -->
"Status" SHALL be offered on every company and set Trial (with 1–90 days from today), Active, Suspended or Expired through `PATCH /v1/staff/companies/:id`, explaining what each does to the company's computers. Moving to Suspended or Expired MUST be confirmed first.

#### Scenario: Expiring a company
- **WHEN** staff pick Expired and save
- **THEN** a confirmation says computers stop collecting and blocking ends after the grace period, before anything is sent

#### Scenario: A new trial
- **WHEN** staff pick Trial with 14 days
- **THEN** the page sends `status` `trial` with `trial_days` 14

### Requirement: Staff set the expired-licence grace period
<!-- source: D36 · backend `staff-companies` -->
The company dialog SHALL edit `expired_blocking_grace_days` (0–365, default 30) through `PATCH /v1/staff/companies/:id`, prefilled from the company row's `expired_blocking_grace_days`, explaining that after this many days an expired company's computers stop blocking websites. A `422` MUST appear beside the field.

#### Scenario: A longer grace period
- **WHEN** staff set 60 days
- **THEN** the page sends `expired_blocking_grace_days` 60 and confirms

### Requirement: Staff set the company name and retention
<!-- source: A15 · backend `staff-companies` (B29) · B13 -->
Each company row SHALL offer "Name and retention": a dialog with the name (1–100 characters) and data retention (30, 60 or 90 days), saved with `PATCH /v1/staff/companies/:id`. Lowering retention MUST first confirm that older activity and screenshots are deleted tonight and can't be recovered.

#### Scenario: Staff lower retention
- **WHEN** staff change a company from 90 to 30 days and save
- **THEN** a confirmation says older data is deleted tonight before the change is sent

### Requirement: Staff create a company with its first Company Admin
<!-- source: product owner 17 Nov 2026 · backend round 5 `POST /v1/staff/companies` -->
"Add company" SHALL open a dialog asking name, address (`slug`), plan, seats (unlimited only for Enterprise), screenshot plan, trial or active (with trial days), time zone, data retention and a required Company Admin email, and send `POST /v1/staff/companies`. On `201` the company MUST appear in the list and the page MUST say the licence key and sign-up link were emailed to that address.

#### Scenario: Data retention for a new company
- **WHEN** staff open "Add company"
- **THEN** data retention offers 30, 60 and 90 days, with 90 chosen

#### Scenario: A new customer
- **WHEN** staff add "Nagorik Technologies" with admin `ceo@nagorik.tech`
- **THEN** the company is listed and the page says the licence key and sign-up link went to `ceo@nagorik.tech`

### Requirement: A refused new company says what to fix
<!-- source: backend round 5 · A12 -->
A `409 CONFLICT` naming `slug` SHALL show "This address is already taken" under the address, and naming `admin_email` "This email already has an account or an open invitation" under the email; a `422` MUST show beside each named field. The dialog MUST stay open with what was typed.

#### Scenario: A taken address
- **WHEN** the address `acme` is already used
- **THEN** the dialog shows the taken-address message under the address and creates nothing
