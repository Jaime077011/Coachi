# Coachi Starter Kit

Oct 15, 2026 · @Jamal

How to start building Coachi, in the order you'll work: all screens first on mock data, then Vercel, then the services, then the backend. This replaces the week plan in the Full Spec; everything else there still stands.

## The flow

Six steps in 30 days, starting today. Don't start a step until the gate before it is passed.

&#91;embedded content: build flow · 6 steps, 30 days\]

The frontend gets 12 of the 30 days because every screen gets built and checked in both languages and both themes before any backend exists.

## The rule that makes frontend-first work

Screens never talk to data directly. They call one typed API in `packages/core`, which has two versions: **mock** now and **Supabase** later. When the backend is ready you write the Supabase version, flip one setting, and no screen changes.

1. **Write the shapes first, in Zod.** Every thing the app shows (client, plan, set, meal, coach) gets a Zod schema in `packages/validation`. These are your contract with the future database.
2. **Write the API as an interface,** one per module, using those shapes.
3. **Write the mock version** with realistic Arabic and English data, stored in memory, with a small delay so loading states show.
4. **Screens use TanStack Query hooks** that call the API. They never import mock data.
5. **Later, write the Supabase version** of each module and turn it on.

```ts
// packages/core/src/clients/api.ts
import type { ClientSummary, ClientFile, NewClient } from "@coachi/validation";

export interface ClientsApi {
  list(coachId: string): Promise<ClientSummary[]>;
  get(clientId: string): Promise<ClientFile>;
  invite(input: NewClient): Promise<{ inviteUrl: string }>;
}

// packages/core/src/index.ts
import { mockClients } from "./clients/mock";
// import { supabaseClients } from "./clients/supabase"; // step 4

const source = process.env.NEXT_PUBLIC_DATA_SOURCE ?? "mock";
export const api = {
  clients: source === "mock" ? mockClients : mockClients, // swap to supabaseClients in step 4
};

// apps/web: a screen
const { data, isLoading } = useQuery({
  queryKey: ["clients", coachId],
  queryFn: () => api.clients.list(coachId),
});
```

**Two dev helpers to build in step 0**

- **Dev switcher:** a small floating panel (mock mode only) to switch role (client, coach, super admin), language (AR, EN), theme (dark, light), and data state (normal, empty, error, slow). You test every screen in every state in seconds.
- **Kit page** at `/dev/kit`: every component in both languages and both themes on one page. Your living style guide.

One warning: building screens first means you can design things the database will make hard later. Keeping every screen on the Zod shapes, and checking each new shape against the table list in the Full Spec, prevents that.

## Step 0: Setup (days 1 to 2)

One repo, one web app, shared packages, and everything styled and translated before the first real screen.

**Commands**

```bash
# 1. Repo (pick pnpm when asked), then delete the example apps
npx create-turbo@latest coachi
cd coachi

# 2. The web app
npx create-next-app@latest apps/web --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm

# 3. shadcn with right-to-left on
cd apps/web
npx shadcn@latest init --rtl
npx shadcn@latest add button card input textarea label select command checkbox radio-group switch slider toggle-group tabs accordion dialog drawer sheet dropdown-menu popover tooltip avatar badge progress skeleton sonner calendar carousel scroll-area separator sidebar table chart

# 4. App packages
pnpm add next-intl next-themes @tanstack/react-query @tanstack/react-table react-hook-form @hookform/resolvers zod lucide-react dexie @dnd-kit/core @dnd-kit/sortable date-fns
pnpm add -D @faker-js/faker
```

Also add shadcn's form parts (`form` or `field`, whichever your shadcn version ships). The `chart` part installs Recharts for you.

**Folders**

```
coachi/
  apps/web/                 Next.js app (all screens)
  packages/
    validation/             Zod shapes: the contract
    types/                  generated Supabase types (step 4)
    core/                   API per module: mock now, Supabase later
      clients/ training/ nutrition/ journey/ checkins/
      directory/ billing/ admin/ auth/
    tokens/                 brand colors, sizes, fonts
    i18n/                   ar.json, en.json
    ui/                     custom Coachi parts (SetRow, MacroBar...)
    config/                 ESLint, TypeScript presets
  supabase/                 empty until step 4
```

**Routes** (`apps/web/src/app/[locale]/...`)

| Area | Path | Layout |
| --- | --- | --- |
| Login and join | `/login`, `/join/[code]` | Plain, centered |
| Client | `/app/today`, `/app/plan`, `/app/journey`, `/app/me`, `/app/workout/[dayId]`, `/app/meals`, `/app/check-in`, `/app/intake`, `/app/coaches`, `/app/coaches/[id]` | Bottom tab bar |
| Coach | `/coach/today`, `/coach/clients`, `/coach/clients/[id]`, `/coach/plans`, `/coach/plans/workout/[id]`, `/coach/plans/nutrition/[id]`, `/coach/requests`, `/coach/library`, `/coach/check-in-form`, `/coach/profile`, `/coach/subscription` | Tab bar on phone, sidebar on laptop |
| Super admin | `/admin/overview`, `/admin/coaches`, `/admin/plans`, `/admin/directory`, `/admin/libraries`, `/admin/audit`, `/admin/settings` | Sidebar |
| Dev only | `/dev/kit` | Plain |

