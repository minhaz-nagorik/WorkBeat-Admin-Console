## Purpose

How every person gets into WorkBeat Admin: one sign-in page for all roles with email and password,
sign-out, a forgotten or changed password, and the page an invitation link opens.

## ADDED Requirements

### Requirement: One sign-in page for every role
<!-- source: D41 · A2 · A10 · backend `user-authentication` · product owner 16 Nov 2026 (no staff MFA) -->
The app SHALL offer one sign-in page with email and password for company users and staff alike, calling `POST /v1/auth/login`. No role is asked for a second code. On success the app MUST keep `token` as the session (`api-access`), load `GET /v1/me` and go to the role's landing page (`app-shell`). A `401` MUST show "Email or password is wrong" without saying which.

#### Scenario: A company admin signs in
- **WHEN** a Company Admin enters a valid email and password
- **THEN** they land on Overview

#### Scenario: A super admin signs in
- **WHEN** a super admin enters a valid email and password
- **THEN** they land on Companies and no code is asked for

#### Scenario: A wrong password
- **WHEN** the password is wrong
- **THEN** the page shows "Email or password is wrong" and keeps the email

### Requirement: Too many attempts are explained, never locked
<!-- source: backend `user-authentication` · A12 -->
A `429 RATE_LIMITED` from any sign-in, password-reset or invitation call SHALL show "Too many attempts. Try again in N seconds", N from `Retry-After`, and disable the submit button until then. The page MUST NOT say an account is locked.

#### Scenario: Rapid retries
- **WHEN** login answers `429` with `Retry-After: 40`
- **THEN** the page says to try again in 40 seconds and the button re-enables after 40 seconds

### Requirement: A company host shows the company's name
<!-- source: backend `custom-domains` · Prototype "navigation" -->
On `{slug}.workbeat.io` or an active custom domain the sign-in page SHALL call `GET /v1/hosts/resolve` and show the company `name` above the form. An unknown host (`404`) MUST show the plain WorkBeat sign-in page. The resolved company MUST NOT decide which company the user enters; their account does.

#### Scenario: A custom domain
- **WHEN** a user opens `monitor.nagorik.tech`, an active custom domain
- **THEN** the sign-in page shows "Nagorik Technologies"

### Requirement: Sign-out ends the session
<!-- source: A6 · backend `user-authentication` -->
Sign-out SHALL call `POST /v1/auth/logout`, clear the session cookie and any in-memory data, and show the sign-in page, even if the call fails. The browser back button MUST NOT show a cached page with company data afterwards.

#### Scenario: Back after sign-out
- **WHEN** a user signs out and presses Back
- **THEN** the sign-in page is shown, not the previous page

### Requirement: A forgotten password is reset by email
<!-- source: B24 · backend `user-authentication` -->
The sign-in page SHALL offer "Forgot password", calling `POST /v1/auth/password-reset/request` with the email and then always showing "If that email has an account, a reset link is on its way". The `/reset-password` page MUST read the link's token, remove it from the address bar, ask for a new password (10–200 characters) and call `POST /v1/auth/password-reset/confirm`.

#### Scenario: An unknown email
- **WHEN** someone asks for a reset for an email with no account
- **THEN** the page shows the same on-its-way message

#### Scenario: A reset is confirmed
- **WHEN** confirm answers `200`
- **THEN** the page says the password was changed and every other session signed out, and shows the sign-in form

### Requirement: A used or expired reset link says what to do
<!-- source: B24 · backend `user-authentication` · A12 -->
`404 PASSWORD_RESET_INVALID` SHALL show "This reset link isn't valid", and `410 PASSWORD_RESET_EXPIRED` "This reset link has expired or was already used", each with a button to ask for a new link. Neither MUST show the password form.

#### Scenario: An old link
- **WHEN** confirm answers `PASSWORD_RESET_EXPIRED`
- **THEN** the page shows the expired message and a "Send a new link" button

### Requirement: A signed-in user changes their password
<!-- source: backend `user-authentication` · A12 -->
The user menu SHALL offer "Change password" asking for the current and a new password (10–200 characters) and calling `POST /v1/auth/password`. A wrong current password (`422` naming `current_password`) MUST show under that field. On success the page MUST say other sessions were signed out.

#### Scenario: A wrong current password
- **WHEN** the current password is wrong
- **THEN** the message shows under the current password field and nothing changes

#### Scenario: A short new password
- **WHEN** the new password has 8 characters
- **THEN** the form says it needs at least 10 characters and sends nothing

### Requirement: An invitation link creates the account
<!-- source: backend `team-invitations` · backend `staff-accounts` · Prototype "Team & roles" -->
The invitation page SHALL call `POST /v1/invitations/lookup` with the link's token, show the `email`, the role in plain words and the company `name`, then ask for name and password and call `POST /v1/invitations/accept`. On success a company user MUST keep the returned session and land on their role's page. The token MUST NOT stay in the address bar after the page loads.

#### Scenario: A valid invitation
- **WHEN** a person opens a valid invitation link for Manager at Nagorik Technologies
- **THEN** the page says they were invited as a Manager of Nagorik Technologies and asks for name and password

#### Scenario: A weak password
- **WHEN** accept returns `422 VALIDATION_FAILED` for the password
- **THEN** the message shows under the password field and the invitation stays usable

### Requirement: A staff invitation leads to sign-in
<!-- source: D41 · backend `staff-accounts` · backend `team-invitations` -->
For an invitation with role `super_admin` the page SHALL say "You're invited to WorkBeat staff" instead of a company name. Accept answers `201` with no session; the page MUST then open sign-in with the email filled in.

#### Scenario: A new staff member accepts
- **WHEN** a person accepts a staff invitation
- **THEN** the sign-in page opens with their email, and their new password signs them in to Companies

### Requirement: A used or expired invitation says what to do
<!-- source: backend `team-invitations` · A12 -->
`INVITATION_INVALID` SHALL show "This invitation link isn't valid. Check you used the whole link, or ask your admin for a new one", and `INVITATION_EXPIRED` "This invitation has expired, was already used or was cancelled. Ask your admin for a new one". Neither MUST show the form.

#### Scenario: An expired link
- **WHEN** lookup returns `INVITATION_EXPIRED`
- **THEN** the page shows the expired message and no form
