> **Read first — this task list is not the requirement.**
> Capabilities: `app-shell · api-access · ui-conventions`
> The requirements are in [`specs/`](specs/). Run `cd docs && openspec show establish-admin-foundation`.
> Design: [design/README.md](../../../design/README.md) · Decisions: [admin-decisions.md](../../../decisions/admin-decisions.md).

## 1. app-shell

- [x] 1.1 Next.js App Router project, TypeScript strict, Tailwind, shadcn/ui; design tokens from the prototype (light and dark)
- [x] 1.2 Role navigation and landing pages from `GET /v1/me`; route guard per role
- [x] 1.3 Header (company or "Internal console"), user and sign-out, alerts count
- [x] 1.4 Company status banner from `GET /v1/company/status`
- [x] 1.5 Responsive drawer below 900 px
- [ ] 1.6 Tests: each role sees only its navigation; a forbidden URL redirects; a page that gets `403` shows the no-access message; banner per status; no horizontal scroll at 360 px

## 2. api-access

- [x] 2.1 One server-side API client and a same-origin proxy for browser calls: session cookie to bearer token, envelope parsing, zod schemas written from the backend's `portal-api.md` and `staff-api.md` until `packages/shared` exists
- [x] 2.2 `401` or expired session signs out; plain messages per code
- [x] 2.3 Visibility-aware 30 s polling that keeps list state
- [ ] 2.4 Error reporting and logging scrub tokens, keys and signed URLs
- [ ] 2.5 Tests: `401` signs out; token never reaches browser JS; `422` field mapping; `500` retry; no poll while hidden; a logged error contains no token or URL query

## 3. ui-conventions

- [x] 3.1 List toolkit: search, filters (dropdown over four options), pager 10/25/50, empty and loading states
- [x] 3.2 Inline confirmation and danger dialog
- [x] 3.3 Label map for every enum the API returns, with "Other" fallback
- [x] 3.4 Date formatting in `companies.timezone`
- [ ] 3.5 Tests: search resets to page 1; confirm needed for every destructive action; unknown enum shows "Other"; times in company zone; axe check on every page, keyboard path through each dialog
