# Coachi UI Spec

Oct 15, 2026 · @Jamal

How every Coachi screen looks and works, for the web app in month one and the mobile app after. Built on shadcn/ui, styled with the Coachi brand, Arabic and English equal, dark mode first.

## Foundation

shadcn/ui is the base, with its built-in right-to-left mode on from day one. Every color, font, and corner comes from the Coachi Brand Guidelines, so the app never looks like a default shadcn app.

**Setup**

- Start the project with `npx shadcn@latest init --rtl` (Radix base). This sets `rtl: true` in `components.json`, so every component added later uses classes that flip on their own for Arabic (`ms-4` instead of `ml-4`, `text-start` instead of `text-left`).
- Wrap the app in shadcn's `DirectionProvider`, with the direction taken from the language (`ar` = rtl, `en` = ltr).
- Themes with `next-themes`: `attribute="class"`, `defaultTheme="dark"`, with System and Light as options in settings. This replaces the `data-theme` snippet in the brand guidelines.
- Icons: Lucide (comes with shadcn), 1.75 px stroke, 20 px in the UI, 24 px in the tab bar.
- Fonts: Anton and Badeen Display for big moments, Archivo and Cairo for the UI, loaded with `next/font` as in the brand guidelines.

**Brand tokens mapped to shadcn**

| shadcn variable | Light | Dark | Coachi role |
| --- | --- | --- | --- |
| --background | #F4EFE6 | #040814 | Page |
| --foreground | #040814 | #F4EFE6 | Main text |
| --card / --popover | #FDFDFD | #121C30 | Cards, menus, sheets |
| --primary | #C8141E | #FF5A3A | The one main action |
| --primary-foreground | #FDFDFD | #040814 | Text on primary |
| --secondary / --muted / --accent | #EAE3D6 | #1B2740 | Secondary buttons, inputs, hover |
| --muted-foreground | #4A5468 | #A9B1C2 | Descriptions, labels |
| --destructive | #A3124F | #FF7AA2 | Errors, delete |
| --border / --input | #DDD4C4 | #26324D | Lines and field borders |
| --ring | #C8141E | #FF7A45 | Focus ring |
| --radius | 0.75rem | 0.75rem | Buttons 12 px; cards use radius-lg 16 px |
| --chart-1 to --chart-5 | #F2412E, #1D5FD1, #15803D, #B45309, #4A5468 | #F2412E, #5EA8FF, #2BC48A, #FDB022, #A9B1C2 | Chart series |

Add four tokens shadcn doesn't have: `--success`, `--warning`, `--info` (values in the brand guidelines) and `--fire` (the fire gradient). Register them in Tailwind's `@theme` so classes like `text-success` and `bg-fire` work.

**Look rules that make it Coachi, not stock shadcn**

- Dark first. Cards sit on Ink with a 1 px border, no shadows.
- Big numbers in Anton, in both languages: weights, streaks, day counts. This is the signature.
- Red only for the main action and for wins. Everything else is calm.
- Fire gradient only on progress, streaks, milestones, and the mark. Never behind text.

## App shell and navigation

One app, three shells. The login decides which menu you get, and nobody sees another role's screens.

&#91;embedded content: navigation · client, coach, super admin\]

Today is the client's most-used screen, so it holds the shortcuts to meals, check-in, and workout mode. Phone tab bars never go over 5 items; on laptop the coach and super admin get a side menu (on the right in Arabic).

## Client screens

The client uses Coachi on a phone, often mid-workout with one hand. Every screen is built for a 390 px phone first; on bigger screens the content centers in a 560 px column.

