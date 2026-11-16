## Purpose

The Staff team page: who can sign in to the internal console, open staff invitations, and how a
super admin is added or removed.

## ADDED Requirements

### Requirement: The staff team is listed
<!-- source: D41 · backend `staff-accounts` -->
The Staff team page SHALL call `GET /v1/staff/team` and list each super admin's name and email, the signed-in user marked "You", and each open invitation with its email and expiry.

#### Scenario: An open invitation
- **WHEN** an invitation is open
- **THEN** it is listed with "Invite sent" and its expiry

### Requirement: Staff invite a super admin
<!-- source: D41 · backend `staff-accounts` -->
"Invite staff" SHALL send `POST /v1/staff/invitations` with `email`. `409 CONFLICT` MUST read "This person already has an account or an open invitation".

#### Scenario: Inviting a colleague
- **WHEN** staff invite `ops@workbeat.io`
- **THEN** the invitation appears in the list

### Requirement: Staff resend an open invitation
<!-- source: backend `staff-accounts` · `POST /v1/staff/invitations/:id/resend` (agreed, staff API not built) -->
Each open staff invitation SHALL offer Resend, which calls `POST /v1/staff/invitations/:id/resend` and shows the new expiry. `409 CONFLICT` MUST read "This invitation was already accepted or cancelled" and refresh the list.

#### Scenario: Resending an expired-soon invitation
- **WHEN** staff click Resend on an open invitation
- **THEN** a new email is sent and the row shows the new expiry

### Requirement: Staff revoke invitations and remove staff
<!-- source: backend `staff-accounts` · A7 -->
Revoke SHALL confirm and call `DELETE /v1/staff/invitations/:id`; Remove MUST confirm that the person is signed out at once, then call `DELETE /v1/staff/users/:id`. Remove MUST NOT be offered on the signed-in user's own row, and `409 CONFLICT` MUST read "You can't remove the last super admin".

#### Scenario: Removing the last other admin
- **WHEN** the API answers `409 CONFLICT` to a removal
- **THEN** the message about the last super admin is shown and the row stays
