# Backend requests from WorkBeat Admin — round 9: WorkBeat private sites for every company

> **Built (23 Nov 2026) in WorkBeat-Backend by the admin side**: migration `0018_workbeat_sensitive_domains.sql`,
> staff routes in `staff.controller.ts`, `source` in `policy.controller.ts`, union in `policy.ts`.
> A company `DELETE` of a WorkBeat id answers `404`; an IT Admin's is refused at once by the dry run.

**From:** WorkBeat Admin (the web console) · **To:** WorkBeat-Backend · **Date:** 23 November 2026
**Follows:** round 8 (employee import).
**Decided by the product owner (23 Nov 2026), admin decision A19:**

1. WorkBeat staff keep **one list of private sites that applies to every company**.
2. Agents never record visits to these sites and pause screenshots while they are open, exactly like
   a company's own private sites.
3. Each company sees the WorkBeat sites on its Block list, marked as set by WorkBeat. **No company
   role can add, change or remove them** (not a Company Admin, not an IT Admin through approvals).
4. A company's own private sites, including the defaults seeded by `company_defaults()`, are
   unchanged.

The console is built against the contract below. Please add it to `staff-api.md`, `portal-api.md`,
the agent APIs and the specs (`sensitive-domains`, `serve-agent-policy`), and say if any name or code
differs.

---

## 1. Storage

A platform table, not tenant-scoped, e.g. `platform_sensitive_domains (id uuid, pattern citext
unique, created_by uuid → staff user, created_at)`. Same pattern rules as `sensitive_domains`
(bare host, no wildcard, ≤ 253 characters, lower-case).

## 2. Staff routes (`super_admin` only; every other role `403`)

| Route | Body | Answer |
|---|---|---|
| `GET /v1/staff/sensitive-domains` | | `200` array `{ id, pattern, created_at, created_by_name }`, sorted by pattern |
| `POST /v1/staff/sensitive-domains` | `{ pattern }` | `201` the item. Invalid pattern → `422 VALIDATION_FAILED` (`fields: ["pattern"]`); already on the list → `409 CONFLICT` |
| `DELETE /v1/staff/sensitive-domains/:id` | | `204`; unknown → `404` |

Staff see only the domain list here, no company or employee data (D41).

## 3. Company read: `GET /v1/sensitive-domains`

Add `source` to every item and include the WorkBeat sites:

| field | type | notes |
|---|---|---|
| source | enum(company\|workbeat) | `workbeat` for a row of the platform list; `is_default` is `false` on those |

- Every role that can read the list today sees the WorkBeat sites too.
- `DELETE /v1/sensitive-domains/:id` with a WorkBeat id → `404` (or `403 FORBIDDEN`; please say
  which). An IT Admin's request for it must not become a pending change.
- `POST /v1/sensitive-domains` with a pattern already on the WorkBeat list → `409 CONFLICT`, same as
  a duplicate of the company's own list.
- If a company already has the same pattern on its own list, return both rows (the console shows
  each with its source); removing the company row leaves the site private through the WorkBeat list.

## 4. Agent policy

`sensitive_domains` in `GET /v1/agents/policy` (and the policy stream) is the **union** of the
company's sites and the WorkBeat sites, de-duplicated, sorted as today. Since the ETag is a hash of
the body, a staff add or remove changes every company's policy; please also push the policy event
to connected devices of every company, so computers update within the usual 30 minutes or sooner.

---

**Reply with:** the commit, the answer for a company `DELETE` of a WorkBeat id (`404` or `403`), and
any difference in names or codes.