| Screen | What's on it | Built from | Empty and special states |
| --- | --- | --- | --- |
| Join | Invite landing with the coach's name, photo, and logo. Phone code login, email magic link as fallback. Team invites say "Coach Ahmed invited you to his team as Assistant" and land in the coach dashboard | Card, Form, Input, Button | Expired invite: say so and show a "Find a coach" button |
| Intake form | 4 short steps: goal, body, health, food. Progress bar on top, Back and Next at the bottom | Form, Progress, RadioGroup, ToggleGroup chips, Textarea | Saves each step, so leaving and coming back continues where he stopped |
| Find a coach | Search, filter chips (goal, city, online, women coaches, price), coach cards. Home screen while he has no coach | Input, ToggleGroup, CoachCard | No results: "No coaches match. Clear filters" |
| Coach page | Photo, bio, specialties, results, prices, certificates. Sticky bottom bar: Send request + WhatsApp | ScrollArea, Carousel, Badge, Drawer for the request form | Request sent: the bar changes to "Request sent" with its status |
| Today | Greeting and date, week strip, workout card with a big Start button, meals card with calories and protein bars, water tap, check-in card when due, latest coach message | WeekStrip, Card, MacroBar, Button | Rest day: rest card with optional mobility. No plan yet: "Your coach is building your plan" |
| Workout mode | Full screen, no tab bar. Top: exercise 3 of 7 and a progress line. Video, then set rows with last time's numbers, then notes. Rest timer slides up after each set | SetRow, RestTimer (Drawer), Progress, Textarea | Offline: a small banner; sets still save. Leaving mid-workout asks to finish or keep for later |
| Workout done | Time, total kg lifted, new personal bests, a win message, Share button | StatBlock, PBBadge, ShareCard | First workout ever: a bigger celebration, once |
| Meals | Today's meals as an accordion: foods, amounts, swap choices. Tick eaten, or "Ate something else" with a note. Totals bar stays on top | Accordion, RadioGroup for swaps, Checkbox, Drawer, MacroBar | Training and rest day plans switch on their own |
| Journey | Day 47 card, then-and-now photo slider, big numbers 2 x 2, goal bar, milestones timeline, personal bests, badges, coach's words, Share | ThenNowSlider, StatBlock, GoalBar, MilestoneTimeline, Carousel, ShareCard | Week one: "Your journey starts here" with the Day 1 photo and first milestones to unlock |
| Check-in | The coach's questions, weight, 3 photo slots (front, side, back), note. Under 2 minutes | Form, Slider, Input, PhotoSlot, Textarea | Sent: "Sent to your coach" with the date of the next one |
| Plan | The week ahead, tabs for Workouts and Meals, tap a day to see it | Tabs, Card | Plan ends soon: a calm info note |
| Me | Profile, language, theme (Dark, Light, System), reminder times, contact coach, my data export, log out | Card, Select, Switch, Button | Switching language reloads into the new direction |

**Client tab bar (4 tabs):** Today, Plan, Journey, Me. Meals and check-in open from Today, so the bar stays short.

## Coach screens

The coach checks clients on his phone and builds plans on a laptop. Every screen works on both, but the plan builders are designed laptop-first.

