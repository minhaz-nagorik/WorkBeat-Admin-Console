## Purpose

The billing card: what the company pays for, how many seats it uses, its screenshot plan and the
way to change card details and see invoices, which happens in Stripe.

## ADDED Requirements

### Requirement: Billing shows plan, seats and the estimate
<!-- source: D43 · backend `subscription-sync` · Prototype "Company settings" -->
For `company_admin` the Billing card SHALL load `GET /v1/billing` and show `plan`, `seats_used` of `seat_limit` ("unlimited" when null), the screenshot tier, `current_period_end` and an estimate of the next invoice as seats × ($1.00 + tier add-on: off $0, light $0.50, standard $1.00, intensive $2.00), labelled an estimate.

#### Scenario: 32 seats on Standard
- **WHEN** billing returns 32 seats used and tier `standard`
- **THEN** the card shows the base line 32 × $1.00, the screenshot line 32 × $1.00 and an estimate of $64.00

### Requirement: The screenshot tier change is scheduled
<!-- source: D37 · B11 · backend `subscription-sync` -->
The card SHALL offer the tiers with their fastest interval (off; light every 60 minutes; standard every 30; intensive every 10) and send `PUT /v1/billing/screenshot-tier`. It MUST show the scheduled tier and the date it applies (`current_period_end`), and say that a lower tier slows any employee faster than it on that date.

#### Scenario: Moving to Light
- **WHEN** an admin on `standard` picks Light
- **THEN** the card shows "Light from" the period end date and warns that faster employee intervals will slow to 60 minutes

### Requirement: Card and invoices open in Stripe
<!-- source: backend `subscription-sync` · A6 -->
"Payment method and invoices" SHALL call `POST /v1/billing/portal-session` and open the returned URL. The page MUST NOT contain a card number field, and the URL MUST NOT be stored or logged.

#### Scenario: Updating the card
- **WHEN** an admin clicks Payment method and invoices
- **THEN** the browser opens the Stripe billing portal

### Requirement: Billing stays usable while suspended or in trial
<!-- source: D29 · backend `company-status` -->
The Billing card SHALL work while the company is `suspended` or `expired`, and in `trial` MUST show the days left before `trial_ends_at`.

#### Scenario: A payment failure
- **WHEN** the company is suspended for `payment_failed`
- **THEN** the Billing card still opens the Stripe portal
