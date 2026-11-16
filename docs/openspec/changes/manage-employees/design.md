## Context

The prototype's Employees and Employee pages predate D37, D47 and D48. Plan v3.5 and the backend
specs win (A1).

## Decisions

- **Per-employee monitoring settings tab (new).** Amends Prototype "Employee" tabs and "Company
  settings → Screenshots". D37 switches each feature per employee and B11 fixes the interval to
  off/10/30/60 minutes within the tier; the prototype's company-wide switch and free 10–480 minute
  interval have no API.
- **Every pause has an end.** Amends Prototype "Pause monitoring" ("Until I resume"). Backend
  `monitoring-pauses` requires `ends_at`; "End now" shortens or cancels instead.
- **Pause wording.** Amends the prototype text "website blocking stays on". D32 lifts blocking during
  a pause; D33 keeps tamper detection on.
- **No device → install, not assign.** Amends Prototype "Employee" ("Assign one on the Devices page")
  and "Remove employee" ("Reassign or release"). D47 and D48: a device is bound in WorkBeat Setup and
  changes employee only by release.
- **Edit hint.** Drops "Devices installed through an MDM link to employees by this email" (D40).
- **Status from `presence`.** The backend now returns `presence` and `devices` on the employee
  routes for Company Admins and Managers (backend reply 16 Nov 2026), so both roles get the
  prototype's status column; nothing is derived from `GET /v1/devices`.
