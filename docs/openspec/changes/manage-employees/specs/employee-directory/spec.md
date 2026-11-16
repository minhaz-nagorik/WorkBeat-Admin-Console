## Purpose

The Employees page: who is monitored, who adds, edits, imports and removes them, and what each role
sees of the list.

## ADDED Requirements

### Requirement: The Employees page lists the role's employees
<!-- source: Plan-v3.5 §4.5 · B12 · backend `employee-directory` · backend `manager-teams` · Prototype "Employees" -->
The Employees page SHALL be open to `company_admin` (every non-archived employee) and `manager` (own team only, from `GET /v1/employees`), showing name, email, department, manager name (from `GET /v1/team`, admin only) and the hostnames in each employee's `devices`. `it_admin` MUST have no Employees page. Search MUST match name, email, department and hostname; a department dropdown MUST filter.

#### Scenario: A manager opens Employees
- **WHEN** a `manager` opens the Employees page
- **THEN** only employees whose manager is the caller are listed and the page says the list is read only

#### Scenario: An IT admin
- **WHEN** an `it_admin` opens `/employees`
- **THEN** the app shows Overview

### Requirement: Each employee shows a live status
<!-- source: A4 · backend `employee-directory` (`presence`) · Prototype "Employees" -->
For `company_admin` and `manager` the list SHALL show each employee's `presence` from `GET /v1/employees` as "Active", "Idle", "Offline", "Monitoring paused", "Tamper" or "No device", and a status filter with those values and their counts. The page MUST NOT derive status from `GET /v1/devices`.

#### Scenario: A manager's team
- **WHEN** a `manager` opens Employees
- **THEN** each team member shows their status and the status filter works

#### Scenario: Only a released device
- **WHEN** an employee's `presence` is `no_device`
- **THEN** the status reads "No device"

### Requirement: Company admins add and edit employees
<!-- source: D47 · backend `employee-directory` · A12 · Prototype "Add employee" -->
A `company_admin` SHALL add and edit an employee in a dialog with name and work email (both required), department (suggesting existing ones) and manager (enabled users with role `manager`), through `POST /v1/employees` or `PATCH /v1/employees/:id`. A `409 CONFLICT` MUST say "Another employee already uses this email". The email hint MUST say IT picks this person in WorkBeat Setup or passes the email to a scripted install.

#### Scenario: No email
- **WHEN** the admin saves an employee without a work email
- **THEN** the dialog says the email is needed and sends nothing

#### Scenario: A duplicate email
- **WHEN** the admin saves an email held by another employee
- **THEN** the dialog stays open with the duplicate-email message under the email field

### Requirement: Employees are imported from CSV after a check
<!-- source: backend `employee-directory` · A12 · Prototype "Import employees from CSV" -->
A `company_admin` SHALL import employees by choosing a CSV file or pasting text in the format `name, email, department, manager email`, with a template download, sent as the raw file with `Content-Type: text/csv` (up to 2 MiB and 5,000 rows). Check MUST preview the rows before Import is enabled; on `422 VALIDATION_FAILED` the dialog MUST list each invalid line number and import nothing; `413 PAYLOAD_TOO_LARGE` MUST say the file is too large. A result MUST show created and skipped counts and the skipped emails.

#### Scenario: One bad line
- **WHEN** line 7 has no name or no email
- **THEN** the dialog names line 7 and no employee is created

#### Scenario: Existing emails
- **WHEN** the file has two emails that already exist
- **THEN** the result shows them as skipped and the rest as created

### Requirement: Removing an employee archives them
<!-- source: D46 · D48 · backend `employee-directory` · A7 -->
Remove SHALL confirm that the employee leaves the list and reports while their history is kept under the retention setting, then call `DELETE /v1/employees/:id`. On `409 EMPLOYEE_HAS_DEVICES` the dialog MUST name the employee's unreleased devices and say to release them on the Devices page first, with a link; it MUST NOT offer to reassign.

#### Scenario: An employee with a bound device
- **WHEN** the admin removes an employee whose device NG-LT-0141 is not released
- **THEN** the dialog says to release NG-LT-0141 first and the employee is not removed

### Requirement: Archived employees are viewable and read-only
<!-- source: D46 · backend `employee-directory` -->
A "Show removed employees" filter SHALL list archived employees through `GET /v1/employees?archived=true` with the date removed. An archived employee's pages MUST show their reports and history and MUST hide Edit, Remove, monitoring-setting and pause controls.

#### Scenario: Opening a removed employee
- **WHEN** an admin opens an archived employee
- **THEN** the report tabs work and no edit, settings or pause control is shown
