# Coach App: Full Spec

Oct 13, 2026 · @Jamal

## Overview

A simple app for fitness coaches in Egypt to manage every client in one place: a full client file, workout plans, nutrition plans, and progress. The end goal is iOS and Android apps. Month one ships a web app that works perfectly on any phone.

- **Who it's for:** online and gym coaches in Egypt, then the Gulf. First user: a coach friend and his clients.
- **Three dashboards:** Super admin (owner), Coach, Client.
- **No payments in the app.** Coaches pay by hand (InstaPay, cash, transfer). The super admin turns subscriptions on and off by hand.
- **Phase one = the coach can fully work:** a client file built from his notes, workout plans, nutrition plans, check-ins, and progress.
- **Two ways to connect:** a coach invites his clients, or a client browses all coaches, picks one, and sends a request or contacts him on WhatsApp. In-app chat comes later.
- **The client sees his journey:** where he started, how far he came, his wins. Built to keep him motivated.
- **Big promises:** very easy to use, Arabic first, works great on a phone.
- **Goal for month one:** 3 to 5 real coaches using it with their real clients.

Not in phase one: the AI helper, in-app payments, chat, the store apps (they come in month two). See the later list at the end.

## Competitor review

The big apps are strong and some are free, but they are built for the US, priced in USD, and English first. None of them is made for an Egyptian coach. That is our gap: Arabic, local habits, simple, and priced in EGP.