| Screen | What's on it | Built from | Empty and special states |
| --- | --- | --- | --- |
| Today | Needs attention (missed 2+ workouts, plan ending, unread check-ins, requests older than 48 h), each with a quick action. Today's activity feed with a "Nice work" reaction. Add client and New plan buttons | Card, StatusChip, Avatar, Button | All clear: "Everyone is on track today" |
| Clients | Search, filter tabs (Active, Paused, Needs attention), rows with photo, name, plan, this week's adherence, last workout. Phone: list. Laptop: sortable table | Tabs, Input, DataTable (TanStack Table), AdherenceBar | No clients: "Add your first client" with the invite button. Hit plan limit: clear note + renew on WhatsApp |
| Add client | Name and phone, then an invite link with Copy and Share on WhatsApp | Drawer (phone) / Dialog (laptop), Form, Button | Link already used: show who joined |
| Client file | Header: photo, name, goal, status, WhatsApp, Assign plan. 6 tabs: Overview, File, Notes, Plans, Progress, Check-ins | Tabs (scrolls sideways on phone), Card | New client who hasn't filled intake: "Waiting for intake form" + resend |
| File tab | Profile, health and history, food, as accordion sections. Edit in place | Accordion, Form | Empty fields show "Not filled" in muted text |
| Notes tab | Note box with tag chips (injury, mindset, food, family, work) and Pin. Notes newest first, pinned on top | Textarea, ToggleGroup, Card | Only the coach ever sees this tab |
| Progress tab | Body weight chart, lift charts, logs, photos side by side | Chart (shadcn charts), ThenNowSlider, Table | Not enough data: "Charts show after 2 weeks of logs" |
| Workout plan builder | Laptop: 3 panes. Weeks and days on one side, the day editor in the middle, exercise search on the other side, drag to add. Phone: one day at a time, "Add exercise" opens search in a bottom sheet | ExerciseRow, Command (search), dnd-kit, DropdownMenu (copy day, copy week, group as superset) | Autosaves. Shows "Saving" then "Saved". Undo in a toast |
| Nutrition plan builder | Targets card with suggested numbers, Training and Rest day tabs, meals as accordion, food search, amounts, swap groups. Totals bar sticks to the top and updates live | Tabs, Accordion, Command, Input, MacroBar | Over target: the bar turns warning, never blocks saving |
| Templates | Workout and nutrition templates as cards, plus starter templates. Assign to many clients at once | Card, Tabs, Command multi-select in a Dialog | No templates: "Save any plan as a template" |
| Requests | New requests from the directory: name, goal, message. Accept, Decline with a reply, WhatsApp | Card, Button, Drawer for the reply | No requests: tip to complete the public profile |
| Library | Exercises and foods tabs, shared + his own, add his own with video link | Tabs, DataTable, Form | Search finds nothing: "Add it as your own" |
| Check-in form | Pick questions from a list or write new ones, drag to reorder, choose the day | Sortable list, Select, Switch | Starter set of 5 questions ready to use |
| Public profile | Edit form on one side, live preview of his coach card and page on the other (stacked on phone). Open for new clients switch. Landing page card on top: his link with Copy, Open, Share on WhatsApp; page on/off; link, headline, show team. Packages editor (up to 4): name, price, weeks, what's included, Most popular | Form, Switch, CoachCard preview, Card | Waiting for approval: info note (directory only; the landing page works without approval). Link taken: field error |
| Team | Seats used (2 of 5) with a bar. Members: photo, name, role chip, assigned clients, status. Invite helper, change role, remove. A "What each role can do" card | Card, Progress, Avatar, Select, ResponsiveDialog, RadioGroup | No helpers: "Add your first team member". No seats on the plan: note + Renew on WhatsApp. Owner only |
| Invite helper | Name, phone, role (each role with one line on what it can do), then an invite link with Copy and Share on WhatsApp | Drawer (phone) / Dialog (laptop), Form, RadioGroup | Seats full: clear note + Renew on WhatsApp |
| Subscription | Plan, client limit, end date, Renew on WhatsApp | Card, Progress, Button | Ending soon: warning chip. Expired: read-only mode banner |

**Coach navigation:** phone tab bar with Today, Clients, Plans, Requests, More (Library, Check-in form, Profile, Team, Subscription, Settings). Laptop: a side menu with all of these.

**Team members see less.** The menu shows only what the helper's role allows (an assistant has no Plans or Requests tab). Opening a hidden screen by link shows "Only the account owner can open this". In the client file, read-only roles see no edit buttons, never disabled ones. Owners and head coaches see an "Assigned to" field in the client file header and a team filter on the clients list.

## Coach landing page

The coach's public page at `/c/<link>`. No login, no app shell: it is a marketing page, opened from Instagram and WhatsApp on a phone. It follows the brand like the app (dark first, Anton numbers, red only for the main action) and works in Arabic and English with a language switch on top.

