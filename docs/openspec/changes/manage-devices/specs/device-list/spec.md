## Purpose

The Devices page: every company device with its employee, status and what needs attention, for the
Company Admin and the IT Admin.

## ADDED Requirements

### Requirement: Admin and IT list the company's devices
<!-- source: Plan-v3.5 §4.5 "Devices" · backend `device-status` · Prototype "Devices" -->
Devices SHALL be shown to `company_admin` and `it_admin` only, listing `GET /v1/devices`: hostname with OS and version, the bound employee's name (linking to the employee page), status, badges, agent version and last seen. For `company_admin` the header MUST show `seats_used` of `seat_limit` from `GET /v1/license`; for `it_admin` it MUST NOT call that route (A14).

#### Scenario: The device list
- **WHEN** IT opens Devices
- **THEN** each device shows hostname, OS, employee, status, issues, version and last seen

#### Scenario: A manager
- **WHEN** a `manager` opens `/devices`
- **THEN** the app shows Overview and makes no `GET /v1/devices` call

### Requirement: Status and badges read as plain words
<!-- source: A4 · Plan-v3.5 §5.9 · backend `device-status` -->
Status SHALL show as Online, Offline, Released or Uninstalled, and badges as Outdated, Permission pending, Browser access pending, Paused and Open alert, each a pill with text. A device online with no badge MUST read "Installed and working".

#### Scenario: An outdated Mac waiting for permission
- **WHEN** a device is `online` with badges `outdated` and `permission_pending`
- **THEN** it shows Online with Outdated and Permission pending pills

### Requirement: Released devices show when
<!-- source: D38 · backend `device-status` (`released_at`) · backend B35 -->
A device with status Released SHALL show the date from `released_at` in its last-seen column ("Released 12 Nov 2026"), in the company's time zone.

#### Scenario: A released laptop
- **WHEN** a device has `released_at` 12 November 2026 10:00
- **THEN** the row reads Released with "Released 12 Nov 2026"

### Requirement: Uninstalled devices show when
<!-- source: backend B36 · backend `device-status` (`uninstalled_at`) -->
A device with status Uninstalled SHALL show the date from `uninstalled_at` in its last-seen column ("Uninstalled 26 Nov 2026"), in the company's time zone.

#### Scenario: A laptop removed with the Uninstaller
- **WHEN** a device has `uninstalled_at` 26 November 2026 09:00
- **THEN** the row reads Uninstalled with "Uninstalled 26 Nov 2026"

### Requirement: Devices are filtered by status, issue, OS and employee
<!-- source: A8 · backend `device-status` -->
The list SHALL offer search over hostname, employee and version, and dropdown filters for status (All, Needs attention, each status), issue (each badge), OS (Windows, Mac) and employee. Single status, badge, OS and employee filters MUST be passed to `GET /v1/devices`; "Needs attention" (any status other than online, or any badge) and "Installed and working" (online, no badge) MUST be applied in the browser over the full list. A filter opened from a rollout row MUST arrive applied.

#### Scenario: Needs attention
- **WHEN** IT picks Needs attention
- **THEN** only devices that are not online or carry a badge are listed

### Requirement: Released devices stay visible
<!-- source: D38 · backend B36 · backend `device-lifecycle` -->
Released and uninstalled devices SHALL stay in the list with their status and the time it happened, sorted after active devices, and MUST NOT count toward seats or show an offline issue.

#### Scenario: A released laptop
- **WHEN** a device was released yesterday
- **THEN** it shows Released with yesterday's date and no Offline pill
