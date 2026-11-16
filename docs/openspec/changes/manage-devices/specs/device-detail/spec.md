## Purpose

One device's health in detail, so IT can see why it needs attention and whom it is bound to.

## ADDED Requirements

### Requirement: A device opens its detail
<!-- source: Plan-v3.5 §4.5 "Devices" · backend `device-status` -->
Clicking a device SHALL open its detail from `GET /v1/devices/:id` for `company_admin` and `it_admin`: hostname, OS and version, architecture, agent version, status, badges, last seen, the bound employee and the actions. `404 NOT_FOUND` MUST show "This device no longer exists".

#### Scenario: Opening a device
- **WHEN** IT clicks NG-LT-0141
- **THEN** its detail shows its health and the employee it is bound to

### Requirement: Helper and browser access are shown per item
<!-- source: D39 · W11 · backend `device-status` -->
The detail SHALL show whether the WorkBeat helper is running, and for each browser in `browser_access` whether WorkBeat can read it (Allowed, Waiting for the employee, Can't read). On a Mac it MUST list Screen Recording, Accessibility and per-browser Automation as Allowed or Not yet allowed; on Windows it MUST say no permission is needed.

#### Scenario: A Mac with Automation pending for Chrome
- **WHEN** `browser_access` marks Chrome `pending`
- **THEN** Chrome shows "Waiting for the employee" with how to allow it

### Requirement: Agent health is shown in plain words
<!-- source: backend `device-status` (`health`) · A4 -->
The detail SHALL show `health` under "Agent health": data waiting to upload (`store_bytes`) and since when (`oldest_unsent_at`), records dropped, samples dropped, screenshots skipped, batches set aside, blocking status, helper restarts and failed uploads in 24 h, last update failure, uptime, Outdated, notice version acknowledged and policy version. A counter sent as an object MUST list each reason with its count.

#### Scenario: Before the first heartbeat
- **WHEN** the heartbeat fields of `health` are `null`
- **THEN** the section says WorkBeat has not reported from this computer yet

#### Scenario: Drops by reason
- **WHEN** `dropped_records` is `{ "store_full": 12, "too_old": 3 }`
- **THEN** records dropped lists "store_full" and "too_old" through the label map with 12 and 3

### Requirement: The detail says what to do
<!-- source: Plan-v3.5 §5.9 · A4 -->
For each badge the detail SHALL give the rollout action in plain words (`rollout-status`), and for status Tamper link to the device's open alerts.

#### Scenario: A tampered device
- **WHEN** the device status is `tamper`
- **THEN** the detail links to its open alerts

### Requirement: The binding's employee is fixed
<!-- source: D48 · B20 -->
The detail SHALL name the employee the device is set up for and say that this never changes while the device is monitored: to move it to someone else, release it and run WorkBeat Setup for the new person.

#### Scenario: Reading the employee line
- **WHEN** an admin reads the employee line
- **THEN** it names the employee and explains release then WorkBeat Setup