| Part | What's on it | Built from | Special states |
| --- | --- | --- | --- |
| Top bar | Coach's logo or name, language switch | Button, ToggleGroup | |
| Hero | Cover image (or plain Ink), photo, name, headline, city, mode, years. Start with me (primary) + WhatsApp | Avatar, Badge, Button | Closed for new clients: "Not taking new clients right now", WhatsApp only |
| About and specialties | Bio, specialty chips | Badge | |
| Packages | Up to 4 cards: name, price, weeks, what's included, "Most popular" border. Choose → request | Card | No packages: section hidden, price range shown in the hero |
| Results | Before and after pairs with captions | Carousel | None: section hidden |
| Team | Photos, names, and roles | Avatar | Hidden unless the coach turns it on |
| Facts | Gym, languages, certificates, Instagram | | |
| Start with me | Drawer (phone) / Dialog (laptop): package, goal, message, contact by, then phone or email login if signed out | ResponsiveDialog, LoginForm | Sent: "Request sent. Coach Ahmed will reply soon" + Open the app. Coach viewing his own page: a preview bar with Edit page instead |
| Footer | "Made with Coachi" | Logo | |

Not available (page off, subscription ended, link not found): "This page isn't available" with a Find a coach button. Sticky Start with me bar at the bottom on phone once the hero scrolls away. Page title and share preview use the coach's name, headline, and photo.

## Super admin screens

You run the business from a laptop, but every screen still works on a phone for quick checks. Built on shadcn's Sidebar and data tables.

| Screen | What's on it | Built from | Empty and special states |
| --- | --- | --- | --- |
| Overview | 4 numbers: active coaches, total clients, workouts this week, ending in 7 days. "Ending soon" list with a WhatsApp remind button. Newest coaches | StatBlock, Card, Table | Day one: "Add your first coach" |
| Coaches | Table: name, phone, plan, clients, status chip, end date, last active. Filters by status. Row opens the coach panel | DataTable, StatusChip, Sheet (side panel) | Search finds nothing: clear filters |
| Coach panel | Details, client count, payment history, notes. Actions: Extend, Pause, Change plan, Support mode, Delete | Sheet, Tabs, DropdownMenu | Delete asks you to type the coach's name to confirm |
| Record payment | Coach, amount in EGP, method, date, receipt photo. Shows the new end date before you save | Dialog, Combobox, Select, Calendar, PhotoSlot | Saved: toast "Payment saved. Active until 14 Dec" |
| Plans | Your plans with price and features (client limit, team seats, switches). Edit features as switches and number fields | Card, Form, Switch, Input | Changing a plan with coaches on it shows how many are affected |
| Directory | Waiting for approval queue (approve or hide), featured coaches, reply rate per coach | Tabs, Card, Switch, Badge | Queue empty: "No coaches waiting" |
| Libraries | Shared exercises and foods, bilingual names, video links | DataTable, Form | Missing Arabic or English name: warning chip |
| Audit log | Every admin action and support-mode session, filter by person and date | DataTable, Calendar range | Read only |
| Settings | App name, logo, support WhatsApp, client limits per plan | Form | Unsaved changes: sticky Save bar |

**Support mode:** a red bar stays at the top of every screen: "Viewing as Coach Ahmed. Exit". Every action is logged. You can never miss that you're inside someone else's account.

## Components

Use shadcn parts as they are, styled by the tokens. Build the custom Coachi parts on top of them in `packages/ui`, with the same names later in the mobile app.

**shadcn parts we use**

Button, Card, Input, Textarea, Form, Label, Select, Combobox, Command, Checkbox, RadioGroup, Switch, Slider, ToggleGroup, Tabs, Accordion, Dialog, Drawer, Sheet, DropdownMenu, Popover, Tooltip, Avatar, Badge, Progress, Skeleton, Sonner (toasts), Calendar, Carousel, ScrollArea, Separator, Sidebar, Table, Chart, Direction.

**Custom Coachi parts**

