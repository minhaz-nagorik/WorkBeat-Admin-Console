## Why

Company admins want tamper alerts in their Slack channel as well as by email (product owner,
26 Nov 2026). The backend takes a Slack incoming-webhook URL (backend change `slack-alerts`).

## What Changes

- **A Slack alerts card on Company settings**: paste a webhook URL to connect, change it, or disconnect.
  The URL is typed into a masked field and never shown again (A6).

## Capabilities

### New Capabilities

- `slack-alerts`: the Slack card on Company settings.