`[locale]` is `ar` or `en`. Arabic is the default for new visitors in Egypt.

**Setup checklist**

- [ ] Turborepo with `apps/web` and the packages above
- [ ] shadcn with `--rtl`, brand tokens in `globals.css` (see UI Spec, Foundation)
- [ ] Fonts: Anton, Archivo, Cairo, Badeen Display with `next/font`
- [ ] next-intl with `ar` and `en`, `DirectionProvider`, `dir` on `<html>`
- [ ] next-themes, dark by default
- [ ] Lint rule that blocks `ml-`, `mr-`, `left-`, `right-`, `text-left`, `text-right`
- [ ] TanStack Query provider
- [ ] Zod shapes for every table in the Full Spec
- [ ] Mock API for every module, with Arabic and English sample data
- [ ] Dev switcher and `/dev/kit` page
- [ ] App shells: client tab bar, coach tab bar plus sidebar, admin sidebar
- [ ] Logo and mark files in `apps/web/public/brand/`

## Step 1: Frontend, all screens (days 3 to 14)

Build the client screens first, because they're the core of the product and the hardest to get right on a phone. Then the coach screens, then super admin. Screen details are in the UI Spec.

**Order**

| Days | What |
| --- | --- |
| 3 | Custom parts in `packages/ui`: SetRow, RestTimer, WeekStrip, MacroBar, StatBlock, StatusChip, EmptyState, ResponsiveDialog |
| 4 to 6 | Client screens |
| 7 to 11 | Coach screens (the two plan builders take 2 of these days) |
| 12 to 13 | Super admin screens |
| 14 | Full pass: every screen in Arabic, light mode, empty and error states, real phone |

**A screen is done when**

- It looks right at 390 px (phone) and 1280 px (laptop)
- It works in Arabic and English, dark and light
- It has loading, empty, and error states (check with the dev switcher)
- All text is in `ar.json` and `en.json`, none typed into the code
- It only gets data through `api` and TanStack Query
- You can use it with the keyboard and see the focus ring

**Client screens**

- [ ] Login and join (invite landing)
- [ ] Intake form, 4 steps
- [ ] Find a coach (list and filters)
- [ ] Coach page and send request
- [ ] Today
- [ ] Workout mode, rest timer, workout done
- [ ] Meals
- [ ] Journey and share card
- [ ] Check-in
- [ ] Plan (week view)
- [ ] Me and settings

**Coach screens**

- [ ] Today (needs attention, activity, requests)
- [ ] Clients list and add client
- [ ] Client file: Overview, File, Notes, Plans, Progress, Check-ins tabs
- [ ] Workout plan builder (phone and laptop)
- [ ] Nutrition plan builder (phone and laptop)
- [ ] Templates and assign to clients
- [ ] Requests
- [ ] Library (exercises, foods)
- [ ] Check-in form builder
- [ ] Public profile with live preview
- [ ] Subscription

**Super admin screens**

- [ ] Overview
- [ ] Coaches table and coach panel
- [ ] Record payment
- [ ] Plans editor
- [ ] Directory approvals
- [ ] Libraries
- [ ] Audit log
- [ ] Settings and support mode bar

That's 30 screens in 12 days, which is tight. If you fall behind, cut the super admin down to Coaches and Record payment for launch; you can manage the rest in the Supabase dashboard for the first few coaches.

## Step 2: Deploy to Vercel (day 15)

Put the mock version online so your coach friend can try every screen on his own phone before any backend exists. His feedback now is cheap; after the backend it's expensive.

- [ ] Push the repo to GitHub (private)
- [ ] In Vercel: New Project, import the repo, set Root Directory to `apps/web`. Vercel finds Turborepo and Next.js on its own
- [ ] Env var: `NEXT_PUBLIC_DATA_SOURCE=mock`
- [ ] Functions region: Frankfurt (`fra1`), so it sits next to Supabase later
- [ ] Every branch gets its own preview link; `main` is the live site
- [ ] Add the PWA manifest and icons, then install it on your phone from the live link
- [ ] Send your friend the link. Ask him to do 3 real tasks: add a client, build a plan, log a workout as the client

**Plan note:** Vercel's free Hobby plan is for personal, non-commercial use, and it has no password protection. It's fine for this test phase. Move to Pro ($20 a month) before you charge your first coach. Until then, keep the link private and show a "Demo" label in mock mode.

