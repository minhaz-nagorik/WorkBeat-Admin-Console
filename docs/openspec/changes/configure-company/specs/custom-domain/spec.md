## Purpose

The Custom domain card on Company settings: a Company Admin adds, changes or removes the company's
own domain and sees the DNS records to create; it works only after WorkBeat approves it (A17, backend B33).

## ADDED Requirements

### Requirement: The card shows the domain and its state
<!-- source: A17 · backend `custom-domains` (B33) -->
Company settings SHALL show a Custom domain card to a `company_admin`, loaded from `GET /v1/company/custom-domain`. With a domain it MUST show the domain and its status as "Waiting for WorkBeat approval" (`pending`), "Active" (`active`) or "Not approved" (`failed`), in words as well as colour. With `data` `null` it MUST show only the form to add one.

#### Scenario: No domain yet
- **WHEN** a company admin with no custom domain opens Company settings
- **THEN** the card shows an empty Domain field and an Add domain button

#### Scenario: A pending domain
- **WHEN** the domain is `pending`
- **THEN** the card shows "Waiting for WorkBeat approval"

### Requirement: The records to create are shown until the domain is active
<!-- source: A17 · backend `custom-domains` -->
For a `pending` or `failed` domain the card SHALL show a CNAME record (the domain → `cname_target`) and a TXT record (`txt_name` → `txt_value`). For an `active` domain it MUST NOT show them. A `failed` domain MUST also say that WorkBeat could not approve it and to contact WorkBeat.

#### Scenario: Records after adding
- **WHEN** an admin adds `monitor.acme.com`
- **THEN** the card shows CNAME `monitor.acme.com` → `proxy.workbeat.io` and the TXT name and value

### Requirement: Adding or changing the domain
<!-- source: A17 · backend `custom-domains` -->
The form SHALL send `PUT /v1/company/custom-domain` with the typed domain and show the answer in the card. An empty field MUST be refused before sending. A `422` MUST say beside the field to use a domain the company owns and not a workbeat.io address. A `409` MUST say another company already uses it. A changed domain MUST be described as needing approval again.

#### Scenario: A taken domain
- **WHEN** the API answers `409` to the domain typed
- **THEN** the field shows "Another company already uses this domain."

### Requirement: Removing the domain asks first
<!-- source: A7 · A17 · backend `custom-domains` -->
Remove domain SHALL first ask, naming that the dashboard stops opening at that address, and only then send `DELETE /v1/company/custom-domain`. On `204` the card MUST return to the empty state.

#### Scenario: Removing an active domain
- **WHEN** an admin confirms Remove for `monitor.acme.com`
- **THEN** the page sends `DELETE /v1/company/custom-domain` and the card shows the empty form

### Requirement: Only approved addresses open the console
<!-- source: A17 · backend `custom-domains` (B33) -->
A request on an address that is not WorkBeat's own (`localhost`, `workbeat.io`, `*.workbeat.io`, `*.vercel.app` or `APP_HOSTS`) SHALL be let through only when `GET /v1/hosts/resolve` answers `200`. A `404` MUST redirect a page to the main address's sign-in, and MUST answer `404 NOT_FOUND` to an `/api/` call. When the API cannot answer, the request MUST go through.

#### Scenario: A pending domain
- **WHEN** someone opens `http://acme.localhost:3001/` while `acme.localhost` is `pending`
- **THEN** the browser is redirected to the main address's `/sign-in`

#### Scenario: An approved domain
- **WHEN** someone opens `/sign-in` on an `active` custom domain
- **THEN** the page loads and shows the company name

#### Scenario: A sign-in posted to an unapproved address
- **WHEN** a `POST /api/v1/auth/login` arrives on a `pending` domain
- **THEN** the response is `404` with `code` `NOT_FOUND` and nothing is sent to the API