| Part | What it does | Used on |
| --- | --- | --- |
| SetRow | One set: weight and reps with big + and - buttons (44 px), last time's numbers in muted text, a Done check that fills with the fire gradient | Workout mode |
| RestTimer | Bottom sheet with a ring countdown, +15 s and Skip, short buzz at the end on Android | Workout mode |
| WeekStrip | 7 days with done, missed, today, rest | Today, Plan |
| MacroBar | Calories, protein, carbs, fat against targets; warning color when over | Today, Meals, Nutrition builder |
| StatBlock | Big Anton number + small label, optional change ("+5 kg") | Journey, Workout done, Overview |
| StatusChip | Icon + word in success, warning, danger, info, or neutral | Clients, Coaches, Subscription |
| AdherenceBar | This week's done vs planned, as a small bar and "3 of 4" | Clients list |
| GoalBar | Start, now, and target weight on one fire gradient bar | Journey |
| MilestoneTimeline | Gradient dots for reached, outline dots for next, each with a date | Journey |
| ThenNowSlider | Day 1 photo and latest photo with a drag handle between them | Journey, Progress tab |
| PBBadge | Fire gradient trophy icon with the lift and new weight | Workout done, Journey |
| ShareCard | Makes a 1080 x 1350 image of a milestone with the coach's logo, ready for Instagram and WhatsApp | Workout done, Journey |
| CoachCard | Photo, name, specialties, city, online or in person, price range | Find a coach, Public profile preview |
| ExerciseRow | Exercise with sets, reps, rest, target, note; drag handle; superset group line | Workout plan builder |
| PhotoSlot | Tap to take or pick a photo, shows a preview, private storage | Check-in, Record payment |
| ResponsiveDialog | Dialog on laptop, Drawer (bottom sheet) on phone, same content | Everywhere a form pops up |
| EmptyState | Lucide icon, one line, one action button | Every list |
| OfflineBanner | "You're offline. Your sets are saved on this phone and will sync." | Client app |

## Patterns

The same behavior everywhere, so users learn it once.

| Situation | What we do |
| --- | --- |
| A form or choice pops up | Bottom sheet (Drawer) on phone, Dialog on laptop, via ResponsiveDialog. Side Sheet only for super admin details |
| Page is loading | Skeletons in the shape of the real content. No full-page spinners |
| Button is working | Spinner inside the button, label stays, button can't be tapped twice |
| List is empty | EmptyState: icon, one line, one button that fixes it |
| Field is wrong | Message under the field in danger color, with an icon. Never only a red border |
| Page fails to load | Plain message of what failed + Try again button |
| Offline | OfflineBanner on top. Sets, meal ticks, and water save on the phone and sync later |
| Saving in builders | Autosave. A small "Saving" then "Saved" next to the title. No Save button |
| Small actions (tick a meal, mark a set) | Update the screen right away, save in the background, roll back with a toast if it fails |
| Delete or archive | Do it, then show a toast with Undo for 6 seconds. Confirm first only when it can't be undone |
| Toasts | Sonner, bottom on phone (above the tab bar), bottom corner on laptop. Short: what happened + Undo when it fits |
| Numbers | Tabular numbers in tables, logs, and timers, so digits line up |
| Dates | Relative when close ("Today", "Yesterday", "In 3 days"), full date when far, always in the user's language |

**Motion**

