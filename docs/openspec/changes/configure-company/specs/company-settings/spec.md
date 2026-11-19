## Purpose

The Company settings form: the company's name and address, how long data is kept, which time zone
days follow, and when an employee counts as idle.

## ADDED Requirements

### Requirement: Only a Company Admin opens Company settings
<!-- source: backend `role-access` · backend `company-settings` · Plan-v3.5 §4.5 -->
The Company settings page SHALL be in the navigation and reachable for `company_admin` only, loading `GET /v1/company/settings`. Any other role MUST be sent to its landing page by the shell.

#### Scenario: An IT admin opens the address
- **WHEN** an `it_admin` opens `/settings`
- **THEN** the app shows Overview

### Requirement: The company form saves name, time zone and idle threshold
<!-- source: B19 · D15 · backend `company-settings` · Prototype "Company settings" -->
The form SHALL edit `name` (1–100 characters), `timezone` (a searchable list of IANA zones) and `idle_threshold_seconds` (minutes, 1 to 60), show the dashboard address from `slug` read-only with "The address keeps its original name when you rename the company", and save with `PATCH /v1/company/settings`, then reload `GET /v1/me` so the new name and time zone apply across the app at once. A `422` MUST appear beside its field.

#### Scenario: Changing the time zone
- **WHEN** an admin picks `Asia/Dhaka` and saves
- **THEN** the page sends `timezone` `Asia/Dhaka` and dates across the app follow it

#### Scenario: An idle threshold out of range
- **WHEN** an admin types 90 minutes
- **THEN** the form refuses it beside the field and sends nothing

### Requirement: Retention is chosen in days and shortening is confirmed
<!-- source: B13 · backend `company-settings` · backend `data-retention` · A7 -->
The form SHALL edit `data_retention_days` as one of three choices: 30, 60 or 90 days (default), and offer no other value. Saving a shorter value MUST first confirm that activity and screenshots older than the new limit, naming the date, are deleted at the next nightly run.

#### Scenario: From 90 to 30 days
- **WHEN** an admin lowers retention from 90 to 30 days and saves
- **THEN** a confirmation names the date before which data will be deleted tonight

### Requirement: The idle threshold says what it changes
<!-- source: D15 · backend `company-settings` -->
The idle threshold field SHALL explain that a computer with no keyboard or mouse use for that long counts as idle, and that computers pick up a change within 30 minutes.

#### Scenario: Reading the field
- **WHEN** an admin focuses the idle threshold
- **THEN** its hint explains idle and the 30-minute update
