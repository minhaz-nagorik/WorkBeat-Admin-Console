# WorkBeat Admin

The web platform for Company Admins, Managers, IT Admins and WorkBeat staff. Rules: [CLAUDE.md](CLAUDE.md).
Specs: [docs/](docs/README.md). Progress: [docs/BUILD-ORDER.md](docs/BUILD-ORDER.md).

## Run

```bash
pnpm install
cp .env.example .env.local   # set API_BASE_URL to the WorkBeat API
pnpm dev                     # http://localhost:3001 (the API's PORTAL_URL)
```

`pnpm test` (unit tests, `node --test`), `pnpm typecheck`, `pnpm lint`, `pnpm build`.

## How it fits together

- `src/app/api/[...path]` proxies the browser's `/api/v1/...` calls to the API, adding the bearer
  token from the httpOnly `wb_session` cookie. Sign-in answers set the cookie and lose the token.
- `src/app/(app)/layout.tsx` loads `GET /v1/me`, guards the page by role (`src/lib/nav.ts`) and
  renders the shell. Pages not built yet fall through to `src/app/(app)/[...slug]`.
- Styles are the prototype's CSS (`src/app/globals.css`), with Tailwind utilities and no preflight.
  shadcn/ui and zod schemas are not added yet; add them with the first page that needs them.