| App | Free plan | Paid from (USD/month) | AI features | Good at | Weak at |
| --- | --- | --- | --- | --- | --- |
| [FitPros](https://fitpros.io/for-trainers) | Free, no client limit | 29 (extras) | Not listed | Free core, 1,000+ exercise videos, client app | Unknown long-term; extras behind paywall |
| [QuickCoach](https://www.quickcoach.fit/) | Up to 20 clients | 39 | None named; meal photo calories | Very simple, reusable plans, client check-ins | Branding and push alerts only on Pro |
| [Everfit](https://www.everfit.io/pricing) | Up to 5 clients | 19 (5 clients), 95 (50 clients) | Big: workout builder from text, reply drafts, client Q&A, meal plans, voice | Top ease-of-use score (9.5/10 on G2), full feature set | Cost climbs with clients, many paid add-ons |
| [Trainerize](https://www.fitbudd.com/insights/trainerize-pricing-explained-what-it-actually-costs-trainers-in-2026-vs-better-alternatives) | 1 client | 9 (2 clients), 120 (50 clients) | Not a focus | Deep exercise library, mature, many integrations | Add-ons everywhere, dated look, English only, weak data export |
| [TrueCoach](https://truecoach.co/pricing/) | 14-day trial only | 26 (5 clients), 58 (20 clients) | Not listed | Easy program building, clean client tracking | Weak nutrition, few advanced metrics |
| [Hevy Coach](https://hevycoach.com/pricing) | 30-day trial only | 25 (small tiers) | Not listed | Clients use the popular Hevy app for logging | Coach must pay from client one |
| [ElCoach](https://www.wamda.com/en/2020/03/elcoach-raises-figure-seed) (Cairo) | Free basic programs | Under 20 (2020 info) | Unknown | Arabic market, sells programs to users | Not a tool for coaches; info is old |

**What we copy**

- Phase 2: Everfit's AI that turns a coach's rough notes into a full workout.
- Phase 2: Everfit's AI reply drafts for client messages, edited by the coach before sending.
- QuickCoach's "clients running low on plan" view, so the coach knows who needs a new plan.
- Reusable plan templates, used by every app above.
- Free for clients. Every app above charges the coach only.

**What we avoid**

- Price jumps by client count and paid add-ons. Coaches complain about this most in Trainerize reviews.
- English-only screens. Trainerize reviews call this a trust cost in non-English markets.
- Losing data mid-workout. Reported in Trainerize logger reviews. We save every set as it is entered.
- Locking coaches in. We let them export all client data.

Note: several sources are competitor blogs (QuickCoach, FitBudd, Coachway), so their views lean toward their own product. Prices may have changed. Checked 13 Oct 2026.

## Roles and access

Three roles, each with its own dashboard. A coach only ever sees his own clients. A client only ever sees his own data.

| Action | Super admin | Coach | Client |
| --- | --- | --- | --- |
| Add, pause, delete coaches | Yes | No | No |
| Set a coach's subscription and end date | Yes | No | No |
| Approve or hide a coach in the directory | Yes | No | No |
| See all coaches and usage numbers | Yes | No | No |
| Log in as a coach to help (support mode) | Yes, logged | No | No |
| Edit his public coach profile | No | Yes | No |
| Browse coaches and send a request | No | No | Yes |
| Accept or decline client requests | No | Yes | No |
| Invite clients by link | No | Yes | No |
| Build and edit the client file | No | Own clients | Fills intake form only |
| Build workout and nutrition plans | No | Yes | No |
| Edit the shared exercise and food library | Yes | Add own items | No |
| See workout and meal logs, progress | Totals only | Own clients | Own only |
| See coach's private notes | No | Yes | No |
| Log workouts, meals, weight, check-ins | No | No | Yes |
| See his journey page | No | Yes (preview) | Yes |
| Export data | All | Own clients | Own only |

**Rules**

- When a coach's subscription ends, he can log in and see data, but can't add clients or new plans. His clients can still see their current plan. He is hidden from the directory. Nothing is deleted.
- A client belongs to one coach at a time. He can sign up with no coach and browse. If he moves to a new coach, his history moves with him only if he agrees.
- A client's request shares only his name, goal, and a short message. The coach sees the full intake form only after he accepts.
- Only active coaches approved by the super admin show in the directory.
- Super admin "support mode" shows a red bar at the top and every action is logged.

## Super admin dashboard

You run the business from here. Coaches pay you by hand, and you switch their access on and off in two clicks.

**Home**

- Cards: active coaches, total clients, workouts logged this week, subscriptions ending in the next 7 days
- List: "Ending soon" coaches with a WhatsApp button to remind them
- List: newest coaches and their client count

**Coaches**

- Table: name, phone, plan, client count, status (Trial, Active, Ending soon, Expired, Paused), end date, last active
- Add coach: name, phone, email, plan, start and end date. The app sends a login invite
- Coach page: details, clients count, payment history, notes
- Actions: extend, pause, change plan, support mode, delete (with confirm)

**Coach directory**

- New coach profiles wait for your approval before they show to clients
- Hide a coach (bad reviews, fake info, expired), or feature a few at the top
- See requests per coach and how many get accepted, to spot coaches who never reply

**Subscriptions (manual)**

- Plans you define, for example: Trial (14 days, 5 clients), Basic (20 clients), Pro (unlimited)
- Each plan has: name, price in EGP, client limit, length in days
- Record a payment: coach, amount, method (InstaPay, cash, bank, Vodafone Cash), date, note, optional receipt photo. Saving it extends the end date
- Auto status: Ending soon at 7 days left, Expired after the end date

**Shared libraries**

- Exercises all coaches use: name in Arabic and English, muscle group, equipment, video link, image. Start with 100 to 150 common gym exercises
- Foods all coaches use: name in Arabic and English, serving size, calories, protein, carbs, fat. Start with 150 to 200 common Egyptian foods (foul, ta'meya, koshari, baladi bread, rice, chicken, eggs, etc.)

**Settings**

- App name, logo, support WhatsApp number
- Client limits per plan
- Activity log of admin actions

## Coach dashboard

In phase one the coach can run his whole business here: a full file on every client, workout plans, nutrition plans, check-ins, and progress. Every common task takes three taps or less.

**Home ("Today")**

- Needs attention: clients who missed 2+ workouts, plans ending in 7 days, new check-ins not read
- Today's activity: who logged a workout or meals, with a quick "nice work" reaction
- Quick buttons: Add client, New workout plan, New nutrition plan

**Clients**

- List with photo, name, goal, plan, last workout, this week's adherence (for example 3 of 4 done)
- Search and filter: active, paused, needs attention
- Add client: name and phone only. The app makes an invite link to send on WhatsApp
- Client limit from the coach's plan; a clear message when he hits it

**Requests**

- New client requests from the directory: name, goal, short message, how they want to be contacted
- Accept (the client joins his list and gets the intake form) or decline with an optional short reply
- Contact first on WhatsApp with one tap, before accepting
- Badge on the home screen for new requests; requests with no answer for 48 hours show in "Needs attention"

**Client file (the coach's view of a client)**

Everything the coach knows about the client, built from his own notes and the client's intake form. Tabs:

- **Profile:** age, gender, height, start weight, goal (fat loss, muscle, strength, health), target weight and date, job and daily activity, training days and time, gym or home, equipment
- **Health and history:** injuries, pain areas, conditions the client shares, medicines (as text only), past training, sports
- **Food:** likes, dislikes, foods he won't eat, meals per day, budget level, cooking at home or not, water, supplements
- **Coach notes:** free notes with dates and tags (injury, mindset, food, family, work). Pin the important ones to the top of the file
- **Workout plan:** current plan, edit in place, assign a template
- **Nutrition plan:** current plan, edit in place, assign a template
- **Logs:** workouts (sets, reps, weight, notes) and meals ticked. New personal bests highlighted
- **Progress:** body weight, measurements, lift charts, progress photos side by side
- **Check-ins:** weekly answers, with a reply box

Intake form: the client fills the profile, health and food parts when he joins. The coach reviews and adds his own notes. The client never sees coach notes.

**Workout plan builder**

- A plan = weeks > days > exercises. Each exercise has sets, reps (or time), rest, weight or RPE, tempo, and a note
- Drag to reorder. Copy a day, copy a week
- Supersets and circuits by grouping exercises
- Save any plan as a template, then assign it to many clients in one go

**Nutrition plan builder**

- Daily targets: calories, protein, carbs, fat, water. A simple calculator suggests targets from the client's weight, goal, and activity; the coach can change them
- Meals per day (for example breakfast, lunch, snack, dinner), each with foods and amounts from the food library
- Totals per meal and per day update live
- Swap options per meal ("or" choices) so the client has variety
- Training day and rest day versions of the same plan
- Free text notes per meal and for the whole plan ("no sugar in tea", "eat within 1 hour after training")
- Save as a template, assign to many clients

**Templates**

- The coach's saved workout and nutrition plans, plus a few starter ones we provide (Push Pull Legs, Upper Lower, Full Body 3x; fat loss, muscle gain, maintenance meal plans)

**Libraries**

- Shared exercises and foods + the coach's own, with his own videos and recipes

**Check-in form**

- The coach picks the weekly questions from a list or writes his own. Clients get a reminder on the chosen day

**Profile**

- Public coach profile (what clients see in the directory): photo, name, short bio, specialties (fat loss, muscle, women's training, sports, rehab), city, online or in-person or both, gym name, languages, years of experience, certificates, price range in EGP, before and after results (with client permission), Instagram and WhatsApp
- Open for new clients: on or off. Off hides the request button
- Logo (shown to his clients), subscription status and end date, renew button that opens WhatsApp to you

## Client dashboard

The client opens the app to see today's workout and meals, and to see how far he has come. His profile is his journey, not a form. It is built to keep him going.

**Join**

- Two ways in: open a coach's invite link (joins that coach right away), or sign up alone and pick a coach from the directory
- Logs in with a code sent to phone
- Once he has a coach: fills the intake form (goal, weight, height, injuries, food likes and dislikes, training days)
- Takes a "Day 1" photo and weight (optional, private to him and his coach)
- Sees the coach's name and logo, so it feels like the coach's own app

**Find a coach (directory)**

- List of all active, approved coaches with photo, name, specialties, city, online or in-person, price range
- Filters: goal, city, online or in-person, women coaches, price range, language
- Coach page: full public profile, results, certificates, Instagram
- Two buttons: "Send request" (goal + short message) and "WhatsApp" (opens chat with the coach)
- Request status: sent, accepted, declined. Accepted = he joins the coach and gets the intake form
- A client with no coach yet sees the directory as his home screen
- Later: switch coach from settings, with a choice to take his history with him

**Today**

- Workout card: today's workout name and number of exercises, a Start button. Rest days show a rest message
- Meals card: today's meals with a tick for each, and a calories and protein bar
- Water: tap to add a glass
- Week strip: 7 days with done, missed, or upcoming

**Workout mode**

- One exercise at a time, with video, sets list, last time's weight shown next to each set
- Tap a set to mark it done; weight and reps are pre-filled from last time, change with + and -
- Rest timer starts on its own after each set
- Every set saves right away, even offline. Nothing is lost if the phone locks
- Add a note per exercise ("shoulder hurt") that the coach sees
- Finish screen: total volume, time, new personal bests, and a small win message

**Nutrition**

- Today's meals from the coach's plan, with amounts and swap options
- Tick a meal as eaten, or mark "ate something else" with a short note
- Training day and rest day plans switch on their own

**My journey (the client's profile)**

This is what makes him stay. It shows where he started, how far he has come, and what he has won.

- **Top card:** "Day 47 of your journey", start date, coach's name, current streak
- **Then and now:** Day 1 photo next to the latest one, with a slider. Start weight vs now ("-6.4 kg")
- **Big numbers:** workouts done, total kg lifted, meals on plan this month, longest streak
- **Milestones timeline:** first workout, 10 / 25 / 50 / 100 workouts, first personal best, every 2 kg lost or gained, 4-week streak, each new plan. Each with a date
- **Personal bests:** best lift per exercise, with the date and how much it went up since start
- **Badges:** simple wins like "First week done", "Never missed a Monday", "Protein goal 7 days in a row"
- **Coach's words:** short messages the coach pins to his journey ("Proud of you this month")
- **Goal bar:** start weight, now, and target, so he sees what is left
- **Share card:** make a nice image of a milestone to share on Instagram or WhatsApp, with the coach's logo (free marketing for the coach)

**Check-in**

- The coach's weekly questions, plus weight and photos. Takes under 2 minutes

**Plans**

- The full week ahead for workouts and meals

**Settings**

- Language (Arabic or English), units (kg), reminder times, contact coach on WhatsApp

## AI helper for coaches (phase 2)

Not in phase one. Build it after coaches are using the app, so it learns from real plans and notes. The AI drafts, the coach decides: nothing reaches a client until the coach saves or sends it. Arabic, English, and Egyptian Arabic.

| Feature | What the coach does | What the AI gives back |
| --- | --- | --- |
| Notes to client file | Pastes or speaks notes after a first call | Fills the client file fields, ready to check |
| Notes to workout plan | Pastes rough notes ("push day, bench 4x8…") | A full plan in the builder, ready to edit |
| Notes to nutrition plan | Writes targets and food likes | A meal plan from the food library |
| Client summary | Taps "Summarize" on a client | Last 2 to 4 weeks in 5 lines: adherence, lifts, weight, flags |
| Check-in reply | Opens a check-in | A short reply draft in the coach's tone |
| Weekly report | Nothing, it runs on its own | Monday list: who is doing great, who is slipping |

**Rules**

- The AI only picks exercises from the library, so every exercise has a video and a clean name
- It never gives medical advice. Injuries in a brief only mean "avoid these movements"
- Each plan has a monthly AI limit set by the super admin, to control cost
- Show a small "AI draft" label until the coach edits or approves

**Cost control**

- Use a fast, low-cost model for summaries and replies, and a stronger one only for building plans
- Send only the data needed (last 4 weeks, not all history)
- Log every AI call per coach so you can see cost per coach

## UI/UX rules

If a coach can't add a client and send a plan in his first 5 minutes, we failed. Every screen is judged by that.

**Language and layout**

- Arabic first, full right-to-left layout. English switch in one tap
- Fonts that read well in both: IBM Plex Sans Arabic or Cairo for Arabic, Inter for English
- Numbers stay Western (1, 2, 3) for weights and reps, so they're easy to scan

**Phone first**

- Clients use it at the gym on a phone: big buttons (at least 48px), one hand, bottom navigation
- Coaches use it on phone and laptop: phone for checking clients, laptop for building plans
- Installable on the home screen (PWA), works offline for logging, and feels like an app: no browser bar once installed, safe areas for the iPhone notch and home bar, 16 px inputs so iPhone doesn't zoom, an "Add to home screen" guide for iPhone users. Test every screen each week on a real iPhone (Safari) and a cheap Android (Chrome)

**Simple by design**

- One main action per screen, in one strong color
- Empty screens teach: "No clients yet. Add your first one" with the button right there
- Show last time's numbers everywhere, so nobody has to remember
- Undo instead of "Are you sure?" for small actions
- Fast: every screen loads in under 1 second on a normal phone

**Look**

- Clean and calm: light and dark mode, few colors, soft cards
- Green = done, orange = needs attention, red = missed or expired. Nothing else uses these
- Coach's logo in the client app header

**Onboarding**

- Coach: 3 steps on first login: add logo, add first client, assign a starter template
- Client: a short intake form (under 3 minutes), a Day 1 photo and weight, then straight to today

**Testing**

- Watch your coach friend and 2 of his clients use it, without helping. Fix wherever they stop

## Architecture for growth

The goal is a mobile app. Month one ships a phone-perfect web app (PWA), built so the Expo mobile app plugs into the same backend in month two with no rewrite. Gyms, payments, chat, and AI plug in later the same way. The cost of this in month one is small: a few extra tables and a clear folder structure.

&#91;embedded content: architecture · apps, core modules, database, jobs\]

Every screen goes through the core modules, never straight to the database. Slow work (milestones, stats, alerts) runs in the background, so the app stays fast as it grows.

### The 10 growth rules

1. **One app, split into modules.** One Next.js app now, but code lives in modules: auth and orgs, billing and plans, directory, clients and notes, training, nutrition, journey, check-ins, notifications, admin. Each module owns its tables and functions. Modules call each other's functions, never each other's tables. Later, any module can move out on its own.
2. **Backend first, in Supabase.** Business rules live in Supabase: row rules, database functions (RPC), and Edge Functions for heavier work. The web app now and the mobile app later call the same backend, with the same Zod checks and types. Next.js server actions are only for web-only things, like admin tools. Nothing the client or coach needs may live only in Next.js.
3. **Organizations from day one.** Every coach works inside an organization. A solo coach = an organization of one. Later a gym adds many coaches, a head coach, and assistants with no data changes. Every row carries org\_id, and security rules check membership.
4. **Plan features, not fixed limits.** Plans give features: client\_limit, nutrition, directory\_listing, ai\_credits, branded\_app. Code asks "can this org do X?" in one place. When payments come, only the subscription source changes, not the checks.
5. **Coach and client linked by their own table.** coach\_clients keeps start, end, and status. This gives full history, coach switching, and later more than one coach per client (trainer + nutritionist).
6. **Events and background jobs.** Important actions write an event (workout\_logged, request\_sent, checkin\_sent). A job worker (Inngest or Trigger.dev) reacts: milestones, streaks, daily stats, notifications. The app stays fast, and AI, WhatsApp, or reports plug in later as new listeners.
7. **Fast dashboards with summary tables.** Jobs keep daily\_client\_stats and journey numbers up to date, so the coach home and journey page don't scan every set ever logged. Indexes on (org\_id, client\_id, date).
8. **Ready for chat, AI, and mobile.** conversations and messages tables are designed now and built later on Supabase Realtime. Notes and logs are stored as clean text plus structured fields, so AI can read them later. Every AI call will be metered against ai\_credits.
9. **Store data the boring, safe way.** Times in UTC + user time zone. Weight in kg, length in cm, convert on screen. Money as whole piasters + currency (EGP now, SAR later). Soft delete (deleted\_at) on main tables. Private photo storage with signed links.
10. **Translations and settings are data.** All words in translation files (Arabic, English, more later). Exercise and food names in both languages in the database. Feature flags per org, so you can test new features with your friend first.

### Code structure

A Turborepo monorepo, so a mobile app and a jobs worker can share the same types and logic later.

```
apps/
  web/           Next.js PWA: client, coach, super admin (month one)
  mobile/        Expo app for iOS + Android (month two), same backend
  jobs/          Inngest or Trigger.dev functions
supabase/
  migrations/    tables, row rules, database functions (RPC)
  functions/     Edge Functions for heavier work
packages/
  core/          shared TypeScript calls to Supabase, one folder per module
    auth-orgs/  billing/  directory/  clients/  training/
    nutrition/  journey/  checkins/  notifications/  admin/
  validation/    Zod schemas shared by web and mobile
  types/         generated Supabase types
  tokens/        brand colors, sizes, fonts (Tailwind + NativeWind)
  i18n/          Arabic + English text
  ui/            web components (shadcn/ui, RTL ready)
  config/        ESLint, TypeScript presets
```

**Stack, month one:** Next.js (App Router) + TypeScript + Tailwind v4 + shadcn/ui · Supabase (Postgres, Auth, Storage, Realtime, Edge Functions) · TanStack Query · Dexie for offline workout logging · next-intl · React Hook Form + Zod · Recharts · Inngest or Trigger.dev · Resend · Sentry · PostHog · Vercel, same region as Supabase (Frankfurt).

**Stack, month two:** Expo + Expo Router + NativeWind (same brand tokens) + PowerSync for offline sync with Supabase. Same backend, same types, same translations.

### Database

Every main table also has id (uuid), org\_id where it applies, created\_at, updated\_at, and deleted\_at. Tables marked later are designed now and built when needed.

| Module | Table | Main fields | Why it helps growth |
| --- | --- | --- | --- |
| Auth + orgs | profiles | role, name, phone, avatar, language, time\_zone | One login for any role |
| Auth + orgs | organizations | name, type (solo, gym), logo, city | Gyms with many coaches later |
| Auth + orgs | org\_members | org\_id, profile\_id, role (owner, head\_coach, coach, assistant) | Teams without a rewrite |
| Billing | plans | name, price\_piasters, currency, days | Prices in any currency |
| Billing | plan\_features | plan\_id, key, value (client\_limit, nutrition, directory\_listing, ai\_credits, branded\_app) | New plans = new rows, no code |
| Billing | subscriptions | org\_id, plan\_id, status, starts\_at, ends\_at, source (manual, paymob later) | Payments plug in later |
| Billing | payments | org\_id, amount\_piasters, method, paid\_at, note, receipt\_url | Manual now, gateway later |
| Billing | feature\_flags | org\_id, key, on | Test features with one coach first |
| Directory | coach\_profiles | profile\_id, org\_id, bio, specialties, city, mode, gym, languages, years, certificates, price range, instagram, whatsapp, open\_for\_clients, listed, featured | Public profile kept apart from private data |
| Directory | coach\_results | coach\_id, before\_url, after\_url, caption, client\_ok | Results with permission |
| Directory | coach\_requests | client\_id, coach\_id, goal, message, contact\_by, status, reply | Directory sign-ups |
| Clients | clients | profile\_id, status, goal, target\_weight, target\_date | The client himself |
| Clients | coach\_clients | org\_id, coach\_id, client\_id, role (trainer, nutrition), status, started\_at, ended\_at | History, switching, more than one coach |
| Clients | client\_details | client\_id, age, gender, height, activity, training days, place, equipment, injuries, health notes, food likes and dislikes, meals per day, supplements | The client file |
| Clients | coach\_notes | coach\_id, client\_id, text, tags, pinned | Private notes, AI-ready later |
| Clients | invites | org\_id, coach\_id, code, expires\_at, used\_by | Invite links |
| Training | exercises | org\_id (null = shared), name\_ar, name\_en, muscle, equipment, video\_url | Shared + own library |
| Training | programs | org\_id, coach\_id, client\_id (null = template), name, weeks, starts\_on, version | Templates and copies |
| Training | program\_days | program\_id, week, day, title | Weeks and days |
| Training | program\_exercises | program\_day\_id, exercise\_id, order, sets, reps, rest\_sec, target, tempo, note, group | Supersets via group |
| Training | workout\_logs | client\_id, program\_day\_id, started\_at, finished\_at, note, client\_uuid | client\_uuid = safe offline sync |
| Training | set\_logs | workout\_log\_id, exercise\_id, set\_no, weight\_kg, reps, rpe, done | One row per set |
| Nutrition | foods | org\_id (null = shared), name\_ar, name\_en, serving, kcal, protein, carbs, fat | Egyptian foods + own |
| Nutrition | nutrition\_plans | org\_id, coach\_id, client\_id (null = template), name, targets, day\_type, notes, version | Training and rest days |
| Nutrition | meals | nutrition\_plan\_id, order, name, note | Meals per day |
| Nutrition | meal\_items | meal\_id, food\_id, amount, swap\_group | "Or" choices |
| Nutrition | meal\_logs | client\_id, meal\_id, date, status, note | Ticks |
| Progress | body\_metrics | client\_id, date, weight\_kg, waist\_cm, photo\_paths | Then and now |
| Check-ins | checkin\_forms | org\_id, coach\_id, questions (json), day\_of\_week | Coach's questions |
| Check-ins | checkins | client\_id, form\_id, answers (json), coach\_reply | Weekly |
| Journey | milestones | client\_id, type, value, reached\_at | Made by jobs |
| Journey | journey\_messages | coach\_id, client\_id, text, pinned | Coach's words |
| Journey | daily\_client\_stats | client\_id, date, workouts, volume\_kg, meals\_on\_plan, streak | Fast dashboards |
| Platform | events | org\_id, type, actor\_id, subject\_id, payload (json), processed\_at | Feeds jobs, AI, reports |
| Platform | notifications | profile\_id, type, title, body, link, channel, read\_at | Push, email, WhatsApp later |
| Platform | notification\_prefs | profile\_id, channel, type, on | User controls |
| Platform | audit\_log | actor\_id, action, target, meta | Admin and support mode |
| Chat (later) | conversations, messages | org\_id, members; conversation\_id, sender\_id, body, read\_at | Built on Realtime |
| AI (later) | ai\_usage | org\_id, feature, tokens, cost | Metered by ai\_credits |

### Growth stages

Don't build for stage 3 now. Build so each step is a small change, not a rewrite.

| Stage | Sign you're there | What changes |
| --- | --- | --- |
| 1. Launch | Your friend + a few coaches | Phone-perfect PWA. Free plans on Vercel and Supabase. Manual subscriptions. WhatsApp buttons |
| 2. Growing | Coaches pay every month, free limits get close | Paid Supabase and Vercel. Daily backups. Push alerts. Turn on paid gateway as a new subscription source |
| 3. Gyms and teams | A gym wants many coaches | Turn on org roles (head coach, assistant). Gym dashboard. Shared templates per org |
| 4. Mobile and chat | Month two, once the web app is live | Expo app for iOS and Android on the same Supabase backend. NativeWind for shared styles, PowerSync for offline. Chat on Realtime. Push from the jobs worker |
| 5. Big | Pages or the directory get slow | Read copies of the database. Directory search on Meilisearch or Typesense. Image CDN. Move a busy module (like notifications) into its own service |
| 6. Gulf | Saudi or UAE coaches join | SAR and AED prices, local payment gateway, region data rules, local food library |

### Security

- Row Level Security on every table, with tests that try to read another org's data and must fail
- A coach reads only his org's rows. A client reads only his own rows and his assigned plans
- Anyone signed in can read only the public fields of listed, active coaches
- Admin and support actions run on the server only, and every one writes to audit\_log
- Rate limits on login, sign-up, and coach requests
- Progress photos in a private bucket, opened only with short-lived signed links

### Ops from day one

- Three environments: local, staging, production. Each its own Supabase project
- Database changes only through migrations in git (Supabase CLI), never by hand in production
- CI on every push: type check, lint, tests, security rule tests
- Sentry for errors, PostHog for what coaches actually use, an uptime check
- Seed scripts for exercises, foods, and demo data, so a new environment is ready in minutes

## 1-month build plan

Four weeks, launch on Nov 10 with 3 to 5 coaches. Anything not on this list waits.

&#91;embedded content: 4-week build plan · launch Nov 10\]

Phase one is all about the coach working fully, and the client seeing his journey. The journey page comes last because it needs real logs to show.

**Week 1 (Oct 13 to 19): talk + foundation**

- [ ] Talk to your friend and 5 to 10 coaches; confirm the must-haves
- [ ] Ask your friend for his real client notes and a sample meal plan, to shape the client file and nutrition builder
- [ ] Sketch the main screens (coach home, client file, plan builders, client today, journey)
- [ ] Monorepo (Turborepo) with Next.js + Supabase, core modules folders, local + staging + production, CI, Arabic/English, RTL
- [ ] Login, three roles, invite links
- [ ] All database tables as migrations, security rules with tests, business rules as database functions, events table + jobs worker
- [ ] Load 100 to 150 exercises and 150 to 200 Egyptian foods

**Week 2 (Oct 20 to 26): super admin + coach core**

- [ ] Super admin: coaches, plans, manual payments, status, directory approval
- [ ] Coach: clients list, add client by invite, intake form, public profile, requests inbox
- [ ] Client file: profile, health, food, coach notes
- [ ] Workout plan builder + templates

**Week 3 (Oct 27 to Nov 2): nutrition + client app**

- [ ] Nutrition plan builder: targets, meals, swaps, training and rest days, templates
- [ ] Client: find a coach (directory, filters, coach page, request, WhatsApp) + today screen with workout, meals, water
- [ ] Workout mode with per-set saving and offline logging
- [ ] Meal ticks, body weight, photos, weekly check-ins
- [ ] Coach home "needs attention"

**Week 4 (Nov 3 to 9): journey + polish**

- [ ] Journey page: then and now, big numbers, milestones, PBs, badges, coach's words, goal bar
- [ ] Share card image
- [ ] PWA install, real iPhone and Android test, speed pass
- [ ] Test with your friend and 2 of his clients; fix what blocks them
- [ ] Launch Nov 10 to 3 to 5 coaches

**Later list (not in phase one)**

- AI helper for coaches (see its section)
- In-app payments (Paymob, Fawry)
- WhatsApp reminders and messages
- In-app chat between client and coach (until then, WhatsApp buttons)
- Expo mobile app for iOS and Android (month two), on the same backend. Apple Developer $99/year, Google Play $25 once
- Coach's own branded app
- Grocery list from the meal plan