Source: [Vercel pricing](https://vercel.com/pricing), checked 15 Oct 2026.

## Step 3: Connect services (days 16 to 17)

Open every account, put the keys in Vercel, and check each one works with a tiny test. No screen uses real data yet; the app stays in mock mode.

| Service | For | Setup | Free to start |
| --- | --- | --- | --- |
| Supabase | Database, login, storage, realtime | New project in Frankfurt. Separate projects for staging and production | Yes; free projects pause after a week with no use |
| Resend | Login emails and notices | Verify your domain, then set it as Supabase Auth's email sender (SMTP) | Yes |
| Sentry | Errors | `npx @sentry/wizard@latest -i nextjs` | Yes |
| PostHog | What coaches and clients actually use | EU cloud, add the provider in the app | Yes |
| Inngest | Background jobs (milestones, streaks, reminders) | Add the Vercel integration, one test function | Yes |
| Upstash Redis | Rate limits on login and requests | Add the Vercel integration | Yes |
| Domain | coachi.app or similar | Buy it, point DNS to Vercel, verify in Resend | No, a few dollars a year |

Check the domain and the name in the app stores before you buy. Other fitness apps already use "Coachi".

**.env.example**

```bash
# App
NEXT_PUBLIC_DATA_SOURCE=mock            # mock | supabase
NEXT_PUBLIC_APP_URL=https://coachi.app

# Supabase (newer projects: publishable/secret keys; older: anon/service_role)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=                    # server only, never NEXT_PUBLIC

# Email
RESEND_API_KEY=

# Errors
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com

# Jobs
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Rate limits
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Keep real values in Vercel (Production and Preview) and in a local `.env.local` that git ignores. Only `.env.example` goes in the repo.

## Step 4: Backend (days 18 to 26)

Build the database to match the Zod shapes, then swap mock for Supabase one module at a time. The app keeps working the whole way, because modules not swapped yet still use mock data.

**Local setup**

```bash
npx supabase init            # creates supabase/
npx supabase start           # local Supabase in Docker
npx supabase link            # connect to your staging project
npx supabase migration new orgs_and_profiles
npx supabase gen types typescript --local > packages/types/supabase.ts
npx supabase db push         # send migrations to staging, then production
```

**Order**

| Days | Work |
| --- | --- |
| 18 | Auth and orgs: profiles, organizations, org\_members, roles. Email login with magic link. Middleware sends each role to its area |
| 19 | Billing: plans, plan\_features, subscriptions, payments. Swap the super admin screens |
| 20 | Clients: clients, coach\_clients, client\_details, coach\_notes, invites. Swap the coach client screens |
| 21 | Training: exercises, programs, days, workout and set logs. Swap the builder and workout mode |
| 22 | Nutrition: foods, plans, meals, items, meal logs. Swap the builder and meals |
| 23 | Progress, check-ins, directory, requests. Swap those screens |
| 24 | Journey: events table, Inngest jobs for milestones, streaks, daily stats |
| 25 | Storage buckets: avatars and logos (public), progress photos and receipts (private, signed links). Offline sync of sets with Dexie |
| 26 | Seed data: 150 exercises, 200 Egyptian foods, starter templates, a demo coach. Turn `NEXT_PUBLIC_DATA_SOURCE` to `supabase` everywhere |

**For every module**

- [ ] Migration with the tables, indexes on `(org_id, client_id, date)` where it fits
- [ ] Row rules (RLS) on every table, plus a test that another coach can't read them
- [ ] Database functions for actions with rules: `accept_request`, `record_payment`, `assign_plan`, `finish_workout`
- [ ] Regenerate types and check they match the Zod shapes
- [ ] Write `supabase.ts` for the module's API and switch it on
- [ ] Click through its screens in Arabic and English

**Rule from the Full Spec:** business rules go in Supabase (row rules and database functions), never only in Next.js. That way the Expo app in month two works with the same backend.

## Step 5: Test and launch (days 27 to 30)

Real people, real phones, real data. Launch when your friend and his clients can use it without you standing next to them.

- [ ] Production Supabase project, migrations pushed, seed data loaded
- [ ] Vercel on Pro, domain live, `NEXT_PUBLIC_DATA_SOURCE=supabase`
- [ ] Your friend as the first coach, on a manual subscription you record in super admin
- [ ] 2 of his clients join by invite link, fill intake, and log a full week
- [ ] Watch them use it once without helping. Fix every place they stop
- [ ] Phone checklist from the UI Spec, all ticked
- [ ] Security check: log in as one coach and try to open another coach's client by URL. It must fail
- [ ] Backups on, Sentry alerts to your email, PostHog dashboard for daily active clients
- [ ] Arm icon credit on the About page (game-icons.net, CC BY 3.0)
- [ ] Launch to 3 to 5 coaches

**After launch:** the Expo mobile app, then AI, payments, and chat, as planned in the Full Spec.
