## Why

Backend change `custom-roles-and-maker-checker` (product owner 19 Nov 2026): two Company Admins at
company creation, maker-checker for everyone including Company Admins, and Company Admin as the
only fixed role, the others made by Company Admins.

## What Changes

- Navigation, tabs and buttons follow `permissions` and `team_only` from `GET /v1/me`, not role names.
- Team & roles: a Roles card to make, edit and delete roles; invitations and role changes pick
  Company Admin or a role; Manager teams list users of team-only roles.
- Approvals: a Company Admin's own pending change shows "Waiting for another Company Admin" and can
  only be cancelled; every write that may answer `202` says it was sent for approval.
- Staff "Add company": optional second Company Admin email.
- Alert emails pick Company Admins or roles.

## Capabilities

### New Capabilities

- `custom-roles-ui`, `maker-checker-ui`.

### Modified Capabilities

- `approve-it-admin-changes` and `sign-in-and-team`: superseded where they name IT Admin or Manager.

## Impact

- Needs backend migration 0013 and its routes.
