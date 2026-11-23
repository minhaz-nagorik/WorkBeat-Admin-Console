## Why

IT and Company Admins need to see every device's health and act on it: release a device so its seat
and employee are freed; there is no deactivate (backend B35) (Plan-v3.5 §4.5 "Devices", §5.8). A device's employee is
fixed for the life of its binding; there is no reassign, only release and a new WorkBeat Setup
(D48, B20). The prototype still offers Reassign and says a release deletes unsent data; the plan
says the device uploads what it holds for up to 24 hours (D45).

## What Changes

- **Device list**: every device with employee, status, badges, agent version, OS and last seen;
  filters by status, badge, OS and employee; seats line.
- **Device detail**: helper, browser access per browser, macOS permissions and health for one
  device, and the employee it is bound to.
- **Device actions**: Release with its consequences, no Deactivate (B35); no Reassign, and how to give
  a device to someone else.

## Capabilities

### New Capabilities

- `device-list`: the Devices page list and its filters.
- `device-detail`: one device's health.
- `device-actions`: release; no deactivate.

### Modified Capabilities

None.

## Impact

- Consumes backend `device-status` (`GET /v1/devices`, `GET /v1/devices/:id`), `device-lifecycle`
  (`POST /v1/devices/:id/release`) and `license-key`
  (`seats_used`, `seat_limit`).
- Reached from `rollout-status` rows and from employee pages (`manage-employees`).
- Design reference: Prototype "Devices", amended in `design.md`.
