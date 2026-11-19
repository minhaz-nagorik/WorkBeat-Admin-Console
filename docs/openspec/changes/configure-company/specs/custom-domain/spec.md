## Purpose

The custom domain is managed by WorkBeat staff (A15, backend B29); the company area offers no
custom domain card.

## ADDED Requirements

### Requirement: No custom domain card for company roles
<!-- source: A15 · backend `custom-domains` (B29) -->
The console SHALL NOT offer any company role a way to add, change or remove a custom domain, and MUST NOT call `PUT` or `DELETE /v1/company/custom-domain`.

#### Scenario: A company admin opens Company settings
- **WHEN** a `company_admin` opens Company settings
- **THEN** no custom domain card is shown
