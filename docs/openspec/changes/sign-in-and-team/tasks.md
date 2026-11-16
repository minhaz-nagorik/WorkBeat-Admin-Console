> **Read first — this task list is not the requirement.**
> Capabilities: `sign-in · team-management`
> The requirements are in [`specs/`](specs/). Run `cd docs && openspec show sign-in-and-team`.
> Design: [design/README.md](../../../design/README.md) · Decisions: [admin-decisions.md](../../../decisions/admin-decisions.md).

## 1. sign-in

- [ ] 1.1 Sign-in page calling `POST /v1/auth/login`; session cookie set by the app's server; host branding from `GET /v1/hosts/resolve`
- [ ] 1.2 Staff authenticator: QR set-up from `otpauth_uri` with manual `secret`, code step, `MFA_CODE_INVALID` tries left, expired `mfa_token` back to password; nothing kept outside memory
- [ ] 1.3 Sign-out clearing session and cache; no-store on authenticated pages
- [ ] 1.4 Forgot password, `/reset-password` page (token removed from the address bar), change password in the user menu; `429` countdown from `Retry-After`
- [ ] 1.5 Invitation page: lookup, accept, token removed from the URL, invalid and expired messages
- [ ] 1.6 Tests: each role lands on its page; wrong password message; change password wrong current and short new; staff blocked until a code is verified; first-time QR set-up; wrong code tries left; expired challenge; reset invalid and expired links; `429` countdown; company user never asked for MFA; Back after sign-out; invitation valid, invalid, expired, weak password

## 2. team-management

- [ ] 2.1 Team list from `GET /v1/team` with search
- [ ] 2.2 Invite dialog; resend and cancel with confirmation; `409` messages
- [ ] 2.3 Role dropdown and remove; own row read-only; demote-manager warning; last-admin `409`
- [ ] 2.4 Manager teams card with `PATCH /v1/employees/:id`
- [ ] 2.5 Who-can-do-what table
- [ ] 2.6 Tests: only `company_admin` reaches the page (manager and IT redirected, `403` handled); invite duplicate; cancel accepted; last admin; moving an employee between managers
