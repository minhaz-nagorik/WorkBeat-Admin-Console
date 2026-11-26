## Purpose

The Company settings card where a company admin connects tamper alerts to a Slack channel.

## ADDED Requirements

### Requirement: A company admin connects Slack
<!-- source: product owner 26 Nov 2026 · A6 · A7 -->
Company settings SHALL show a Slack alerts card with a masked webhook URL field. It MUST show only whether Slack is connected, never the URL. Disconnecting MUST say what it does before it does it.

#### Scenario: Connect
- **WHEN** an admin pastes a `https://hooks.slack.com/services/…` URL and presses Connect
- **THEN** the card shows Connected and the field is empty

#### Scenario: A URL that is not Slack's
- **WHEN** an admin pastes `https://example.com/hook`
- **THEN** the field explains where to get the URL and nothing is sent

#### Scenario: Disconnect
- **WHEN** an admin presses Disconnect
- **THEN** a confirm says alerts stop going to the channel and emails are not affected

#### Scenario: Help
- **WHEN** an admin presses the `?` button on the Slack alerts card
- **THEN** a dialog lists, step by step, how to make a Slack incoming webhook and copy its URL
