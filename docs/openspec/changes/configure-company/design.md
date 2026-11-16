## Context

Prototype "Company settings" has a company-wide Screenshots form (on/off and any interval from the
plan's fastest to 480 minutes), a retention dropdown, and a card form inside a billing dialog.

## Decisions

- **No company-wide screenshot switch.** D37 and backend `monitoring-settings` set the interval per
  employee (0, 600, 1800 or 3600 s, never faster than the tier, B11). The Screenshots form is
  replaced by the tier in Billing; intervals are set on each employee (`manage-employees`). The plan
  wins because the agents only accept per-employee values.
- **The tier changes at the end of the period.** Backend `subscription-sync` schedules the change
  in Stripe for `current_period_end`; the page shows the scheduled tier and date instead of
  applying it at once.
- **Card details never enter WorkBeat.** The prototype's card form is replaced by a link to the
  Stripe billing portal (`POST /v1/billing/portal-session`).
- **Retention is a number from 1 to 365**, not the prototype's five presets, because backend
  `company-settings` accepts any whole number in that range; presets stay as quick picks.
- **Time zone and idle threshold are added.** B19 and backend `company-settings` make both
  company settings; the prototype has neither.

## Risks

- Shortening retention deletes older data at the next nightly run. Mitigation: the form confirms
  with the date before which data will be deleted.
