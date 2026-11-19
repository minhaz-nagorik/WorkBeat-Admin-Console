## Purpose

The rollout dashboard: how many devices are healthy, which need IT and what IT should do, with a
way into the devices behind each number.

## ADDED Requirements

### Requirement: Rollout counts come from the API
<!-- source: Plan-v3.5 §5.9 · backend `device-status` · Prototype "Deployment" -->
Rollout status SHALL show, for `company_admin` and `it_admin`, enrolled devices, seats and the healthy share from `GET /v1/rollout`, and one row per status or badge: Installed and working, Permission pending, Browser access pending, Outdated, Offline, Open alert, Paused, Released, Deactivated, each with its count.

#### Scenario: A mixed fleet
- **WHEN** 30 devices are healthy, 2 Macs await permission and 1 is offline
- **THEN** the card shows 30, 2 and 1 in those rows

### Requirement: Each row says what to do
<!-- source: Plan-v3.5 §5.9 · A4 -->
On Deployment every row SHALL carry the plan's action: permission pending "Ask the employee to allow it in System Settings", browser access pending "Ask the employee to allow WorkBeat for that browser, or update the browser", outdated "Check it can download the update, or run WorkBeat Setup again", offline "Check the computer is on and connected", open alert "Review the alert", paused "Nothing; it ends on schedule", released "Uninstall it, or run WorkBeat Setup to monitor it again", deactivated "Uninstall it".

#### Scenario: A Windows-only fleet
- **WHEN** every device runs Windows
- **THEN** Permission pending shows 0, since Windows never needs it

### Requirement: Rows open the matching devices
<!-- source: A3 · Prototype "Deployment" -->
Clicking a row SHALL open Devices filtered to that status or badge. The compact card on Overview (IT Admin) MUST show counts without the action column and link to Devices.

#### Scenario: Opening outdated devices
- **WHEN** IT clicks the Outdated row
- **THEN** Devices opens with the Outdated filter applied
