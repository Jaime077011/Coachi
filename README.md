# Coachi

A coaching app for fitness coaches in Egypt: client files, workout and nutrition plans, check-ins, progress, a public landing page per coach, and coach teams. Arabic first, phone first.

The plan lives in four docs at the repo root: `Coach App Full Spec.md` (what and why), `Coachi UI Spec.md` (every screen), `Coachi Brand Guidelines.md`, and `Coachi Starter Kit.md` (build order).

## Run it

Needs Node 24+ and pnpm.

```bash
pnpm install
pnpm dev            # http://localhost:3000 (redirects to /ar)
pnpm check-types
pnpm lint
```

The app runs on mock data until Step 4 (`NEXT_PUBLIC_DATA_SOURCE=mock`, the default). Mock changes are kept in the browser's localStorage.

## Dev switcher

In mock mode a floating "Dev switcher" button sits at the bottom corner. Use it to switch:

- **Role:** client, coach, super admin
- **Team role** (coach only): owner, head coach, coach, assistant
- **Language, theme, data state** (normal, empty, error, slow)
- **Reset demo data** and the component kit at `/dev/kit`

Useful demo links: `/ar/c/ahmed-samir` (a coach landing page), `/ar/join/AHMED-NADA-7Q` (a client invite).

## Layout

```
apps/web/             Next.js app: every screen (client /app, coach /coach, admin /admin, landing /c/[slug])
packages/validation/  Zod shapes: the contract with the future database
packages/core/        One typed API per module; mock now, Supabase in Step 4
packages/i18n/        ar.json and en.json (same keys)
packages/tokens/      Brand colors, sizes, fonts
```

Screens never touch data directly: they call `api.<module>` from `@coachi/core` through TanStack Query. Team permissions live in one table, `teamPermissions` in `packages/validation/src/team.ts`, used by the screens now and the Supabase row rules later.
