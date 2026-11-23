> **Read first — this task list is not the requirement.**
> Capabilities: `device-list · device-detail · device-actions`
> The requirements are in [`specs/`](specs/). Run `cd docs && openspec show manage-devices`.
> Design: [design.md](design.md) · [design/README.md](../../../design/README.md) · Decisions: [admin-decisions.md](../../../decisions/admin-decisions.md).

## 1. device-list

- [x] 1.1 Devices page from `GET /v1/devices`; seats line from `GET /v1/license`
- [x] 1.2 Status and badge labels through the label map
- [x] 1.3 Search and dropdown filters (status incl. Needs attention, issue, OS, employee); filters from the URL for rollout links
- [x] 1.4 Released sorted last; 30 s polling
- [ ] 1.5 Tests: only `company_admin` and `it_admin` reach the page; manager makes no call; filter combinations; released device shows no offline pill and its release date

## 2. device-detail

- [x] 2.1 Detail from `GET /v1/devices/:id`: helper, browser access, permissions (Mac) or none needed (Windows), "Agent health" from `health` with counters by reason
- [x] 2.2 Per-badge actions; tamper link to alerts; fixed-employee explanation
- [ ] 2.3 Tests: Mac with pending Automation; Windows shows no permissions; another company's ID gives the no-longer-exists message

## 3. device-actions

- [x] 3.1 Release with D45 confirmation text; no Deactivate (B35), uninstall-frees-no-seat note
- [x] 3.2 `409` refresh and message; `404` removal; `403` no-access
- [x] 3.3 Release-then-Setup explanation in place of reassign
- [ ] 3.4 Tests: release frees a seat; no Deactivate control or status; concurrent release `409`; no reassign control anywhere; manager sees no action
