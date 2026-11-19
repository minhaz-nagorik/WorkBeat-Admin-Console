## Purpose

The Company settings form: which time zone days follow, and when an employee counts as idle. Other
company details are managed by WorkBeat staff (A15).

## ADDED Requirements

### Requirement: Only a Company Admin opens Company settings
<!-- source: backend `role-access` · backend `company-settings` · Plan-v3.5 §4.5 -->
The Company settings page SHALL be in the navigation and reachable for `company_admin` only, loading `GET /v1/company/settings`. Any other role MUST be sent to its landing page by the shell.

#### Scenario: An IT admin opens the address
- **WHEN** an `it_admin` opens `/settings`
- **THEN** the app shows Overview

### Requirement: The company form saves time zone and idle threshold only
<!-- source: A15 · B19 · D15 · backend `company-settings` (B29) -->
The form SHALL edit `timezone` (a searchable list of IANA zones) and `idle_threshold_seconds` (minutes, 1 to 60), and save only those two with `PATCH /v1/company/settings`, then reload `GET /v1/me` so the time zone applies across the app at once. A `422` MUST appear beside its field. The page MUST NOT show or send the company name, data retention, a custom domain, the monitoring notice, billing or a screenshot interval, and MUST say that intervals are set on each employee.

#### Scenario: Changing the time zone
- **WHEN** an admin picks `Asia/Dhaka` and saves
- **THEN** the page sends `timezone` `Asia/Dhaka` and dates across the app follow it

#### Scenario: An idle threshold out of range
- **WHEN** an admin types 90 minutes
- **THEN** the form refuses it beside the field and sends nothing

#### Scenario: What the page holds
- **WHEN** a company admin opens Company settings
- **THEN** only the time zone and idle threshold are shown, with no billing, domain, notice, name or retention

### Requirement: The idle threshold says what it changes
<!-- source: D15 · backend `company-settings` -->
The idle threshold field SHALL explain that a computer with no keyboard or mouse use for that long counts as idle, and that computers pick up a change within 30 minutes.

#### Scenario: Reading the field
- **WHEN** an admin focuses the idle threshold
- **THEN** its hint explains idle and the 30-minute update
