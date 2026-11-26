## Purpose

What an admin can do to a device from the portal: release it from monitoring, knowing what it does, and how a device changes hands.

## ADDED Requirements

### Requirement: Admin and IT release a device
<!-- source: D38 · D45 · A7 · A14 · backend `device-lifecycle` · Prototype "Devices" -->
Release SHALL be offered to `company_admin` and `it_admin` on a device that is not released and, after a confirmation naming the hostname and employee, call `POST /v1/devices/:id/release`. The confirmation MUST say the seat and employee are freed, collection and blocking stop, the device uploads what it holds for up to 24 hours then wipes, and it returns only through a new WorkBeat Setup.

#### Scenario: Releasing a laptop
- **WHEN** a Company Admin confirms Release on NG-LT-0141
- **THEN** the device shows Released and seats used drops by one

### Requirement: There is no deactivate
<!-- source: backend B35 · backend B36 · A18 · product owner 26 Nov 2026 -->
The portal SHALL offer Release as the only device action and MUST NOT show a Deactivate control or a Deactivated status anywhere. Device detail MUST say that Release leaves WorkBeat on the computer, switched off, that the WorkBeat Uninstaller removes it and frees the seat, and that a computer from which WorkBeat was deleted another way is released.

#### Scenario: The actions of a monitored device
- **WHEN** a Company Admin opens a device that is not released or uninstalled
- **THEN** the only action is Release, and it explains Release, the Uninstaller and a deletion without it

#### Scenario: An uninstalled device
- **WHEN** a Company Admin opens a device with status `uninstalled`
- **THEN** no action is offered, and it says WorkBeat was removed with the Uninstaller and the seat is free

### Requirement: An IT Admin's release waits for approval
<!-- source: A14 · product owner 17 Nov 2026 · backend round 6 `POST /v1/devices/:id/release` -->
For `it_admin` release SHALL keep the same confirmation and, on `202 { change }`, show "Waiting for approval" per `change-approvals`; the device MUST keep its status and seat until a Company Admin approves.

#### Scenario: IT requests a release
- **WHEN** an `it_admin` confirms Release on NG-LT-0141
- **THEN** the page says the release waits for approval and the device still shows its status

### Requirement: Conflicts refresh the device
<!-- source: A12 · backend `device-lifecycle` -->
A `409 CONFLICT` from release SHALL refresh the device and say "This device was already released". A `404` MUST remove it from the list with "This device no longer exists".

#### Scenario: Two admins release at once
- **WHEN** a release returns `409` because another admin released it first
- **THEN** the device shows Released with the already-released message

### Requirement: There is no reassign
<!-- source: D48 · B20 · Plan-v3.5 §5.3 -->
The portal SHALL offer no control that moves a device to another employee. Where an admin looks for one (device detail, employee page), it MUST explain: release the device here, then run WorkBeat Setup on it and pick the new employee, which uses a seat.

#### Scenario: Giving a laptop to a new hire
- **WHEN** an admin looks for how to give NG-LT-0141 to another employee
- **THEN** the page explains release then WorkBeat Setup, and no reassign button exists

### Requirement: Managers never act on devices
<!-- source: backend `role-access` · backend `device-lifecycle` -->
No release control SHALL be shown to a `manager`; a `403 FORBIDDEN` from the route MUST show the no-access message and change nothing on screen.

#### Scenario: An unexpected 403
- **WHEN** a release returns `403`
- **THEN** the device keeps its status and the no-access message is shown
