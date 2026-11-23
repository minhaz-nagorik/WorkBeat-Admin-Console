## Purpose

The Deployment page: everything IT needs to put WorkBeat on company computers with WorkBeat Setup
and the licence key, and to remove it, with no MDM.

## ADDED Requirements

### Requirement: Admin and IT see the licence key masked
<!-- source: D43 · A6 · A14 · backend `license-key` · Prototype "Deployment" -->
Deployment SHALL be shown to `company_admin` only. Step 1 MUST show `key_masked` from `GET /v1/license` with Show and Copy, which call `POST /v1/license/reveal` and keep the key in memory only; Hide and leaving the page MUST clear it. The page MUST say the key is the only install credential and that only WorkBeat support can replace it.

#### Scenario: Revealing the key
- **WHEN** the admin clicks Show
- **THEN** the full key is shown, and after navigating away and back it is masked again

#### Scenario: An IT admin types the address
- **WHEN** an `it_admin` opens `/deployment`
- **THEN** the app shows Overview and makes no `GET /v1/license` call

#### Scenario: Copying without showing
- **WHEN** the admin clicks Copy while the key is masked
- **THEN** the full key is copied to the clipboard and stays masked on screen

### Requirement: Seats are shown beside the key
<!-- source: D43 · backend `license-key` · Prototype "Deployment" -->
The page SHALL show `seats_used` of `seat_limit` ("unlimited" when null) and explain that each installed computer uses one seat, a full licence installs nothing more, and releasing or deactivating a device on Devices frees its seat at once.

#### Scenario: All seats used
- **WHEN** `seats_used` equals `seat_limit`
- **THEN** the seats box warns that no more computers can be installed until a seat is freed

### Requirement: Installers download through short-lived links
<!-- source: W31 · A6 · backend `installer-downloads` -->
The page SHALL list WorkBeat Setup for Windows and Mac first, then the agent installers per platform and architecture, each with version and size from `GET /v1/downloads`. A click MUST fetch a fresh list and start the download from that `url`; links MUST NOT be kept or shown as text. A platform with no live release MUST show "Not available yet".

#### Scenario: An expired link
- **WHEN** the admin clicks Download an hour after the page loaded
- **THEN** the page fetches a new signed link and the download starts

### Requirement: Install steps are WorkBeat Setup only
<!-- source: D40 · D42 · D47 · Plan-v3.5 §5.1 -->
Step 2 SHALL give the WorkBeat Setup steps: download, run as an administrator, paste the licence key, pick the employee who uses the computer (required), done; and a scripted form `WorkBeatSetup --license-key <key> --employee-email <email> --silent`. It MUST offer no MDM option, guide or file, and MUST say an employee must exist on Employees before their computer is installed.

#### Scenario: Looking for an MDM
- **WHEN** the admin reads step 2
- **THEN** there is no MDM choice and the only route is WorkBeat Setup

### Requirement: The page warns about local administrators
<!-- source: D40 · Plan-v3.5 §5.1 -->
Step 2 SHALL warn that someone with administrator rights on a computer can remove WorkBeat, that employees should be standard users, and that a computer that stops reporting shows as Offline on the Devices page (backend B34).

#### Scenario: Reading the warning
- **WHEN** the admin reads step 2
- **THEN** the standard-user warning is shown below the steps

### Requirement: The uninstall token is revealed on request
<!-- source: D19 · D40 · A6 · backend `license-key` -->
The page SHALL have an Uninstall section explaining that removing WorkBeat needs administrator rights and the company uninstall token and frees the seat, with Show and Copy calling `POST /v1/license/uninstall-token/reveal`, held in memory only, and the uninstall command per platform with the token as a placeholder.

#### Scenario: Revealing the token
- **WHEN** the admin clicks Show in the Uninstall section
- **THEN** the token is shown and is cleared when the page is left

### Requirement: The Company Admin sets the minimum agent version
<!-- source: D40 · backend `agent-updates` · backend `agent-releases` (`GET /v1/agent-versions`) -->
The page SHALL show the company's minimum agent version with a choice of none or a live version from `GET /v1/agent-versions` (newest first, per platform), saved with `PUT /v1/deployment/min-agent-version`, and say that devices below it are flagged Outdated and update themselves. `422 VALIDATION_FAILED` MUST say the version is above the newest release.

#### Scenario: Raising the minimum
- **WHEN** the admin sets the minimum to 1.0.4 and saves
- **THEN** devices on 1.0.3 show Outdated on Devices