- Only where it shows what changed: a set check filling, the rest timer ring, a sheet sliding up.
- One celebration moment: a short burst on a new personal best or milestone. Once, never on every set.
- Respect "reduce motion" in phone settings: no burst, no slides, just fades.
- Buzz on Android when a set is done and when rest ends (iPhone web apps can't vibrate).

**Accessibility**

- Tap targets at least 44 x 44 px. Main buttons 48 px tall.
- Visible focus ring on everything you can tab to.
- Icon-only buttons get a label for screen readers ("Add set").
- The rest timer announces the last 3 seconds and "Rest done" to screen readers.
- Color is never the only signal: status always has an icon and a word.

## Arabic and RTL rules

Arabic is not a translation layer. Every screen is designed and tested in Arabic as well as English before it ships.

**Direction**

- `<html lang="ar" dir="rtl">` comes from the language in the URL (next-intl), and shadcn's `DirectionProvider` reads it.
- Only logical classes: `ms`, `me`, `ps`, `pe`, `start`, `end`, `text-start`. The shadcn `--rtl` setup does this for its own parts; do the same in custom parts. A lint rule can block `ml-`, `mr-`, `left-`, `right-`.
- The side menu, sheets, and swipe directions flip with the language.

**What flips and what doesn't**

| Flips in Arabic | Never flips |
| --- | --- |
| Back, next, and chevron arrows (`rtl:rotate-180`) | The logo and the arm mark |
| Layout order: menus, rows, card content | Numbers, weights, reps, phone numbers |
| Progress bars fill from the right | Play and pause icons, checkmarks |
| Swipe to go back | Chart time axis (time still runs left to right) |
| Drawer and Sheet sides | Video and photo content |

**Text**

- Arabic fonts: Badeen Display for H1 and display, Cairo for everything else. Never letter spacing on Arabic.
- Line height 1.7 to 1.8 for Arabic body text.
- Western digits (1, 2, 3) in both languages.
- Names and mixed text go inside `<bdi>`, so an English name in an Arabic sentence doesn't break the order.
- Phone numbers, emails, and number fields get `dir="ltr"` even on Arabic screens.
- Dates and times through `Intl` with the user's language.
- Arabic text is often a bit longer or shorter than English: never set fixed widths on buttons or tabs.

**Testing**

- Every screen gets an Arabic screenshot check before release.
- Test with real Arabic content (real exercise names, real coach bios), not placeholder text.

## Phone-perfect PWA checklist

The month-one web app should feel like an app, not a website. Tick these before launch.

**Install and icons**

- [ ] Web app manifest: name Coachi, `display: standalone`, `theme_color` and `background_color` #040814, start page per role
- [ ] Icons 192 and 512 from the mark files, plus a full-bleed "maskable" version (no rounded corners, arm inside the middle 80%) so Android can shape it
- [ ] iPhone home screen icon: a 180 px **PNG** (`apple-touch-icon`). iPhone does not use SVG for this
- [ ] Service worker with Serwist (`@serwist/next`): app shell offline, an offline page, fresh data from the network first
- [ ] "Add to home screen" guide for iPhone users (Share, then Add to Home Screen), shown once after the first workout

**Screen fit**

- [ ] `viewport-fit=cover` and safe-area padding (`env(safe-area-inset-*)`) for the notch and home bar, mostly on the tab bar and workout mode
- [ ] Use `100dvh`, not `100vh`, so the browser bar doesn't cut screens
- [ ] `theme-color` meta for dark and light, so the status bar matches the app
- [ ] Inputs at 16 px or bigger so iPhone doesn't zoom in
- [ ] Number fields use `inputmode="decimal"` for weight and `inputmode="numeric"` for reps
- [ ] No pull-to-refresh or bounce where it breaks things (`overscroll-behavior: none` in workout mode)
- [ ] Screen stays on during a workout (Wake Lock API) where the phone supports it

**Speed**

- [ ] Today and Workout mode load in under 1 second on a mid-range Android on 4G
- [ ] Images through `next/image`, progress photos resized on upload
- [ ] Fonts with `next/font`, Arabic and Latin subsets only

**Alerts**

- [ ] Web push works on Android. On iPhone it only works after the app is added to the home screen (iOS 16.4 and up), so ask for alerts after install, never on first visit

**Testing**

- [ ] Every screen, every week, on a real iPhone (Safari) and a cheap Android (Chrome), in Arabic and English, dark and light

## Mobile app later

In month two the client screens move to Expo. The plan: same screens, same names, same tokens, just native parts underneath.

- **UI kit:** [React Native Reusables](https://github.com/mrzachnugent/react-native-reusables), which is shadcn for React Native, styled with NativeWind. Same part names as the web app.
- **Tokens:** the `packages/tokens` file feeds both Tailwind (web) and NativeWind (mobile), so colors and sizes match exactly.
- **Custom parts:** SetRow, RestTimer, WeekStrip, and the rest get a native version with the same name and props. Build the web versions with simple props now, so they port easily.
- **What gets better on mobile:** real vibration on iPhone too, lock-screen rest timer, reliable push alerts, smoother offline sync (PowerSync).
- **Arabic gotcha:** React Native needs an app restart to switch between right-to-left and left-to-right. Show "Coachi will restart to switch language" before it happens.
- **Order:** client app first (that's who uses it at the gym). The coach and super admin screens stay on the web.
