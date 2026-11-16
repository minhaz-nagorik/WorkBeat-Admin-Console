## Why

WorkBeat staff run the platform from the same app as customers, signing in with email and password like everyone else, and never see employee
data (D41, Plan-v3.5 §4.6). They list companies, suspend and restore them, override Enterprise
seats, set the expired-licence grace period (D36), reissue a leaked licence key (D43), watch custom
domains, publish and withdraw agent releases, and manage the staff team. The backend
`administer-platform`, `distribute-agents` and `staff-accounts` serve these; this change builds the
staff area on them.

## What Changes

- **Companies**: totals, list with status filter and search, suspend and restore, Enterprise plan
  and seat limit, expired grace days.
- **Licences**: masked keys, seats, reissue with a one-time display of the new key.
- **Custom domains**: every company's custom domain and its state, read-only.
- **Agent releases**: list, publish, withdraw.
- **Staff team**: list, invite a super admin, resend or revoke an invitation, remove a staff user.
- A banner on every staff page: employee names, activity, URLs and screenshots are never visible.

## Capabilities

### New Capabilities

- `staff-companies`: the Companies page and its actions.
- `staff-licences`: the Licences page and key reissue.
- `staff-domains`: the Custom domains page.
- `agent-releases`: the Agent releases page.
- `staff-team`: the Staff team page.

### Modified Capabilities

None.

## Impact

- Consumes backend `staff-companies`, `staff-license-reissue`, `staff-data-boundary`
  (`administer-platform`), `agent-releases` (`distribute-agents`), `staff-accounts`
  (`authenticate-users`), `role-access`.
- Relies on staff additions agreed but not built (backend reply 16 Nov 2026): `POST /v1/staff/agent-releases/upload-url`,
  `POST /v1/staff/invitations/:id/resend`, `custom_domain_checked_at` on `GET /v1/staff/companies`.
- The shell comes from `establish-admin-foundation`; staff sign-in
  from `sign-in-and-team`.
- Design reference: Prototype "Companies", "Licenses", "Custom domains", "Agent releases".
  Deviations in [design.md](design.md).
