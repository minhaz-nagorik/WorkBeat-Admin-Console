# CLAUDE.md — the ten rules

WorkBeat Admin: the one web platform (D41) for Company Admins, Managers, IT Admins and WorkBeat
staff. Next.js 14+ (App Router), Tailwind, shadcn/ui, deployed on Vercel. These rules are cheap to
break and expensive to discover. **Every diff is bound by them.** The requirements are in
`docs/openspec/`; run every `openspec` command from `docs/`.

1. **The API is the only data source.** Every read and write goes through the NestJS API with the
   session token from `POST /v1/auth/login`, sent by the app's server only. Never touch the
   database or file storage, never put the token in browser JS (Plan-v3.5 §2.2, A2).
2. **Hiding a page is never the control.** Navigation follows the role from `GET /v1/me`, but the
   API refuses what the role may not do. The UI handles that refusal; it never relies on hiding (D41).
3. **Staff never see employee data.** The staff area renders no employee, device, activity, URL or
   screenshot, and there is no impersonation (D41).
4. **No secret leaves the screen.** Licence key, uninstall token, signed URLs and tokens are never
   logged, put in a URL, stored in browser storage or sent to analytics. They are masked until
   revealed (A6).
5. **Plan v3.5 wins over the prototype.** The prototype fixes look, layout and wording; where it
   contradicts the plan (MDM guides, reassigning a device, pause keeping blocking, company-wide
   screenshots) the plan is built ([design/README.md](docs/design/README.md), A1).
6. **People words, not system words.** Employees and admins read plain language: no `hosts_modified`,
   heartbeat, watchdog or enum value on screen. Labels live in one map (A4).
7. **Company time, not browser time.** Days, weeks and times show in `companies.timezone` (A9, B19).
8. **Every destructive action says what it does before it does it**: release, deactivate, remove,
   cancel, delete, suspend, reissue (A7).
9. **Accessible by default.** Keyboard reachable, labelled controls, visible focus, colour never the
   only signal, WCAG 2.2 AA (A11).
10. **Spec before code.** A behaviour change starts as an OpenSpec change in `docs/openspec/changes/`.
    `openspec validate --all --strict` is a merge gate. **WorkBeat Plan v3.5 is the source of
    truth**; D-numbers are its rulings, B-numbers the backend's, A-numbers this repository's.
