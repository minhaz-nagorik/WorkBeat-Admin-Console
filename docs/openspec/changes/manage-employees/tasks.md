> **Read first — this task list is not the requirement.**
> Capabilities: `employee-directory · monitoring-settings · monitoring-pauses · notice-acknowledgements`
> The requirements are in [`specs/`](specs/). Run `cd docs && openspec show manage-employees`.
> Design: [design.md](design.md) · Decisions: [admin-decisions.md](../../../decisions/admin-decisions.md).

## 1. employee-directory

- [x] 1.1 Employees page: list, search, department dropdown, manager column from `GET /v1/team`
- [x] 1.2 Status column and filter from `presence` (admin and manager)
- [x] 1.3 Add and edit dialog with field errors and duplicate-email message
- [x] 1.4 CSV import dialog: file or paste, template, Check, line errors, `413`, result counts
- [x] 1.5 Remove with confirmation; `409 EMPLOYEE_HAS_DEVICES` names devices and links to Devices
- [x] 1.6 Removed-employees filter and read-only archived pages
- [ ] 1.7 Tests: role test (admin all, manager own team read only, IT redirected); each `presence` value labelled, manager sees status; import line errors create nothing; archived employee has no write controls
- [x] 1.8 Restore (D46): Restore on the removed list and the archived page (company_admin), new-email prompt on `409`/`422 email`, Add employee offers Restore for a removed employee's email, import names `archived` matches

## 2. monitoring-settings

- [x] 2.1 "What is collected" tab with four switches and interval
- [x] 2.2 Interval choices from `GET /v1/billing` tier; tier off state with Billing link
- [x] 2.3 Save messages: 30-minute delay, notice re-ask on widening; `422` and `409` handling
- [ ] 2.4 Tests: role test (manager read only, IT no access); choices per tier; widening message

## 3. monitoring-pauses

- [x] 3.1 Pause list with labelled reasons and statuses
- [x] 3.2 Schedule dialog with presets, required end, plan wording; `422` and `409` messages
- [x] 3.3 Extend, End now and Cancel with inline confirmation
- [ ] 3.4 Tests: role test (manager no actions); no open-ended option; overlap message; actions per status

## 4. notice-acknowledgements

- [x] 4.1 Acknowledgements section for admins; current-version flag
- [ ] 4.2 Tests: role test (manager and IT never see it); flag when latest version is behind
