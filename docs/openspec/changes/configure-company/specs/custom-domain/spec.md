## Purpose

The custom domain card: open the dashboard at the company's own address, with the DNS records to
add and the state of the check.

## ADDED Requirements

### Requirement: The card shows the domain and its state
<!-- source: backend `custom-domains` · Prototype "Company settings" -->
For `company_admin` the card SHALL load `GET /v1/company/custom-domain`; with no domain it MUST offer "Add custom domain" and explain the default `{slug}.workbeat.io` keeps working; with one it MUST show the `domain` and its `status` as "Waiting for DNS records" (`pending`), "Active" (`active`) or "Not verified" (`failed`), with `checked_at`.

#### Scenario: A live domain
- **WHEN** the domain is `active`
- **THEN** the card shows "Live" and says the dashboard opens at that address and the default address still works

### Requirement: Adding a domain shows the two records to create
<!-- source: backend `custom-domains` · Prototype "Company settings" -->
Saving a domain SHALL send `PUT /v1/company/custom-domain` and then list the CNAME record (`domain` → `cname_target`) and the TXT record (`txt_name` → `txt_value`), each with Copy buttons, and say the check runs every 5 minutes and records can take up to an hour.

#### Scenario: Adding monitor.acme.com
- **WHEN** an admin saves `monitor.acme.com`
- **THEN** the card shows the CNAME to `proxy.workbeat.io` and the TXT `_workbeat.monitor.acme.com` with copy buttons

### Requirement: Domain errors read as next steps
<!-- source: backend `custom-domains` · A12 -->
`422 VALIDATION_FAILED` SHALL read "Use an address on a domain your company owns, like monitor.yourcompany.com"; `409 CONFLICT` MUST read "Another company already uses this address". The form MUST say the address needs a part in front of the main domain.

#### Scenario: A taken domain
- **WHEN** the API answers `409 CONFLICT`
- **THEN** the dialog shows the already-used message and stays open

### Requirement: Changing or removing a domain is confirmed
<!-- source: backend `custom-domains` · A7 -->
Change SHALL warn that new DNS records are needed and the old address stops working; Remove MUST confirm inline that the dashboard will open only at the default address, then send `DELETE /v1/company/custom-domain`.

#### Scenario: Removing a domain
- **WHEN** an admin confirms Remove
- **THEN** the card returns to the no-domain state
