## Purpose

Billing is handled by WorkBeat staff (A15, backend B29): no company role sees what the company pays
for or changes its plan in the console.

## ADDED Requirements

### Requirement: No billing in the company area
<!-- source: A15 · backend `subscription-sync` (B29) -->
The console SHALL NOT show a Billing card or page to any company role and MUST NOT call `GET /v1/billing`, `PUT /v1/billing/screenshot-tier` or `POST /v1/billing/portal-session`. Where the plan matters (no screenshots on the plan, a failed payment) the page MUST say to contact WorkBeat instead of linking to billing.

#### Scenario: A company admin opens Company settings
- **WHEN** a `company_admin` opens Company settings
- **THEN** no billing is shown and no billing route is called

#### Scenario: Suspended for a failed payment
- **WHEN** the company is suspended for `payment_failed`
- **THEN** the banner says the payment failed and to contact WorkBeat, with no billing link
