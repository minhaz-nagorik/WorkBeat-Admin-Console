## Purpose

The Employees page: who is monitored, who adds, edits, imports and removes them, and what each role
sees of the list.

## ADDED Requirements

### Requirement: The Employees page lists the role's employees
<!-- source: Plan-v3.5 §4.5 · B12 · A14 · backend `employee-directory` · backend `manager-teams` · Prototype "Employees" -->
The Employees page SHALL be open to `company_admin` and `it_admin` (every non-archived employee) and `manager` (own team only), from `GET /v1/employees`, showing name, email, department, manager name (from `GET /v1/team`, `company_admin` only) and the hostnames in each employee's `devices`. Search MUST match name, email, department and hostname; a department dropdown MUST filter.

#### Scenario: A manager opens Employees
- **WHEN** a `manager` opens the Employees page
- **THEN** only employees whose manager is the caller are listed and the page says the list is read only

#### Scenario: An IT admin
- **WHEN** an `it_admin` opens `/employees`
- **THEN** every employee is listed with Add, Import, Edit and Remove, and no manager column

### Requirement: Each employee shows a live status
<!-- source: A4 · B31 · backend `employee-directory` (`presence`) · Prototype "Employees" -->
For `company_admin`, `it_admin` and `manager` the list SHALL show each employee's `presence` from `GET /v1/employees` as "Active", "Idle", "Offline", "Monitoring paused" or "No device", and a status filter with those values and their counts. The page MUST NOT derive status from `GET /v1/devices`.

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

### Requirement: IT Admins request employee changes
<!-- source: A14 · product owner 17 Nov 2026 · backend round 6 `POST /v1/employees` -->
For `it_admin` add, edit, CSV import and remove SHALL use the same dialogs, pages and checks, without the manager field, and on `202 { change }` show "Waiting for approval" per `change-approvals` and leave the list unchanged. A CSV import MUST still show its red lines before anything is stored.

#### Scenario: IT adds an employee
- **WHEN** an `it_admin` saves a new employee and the API answers `202`
- **THEN** the list does not show them yet and the page says the addition waits for approval

### Requirement: Employees are imported from CSV after a check
<!-- source: backend `employee-directory` · A12 · product owner 23 Nov 2026 -->
A user with `employees.edit` SHALL import on the Import employees page: download the template (`name, email, department, manager email`), choose a CSV of up to 2 MiB and 500 rows, and see every row after `POST /v1/employees/import/check`, green when valid and red with its reasons in words. `413 PAYLOAD_TOO_LARGE` MUST say the file is too large.

#### Scenario: One bad line
- **WHEN** line 7 has no name
- **THEN** line 7 is red and says the name is missing, and the other lines are green

#### Scenario: An existing employee
- **WHEN** line 2 holds the email of a current employee
- **THEN** line 2 is red and says an employee with this email already exists

#### Scenario: A removed employee's email
- **WHEN** line 3 holds the email of Sadia Khan, who was removed
- **THEN** line 3 is red and says to restore her from the removed employees

### Requirement: Red lines are fixed or the import is cancelled
<!-- source: backend `employee-directory` · A11 · product owner 23 Nov 2026 -->
Each line SHALL be editable and removable; any change MUST require Check again before Import. Import MUST be enabled only when every line is green, MUST send all lines as one `text/csv` file to `POST /v1/employees/import`, and on `201` MUST show the number created. Cancel import MUST return to Employees with nothing stored. Status MUST be in words as well as colour.

#### Scenario: A fixed line
- **WHEN** the admin corrects line 7's name and checks again
- **THEN** every line is green and Import adds all of them

#### Scenario: Cancelled
- **WHEN** the admin chooses Cancel import
- **THEN** the Employees page opens and no employee is created

### Requirement: Removing an employee archives them
<!-- source: D46 · D48 · backend `employee-directory` · A7 -->
Remove SHALL confirm that the employee leaves the list and reports while their history is kept under the retention setting, then call `DELETE /v1/employees/:id`. On `409 EMPLOYEE_HAS_DEVICES` the dialog MUST name the employee's unreleased devices and say to release them on the Devices page first, with a link; it MUST NOT offer to reassign.

#### Scenario: An employee with a bound device
- **WHEN** the admin removes an employee whose device NG-LT-0141 is not released
- **THEN** the dialog says to release NG-LT-0141 first and the employee is not removed

### Requirement: Archived employees are viewable and read-only
<!-- source: D46 · backend `employee-directory` -->
A "Show removed employees" filter SHALL list archived employees through `GET /v1/employees?archived=true` with the date removed. An archived employee's pages MUST show their reports and history and MUST hide Edit, Remove, monitoring-setting and pause controls; Restore is the only action.

#### Scenario: Opening a removed employee
- **WHEN** an admin opens an archived employee
- **THEN** the report tabs work and no edit, settings or pause control is shown

### Requirement: A removed employee is restored, not added again
<!-- source: D46 · backend `employee-directory` -->
A `company_admin` SHALL restore an archived employee from the removed list and from their page through `POST /v1/employees/:id/restore`, after saying their history and past hours return to reports. On `409 CONFLICT` or `422` naming `email` the dialog MUST ask for a new work email and send it. Add employee MUST offer to restore an archived employee with the typed email, and an import refused with `archived` MUST name them.

#### Scenario: Restoring from the removed list
- **WHEN** the admin restores Sadia Khan and her email is free
- **THEN** she is back in the employee list with her history, and can be edited

#### Scenario: Her email was given to someone else
- **WHEN** the restore answers `409 CONFLICT`
- **THEN** the dialog says another employee uses that email and asks for a new one

#### Scenario: Adding a removed person again
- **WHEN** the admin types the email of a removed employee in Add employee
- **THEN** the dialog names that employee and offers Restore instead

#### Scenario: Other roles
- **WHEN** an `it_admin` or a `manager` views a removed employee
- **THEN** no Restore control is shown
