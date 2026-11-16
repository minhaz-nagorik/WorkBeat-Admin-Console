## Purpose

What an admin can do to a device from the portal: release it from monitoring or deactivate it,
knowing what each does, and how a device changes hands.

## ADDED Requirements

### Requirement: Admin and IT release a device
<!-- source: D38 · D45 · A7 · backend `device-lifecycle` · Prototype "Devices" -->
Release SHALL be offered to `company_admin` and `it_admin` on a device that is not released and, after a confirmation naming the hostname and employee, call `POST /v1/devices/:id/release`. The confirmation MUST say the seat and employee are freed, collection and blocking stop, the device uploads what it holds for up to 24 hours then wipes, and it returns only through a new WorkBeat Setup.

#### Scenario: Releasing a laptop
- **WHEN** IT confirms Release on NG-LT-0141
- **THEN** the device shows Released and seats used drops by one

### Requirement: Admin and IT deactivate a device
<!-- source: D6 · Plan-v3.5 §5.8 · A7 · backend `device-lifecycle` -->
Deactivate SHALL be offered on a device that is neither released nor deactivated and, after confirmation, call `POST /v1/devices/:id/deactivate`. The confirmation MUST say the seat is freed and the device stops collecting but keeps its block list until it is uninstalled, and that it is for a computer about to be uninstalled.

#### Scenario: Deactivating before uninstall
- **WHEN** IT confirms Deactivate
- **THEN** the device shows Deactivated and its seat is free

### Requirement: Conflicts refresh the device
<!-- source: A12 · backend `device-lifecycle` -->
A `409 CONFLICT` from release or deactivate SHALL refresh the device and say "This device was already released"; a repeated deactivate MUST simply show the device as Deactivated. A `404` MUST remove it from the list with "This device no longer exists".

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
No release or deactivate control SHALL be shown to a `manager`; a `403 FORBIDDEN` from either route MUST show the no-access message and change nothing on screen.

#### Scenario: An unexpected 403
- **WHEN** a release returns `403`
- **THEN** the device keeps its status and the no-access message is shown
