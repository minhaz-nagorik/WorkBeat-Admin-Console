## Purpose

The Downloads page: the WorkBeat installers and install steps for the IT Admin, who no longer has
the Deployment page, licence key or uninstall token.

## ADDED Requirements

### Requirement: IT Admins have a Downloads page
<!-- source: A14 · product owner 17 Nov 2026 · backend round 6 `GET /v1/downloads` -->
The Downloads page at `/downloads` SHALL be shown to `it_admin` only and list WorkBeat Setup for Windows and Mac first, then the agent installers per platform and architecture, with version and size from `GET /v1/downloads`. A click MUST fetch a fresh list and start the download from that `url`; links MUST NOT be kept or shown as text. A platform with no live release MUST show "Not available yet".

#### Scenario: An expired link
- **WHEN** IT clicks Download an hour after the page loaded
- **THEN** the page fetches a new signed link and the download starts

#### Scenario: A Company Admin types the address
- **WHEN** a `company_admin` opens `/downloads`
- **THEN** the app shows Overview, since Deployment holds the downloads for them

### Requirement: Install steps without the licence key
<!-- source: A14 · D40 · D42 · D47 · Plan-v3.5 §5.1 -->
The page SHALL give the WorkBeat Setup steps (download, run as an administrator, paste the licence key, pick the employee, done) and the scripted form with `<key>` as a placeholder, and say the Company Admin gives the licence key. It MUST NOT call `GET /v1/license`, a reveal route or `POST /v1/company/setup/steps`, and MUST offer no MDM option.

#### Scenario: Looking for the key
- **WHEN** IT reads the install steps
- **THEN** the page says to ask the Company Admin for the licence key and shows no key or uninstall token

### Requirement: The page warns about local administrators
<!-- source: D40 · Plan-v3.5 §5.1 -->
The page SHALL warn that someone with administrator rights on a computer can remove WorkBeat, that employees should be standard users, and that an employee must exist on Employees before their computer is installed.

#### Scenario: Reading the warning
- **WHEN** IT reads the install steps
- **THEN** the standard-user warning is shown below them
