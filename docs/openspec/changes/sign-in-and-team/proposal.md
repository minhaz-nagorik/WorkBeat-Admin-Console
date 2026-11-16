## Why

WorkBeat Admin has one sign-in page for company users and WorkBeat staff, one sign-in run by
the API (backend `user-authentication`, B22–B25), and staff sign in the same way, with no second factor (MFA removed by the product owner, 16 Nov 2026). Company Admins bring colleagues in by
invitation and give each employee one manager, which scopes what that manager sees (backend
`team-invitations`, B12, Plan-v3.5 §4.4 "Manager scoping"). Without these pages nobody but the
first admin can reach the platform.

## What Changes

- **Sign-in**: one page for every role, branded with the company on a company host; password
  sign-in through `POST /v1/auth/login`; rate-limit messages; sign-out; forgot and change password;
  the invitation link page that creates the account.
- **Team management**: Team & roles page for the Company Admin: users and open invitations,
  invite, resend, revoke, change role, remove; manager teams (one manager per employee); the
  "Who can do what" table.

## Capabilities

### New Capabilities

- `sign-in`: sign-in, sign-out, password reset and change, and invitation acceptance.
- `team-management`: dashboard users, invitations, roles and manager teams.

### Modified Capabilities

None.

## Impact

- Consumes backend `user-authentication` (`GET /v1/me`), `staff-accounts` (staff invitations), `POST /v1/auth/login`, `/logout`, `/password`, `/password-reset/request`, `/password-reset/confirm`,
  `team-invitations` (`GET /v1/team`, `POST /v1/team/invitations`, `.../resend`,
  `DELETE /v1/team/invitations/:id`, `PATCH`/`DELETE /v1/team/users/:id`,
  `POST /v1/invitations/lookup`, `POST /v1/invitations/accept`), `custom-domains`
  (`GET /v1/hosts/resolve`) and `manager-teams` (`GET /v1/employees?manager_user_id=`, `PATCH /v1/employees/:id` `manager_user_id`).
- Builds on `establish-admin-foundation` (`app-shell`, `api-access`, `ui-conventions`).
- Design reference: Prototype "Team & roles" and the invite dialog.
