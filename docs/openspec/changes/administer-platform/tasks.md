> **Read first — this task list is not the requirement.**
> Capabilities: `staff-companies · staff-licences · staff-domains · agent-releases · staff-team`
> The requirements are in [`specs/`](specs/). Run `cd docs && openspec show administer-platform`.
> Design: [design.md](design.md) · [design/README.md](../../../design/README.md) · Decisions: [admin-decisions.md](../../../decisions/admin-decisions.md).

## 1. staff-companies

- [x] ~~1.1 Data-boundary notice on every staff page~~ (removed 16 Nov 2026)
- [x] 1.2 Companies totals and list from `GET /v1/staff/companies`, status filter, search
- [x] 1.3 Suspend and restore with confirmations; hidden for expired
- [x] 1.4 Enterprise seats dialog; grace days field
- [ ] 1.5 Tests: `409` messages; filter maps to `status`; role test — every company role is redirected from staff pages and no staff page renders an employee or device field

## 2. staff-licences

- [x] 2.1 Masked key list with search by last four
- [x] 2.2 Reissue confirmation and one-time key display with copy
- [ ] 2.3 Tests: full key never on the list; key cleared on close and absent from logs and storage; role test — super admin only

## 3. staff-domains

- [x] 3.1 Domain list from companies with a `custom_domain`, with `custom_domain_checked_at` as the review time
- [x] 3.2 A17: "Check and approve" dialog with the TXT name, value and a `dig` command; Approve and Reject; Deactivate for an active domain
- [ ] 3.3 Tests: state labels; `409` message when the company changed its domain; role test — super admin only

## 4. agent-releases

- [x] 4.1 Release list with states; read-only per-platform minimum
- [x] 4.2 Publish form with arch rules and version checks; file upload through `POST /v1/staff/agent-releases/upload-url`, then publish; withdraw confirmation
- [ ] 4.3 Tests: macOS fixed to universal; minimum above version refused; `409` message; withdrawn row has no action; failed upload sends no publish; role test — super admin only

## 5. staff-team

- [x] 5.1 Team list with "You" and open invitations
- [x] 5.2 Invite, resend, revoke, remove with confirmations
- [x] ~~5.3 Reset authenticator~~ (removed 16 Nov 2026 with staff MFA)
- [ ] 5.4 Tests: no Remove on own row; last-admin `409` message; role test — super admin only

## 6. Create companies and temporary passwords (product owner, 17 Nov 2026)

- [x] 6.1 Add company dialog with all settings and a required Company Admin email (`POST /v1/staff/companies`)
- [x] 6.2 Company admins page with search (`GET /v1/staff/company-admins`)
- [x] 6.3 Reset password: temporary password shown once with Copy, also emailed
- [ ] 6.4 Tests: taken address and email messages; temporary password cleared on close; no other role listed
- [x] A15: "Name and retention" dialog on staff Companies (`PATCH /v1/staff/companies/:id`), with a confirm when retention goes down
- [x] A16: "Plan and seats" dialog (plan, seats, screenshot plan, confirm on a lower plan) replaces "Enterprise seats"; "Status" dialog (trial days, confirm on suspend or expire)
- [x] A16: one Manage button per company row (panel with Plan and seats, Status, Name and retention, Grace period); End trial for trial companies; Suspend and Restore row buttons removed (Status covers them)
