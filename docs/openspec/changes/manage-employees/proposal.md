## Why

Every device is installed for a picked employee (D47), and what each device collects follows that
employee's switches and pauses (D37, D31). The company therefore needs its people in WorkBeat before
the first install, per-employee monitoring settings within the screenshot tier (B11), and pauses for
leave (D31–D34). Plan-v3.5 §4.5 puts these on the Employees pages for Company Admins, read-only for
Managers on their own team; IT Admins have no Employees page (A3).

## What Changes

- **Employee directory**: Employees page with search, department and status filters; add and edit
  dialog; CSV import that checks before it imports; remove archives the employee and is refused
  while a device is still bound; archived employees viewable and read-only, and restored rather than added again (D46).
- **Monitoring settings**: an employee tab with the four switches and the screenshot interval
  (off, 10, 30 or 60 minutes, never faster than the tier).
- **Monitoring pauses**: schedule, extend, end and cancel a pause, with an end always required and
  the plan's wording of what a pause does.
- **Notice acknowledgements**: the Company Admin sees which devices acknowledged which notice version.

## Capabilities

### New Capabilities

- `employee-directory`: the Employees list, add, edit, import, archive and the archived view.
- `monitoring-settings`: per-employee feature switches and screenshot interval.
- `monitoring-pauses`: per-employee pause windows and their actions.
- `notice-acknowledgements`: the list of an employee's notice acknowledgements.

### Modified Capabilities

None.

## Impact

- Consumes backend `employee-directory` (`GET/POST /v1/employees`, `GET/PATCH/DELETE /v1/employees/:id`,
  `POST /v1/employees/import`, with `presence` and `devices`), `manager-teams`, `monitoring-settings`, `monitoring-pauses`,
  `notice-acknowledgement`, `subscription-sync` (`GET /v1/billing`
  for the tier), `team-invitations` (`GET /v1/team` for managers).
- Builds on `establish-admin-foundation` (`app-shell`, `api-access`, `ui-conventions`).
- Design: Prototype "Employees", "Employee", "Pause monitoring"; deviations in [design.md](design.md).
