## Purpose

The Custom domains page: every company's custom domain and the state of its DNS check, for staff
to answer support questions.

## ADDED Requirements

### Requirement: Custom domains are listed with their state
<!-- source: backend `staff-companies` · backend `custom-domains` · Prototype "Custom domains" -->
The Custom domains page SHALL list the companies from `GET /v1/staff/companies` that have a `custom_domain`, with the domain, company name and `custom_domain_status` as "Waiting for DNS records" (`pending`), "Active" (`active`) or "Not verified" (`failed`), and when it was last checked (`custom_domain_checked_at`, "Not checked yet" when null), searchable by domain or company.

#### Scenario: A pending domain
- **WHEN** a company's domain is `pending`
- **THEN** its row shows "Waiting for DNS"

### Requirement: The page is read-only
<!-- source: backend `custom-domains` -->
The page SHALL NOT change a domain or trigger a DNS check, and MUST say that checks run every 5 minutes and that only the company's admin can add, change or remove its domain.

#### Scenario: A stuck domain
- **WHEN** staff open a `failed` domain
- **THEN** no control changes it and the note says the company admin must fix its DNS records
