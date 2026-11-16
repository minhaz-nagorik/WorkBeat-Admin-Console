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

- [x] 3.1 Read-only domain list from companies with a `custom_domain`, with `custom_domain_checked_at`
- [ ] 3.2 Tests: state labels; no write control; role test — super admin only

## 4. agent-releases

- [x] 4.1 Release list with states; read-only per-platform minimum
- [x] 4.2 Publish form with arch rules and version checks; file upload through `POST /v1/staff/agent-releases/upload-url`, then publish; withdraw confirmation
- [ ] 4.3 Tests: macOS fixed to universal; minimum above version refused; `409` message; withdrawn row has no action; failed upload sends no publish; role test — super admin only

## 5. staff-team

- [x] 5.1 Team list with "You" and open invitations
- [x] 5.2 Invite, resend, revoke, remove with confirmations
- [x] ~~5.3 Reset authenticator~~ (removed 16 Nov 2026 with staff MFA)
- [ ] 5.4 Tests: no Remove on own row; last-admin `409` message; role test — super admin only
