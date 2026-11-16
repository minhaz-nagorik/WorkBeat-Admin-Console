## Purpose

The first-run checklist that takes a new company from signing up to its first monitored device,
for the Company Admin and the IT Admin.

## ADDED Requirements

### Requirement: Admin and IT see the setup checklist until it is done
<!-- source: Plan-v3.5 §4.5 "Onboarding" · backend `configure-company` -->
For `company_admin` and `it_admin`, Overview and Deployment SHALL show the checklist from `GET /v1/company/setup` while any step is not `done`: download WorkBeat Setup, copy the licence key, install the first device, first device seen. Done steps MUST show a tick; the card MUST disappear once all four are done. Managers MUST NOT see it.

#### Scenario: A new company
- **WHEN** a Company Admin of a company with no device opens Overview
- **THEN** the checklist shows four steps with none ticked

#### Scenario: All done
- **WHEN** every step is `done`
- **THEN** no checklist is shown

### Requirement: Download and copy steps are marked by doing them
<!-- source: backend `configure-company` -->
Downloading WorkBeat Setup from Deployment SHALL call `POST /v1/company/setup/steps` with `step` `download_downloader`, and copying or revealing the licence key with `copy_license_key`. A failed mark MUST NOT block the download or the copy.

#### Scenario: Copying the key
- **WHEN** IT copies the licence key
- **THEN** the copy-key step is ticked

### Requirement: Device steps follow the devices
<!-- source: backend `configure-company` · A5 -->
"Install the first device" and "First device seen" SHALL come only from the API's `done` values and refresh with the page's polling, so the first heartbeat ticks the last step without a reload. Each step MUST link to where it is done (Deployment, Devices).

#### Scenario: The first heartbeat
- **WHEN** the first device sends its first heartbeat while IT has Deployment open
- **THEN** "First device seen" is ticked within 1 minute
