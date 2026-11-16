# openspec/ — writing a requirement

`docs/` explains. **This directory specifies.** A doc never states a normative requirement; a spec
never explains why.

## Format that fails validation if you get it wrong

```markdown
### Requirement: <name>
<!-- source: D48 · A7 · backend `device-lifecycle` · Prototype "Devices" -->
The Devices page SHALL ...

#### Scenario: <name>
- **WHEN** <condition>
- **THEN** <expected outcome>
- **AND** <expected outcome>
```

- **SHALL or MUST** in every requirement. Never "should", never "may".
- **Exactly four hashtags** on `#### Scenario:`. Three parse as something else and the requirement
  validates with no scenario — silently.
- **At least one scenario** per requirement.
- **Under 500 characters** per requirement statement. Split rather than run over.
- **`## Purpose`** (≥50 chars) on a new-capability delta only.
- **`## Why`** 50–1000 chars in a proposal.
- **≤10 deltas** per change.

## What a spec here describes

**Observable behaviour of the web platform**: the page, who may open it, what it shows, which API
route it calls, what each control does and what the person reads for each response code. Use the
backend's route paths, field names and codes; never React component, hook or file names.

The API is a consumer contract. Never specify what the API does; cite the backend capability
(`role-access`, `device-lifecycle`, …) a requirement relies on.

## Sources

Cite **D-numbers** (Plan v3.5 Appendix A), **B-numbers** (WorkBeat-Backend
`docs/decisions/backend-decisions.md`), **A-numbers** ([admin-decisions.md](../decisions/admin-decisions.md)),
`Plan-v3.5 §n`, backend capabilities in backticks, then `Prototype "<page>"` and `PRD "<section>"`.

## Commands

```bash
cd docs                              # the CLI resolves openspec/ from here
openspec list --changes
openspec show <change-id>
openspec validate --all --strict
```

`openspec/specs/` is empty by design. Every capability is an `ADDED` delta inside a change;
`openspec archive` promotes it when the change ships.
