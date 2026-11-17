## Purpose

The frame every page sits in: who sees which navigation, where each role lands after sign-in, and
how a suspended, expired or trial company is told about its state.

## ADDED Requirements

### Requirement: Navigation follows the signed-in role
<!-- source: D41 · A3 · backend `user-authentication` · Prototype "navigation" -->
After sign-in the app SHALL call `GET /v1/me` and show only the navigation the role allows: Company (Overview, Employees, Devices, Alerts, Block list, Productivity rules) and Setup (Deployment, Team & roles, Company settings) per the permission matrix, and for `super_admin` only the staff group (Companies, Licences, Custom domains, Agent releases, Company admins, Staff team).

#### Scenario: An IT admin signs in
- **WHEN** a user with role `it_admin` signs in
- **THEN** the sidebar shows Overview, Devices, Alerts, Block list and Deployment
- **AND** it shows no Employees, Productivity rules, Team & roles, Company settings or staff item

#### Scenario: A manager signs in
- **WHEN** a user with role `manager` signs in
- **THEN** the sidebar shows Overview, Employees, Alerts, Block list and Productivity rules only

#### Scenario: A super admin signs in
- **WHEN** a `super_admin` signs in
- **THEN** only the staff group is shown and the header reads "Internal console"

### Requirement: Each role lands on its own page
<!-- source: A3 · Prototype "navigation" -->
After sign-in, and when a role opens a page it may not open, the app SHALL go to the role's landing page: Overview for `company_admin`, `manager` and `it_admin`, Companies for `super_admin`. The guard MUST NOT replace the API's refusal: a page that still receives `403 FORBIDDEN` MUST show "You don't have access to this page" and no data.

#### Scenario: A manager types the devices address
- **WHEN** a `manager` opens `/devices` directly
- **THEN** the app shows Overview

#### Scenario: The API refuses a page the shell allowed
- **WHEN** a page's API call returns `403 FORBIDDEN`
- **THEN** the page shows "You don't have access to this page" and renders no partial data

### Requirement: The header names the company and the user
<!-- source: D41 · Prototype "navigation" -->
The shell SHALL show the WorkBeat logo with the company `name` from `GET /v1/me` for company users and "Internal console" for staff, and at the foot of the sidebar the user's `name` and `email` with a sign-out control. The alerts item MUST show the count of today's open alerts when it is above zero, for roles that see alerts.

#### Scenario: Alerts today
- **WHEN** three alerts the user may see occurred today and are open
- **THEN** the Alerts item shows the count 3

### Requirement: A suspended, expired or trial company is told on every page
<!-- source: D29 · D30 · D36 · backend `company-status` · A4 -->
For company users the shell SHALL read `GET /v1/company/status` and show a banner on every page: for `suspended`, that devices stopped collecting and why (`payment_failed`: "Payment failed. Update your card in Billing"; `staff`: "Contact WorkBeat"); for `expired`, that blocking ends on `blocking_ends_at`; for `trial`, the days left before `trial_ends_at`. Pages MUST stay usable.

#### Scenario: A failed renewal
- **WHEN** the status is `suspended` with `suspended_reason` `payment_failed`
- **THEN** every page shows a banner that collection has stopped and payment failed, with a link to Billing for a Company Admin

#### Scenario: An expired company
- **WHEN** the status is `expired` with `blocking_ends_at` 15 December 2026
- **THEN** the banner says website blocking on company computers ends on 15 December 2026

### Requirement: The layout works on a phone
<!-- source: A11 · Prototype "navigation" -->
The shell SHALL show the sidebar beside the page from 900 px wide, and below that a menu button that opens it as a drawer that closes after a choice. No page MUST scroll sideways at 360 px; wide tables MUST scroll inside their own box.

#### Scenario: A phone-width screen
- **WHEN** the viewport is 375 px wide
- **THEN** the sidebar is hidden behind a menu button and the page has no horizontal scroll

### Requirement: The user picks light or dark
<!-- source: Prototype "navigation" (theme button) · A11 -->
The top bar SHALL have a theme button that switches between light and dark and remembers the choice in this browser. With no choice saved, the theme MUST follow the operating system setting.

#### Scenario: Switching to light
- **WHEN** a user whose computer is in dark mode presses the theme button
- **THEN** the page turns light and stays light after a reload
