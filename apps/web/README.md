# @coachi/web

The Coachi web app (Next.js, App Router). See the root `README.md` for how to run it and how the repo is laid out.

- Routes live under `src/app/[locale]/`: `app/` (client), `coach/`, `admin/`, `c/[slug]` (public landing page), `(auth)/` (login and join), `dev/kit`.
- Shared Coachi parts are in `src/components/coachi/`; shadcn parts in `src/components/ui/`.
- Data only through `api` from `@coachi/core` and TanStack Query keys in `src/lib/query-keys.ts`.
- All text in `packages/i18n/messages`. A lint rule blocks left/right classes: use start/end so Arabic flips.
