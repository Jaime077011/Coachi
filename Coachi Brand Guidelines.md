# Coachi Brand Guidelines

Oct 13, 2026 · @Jamal

One system for the whole app and site: dark navy, warm cream, and a fire red that shows energy and progress. Arabic and English are equal, and every rule here works in both light and dark mode.

## Logo

The logo is the name plus the tagline. The arm mark lives on its own, inside its rounded tile, for icons and small spaces. Never put the arm next to the name.

&#91;image: Coachi logos and marks\]

| Use | File | Size |
| --- | --- | --- |
| Website header, dark | coachi-logo-en-for-dark-bg-web.svg | 240 px wide |
| Website header, light | coachi-logo-en-for-light-bg-web.svg | 240 px wide |
| App header, emails, small screens | coachi-logo-en-...-mobile.svg | 160 px wide |
| Arabic pages | coachi-logo-ar-...-web / -mobile.svg | 200 / 140 px wide |
| App store, splash screen | coachi-mark-dark-512-app.svg | 512 px |
| Home screen install (PWA) | coachi-mark-dark-192-pwa.svg | 192 px |
| Browser tab | coachi-mark-dark-32-favicon.svg | 32 px |
| Social posts, stickers, merch | Any mark tile (dark, red, cream) | Any |

**Rules**

- **Which color:** "for-dark-bg" files go on Ink, Navy, or photos with a dark overlay. "for-light-bg" files go on Cream or White.
- **Minimum size:** logo 120 px wide (below this the tagline can't be read; use the mark). Mark 24 px.
- **Clear space:** keep empty space around the logo at least the height of the tagline x 2 on every side.
- **Language:** Arabic pages use the Arabic logo, English pages use the English one. Never stack both.
- **Default mark:** dark tile. Use the red tile when it sits on a dark or busy background, and the cream tile on white.

**Don't**

- Stretch, rotate, outline, or add shadows to the logo
- Change the tagline color or font
- Put the logo on red or on the fire gradient
- Recolor the arm or remove its tile
- Use the arm without credit: "Arm icon from game-icons.net, CC BY 3.0" on the About page and store listing

## Colors

Dark mode is the default and the hero look. Ink and Cream carry most screens, and red is the one loud color: for the main action and for wins. Every text pair below passes WCAG AA (4.5:1 or more).

&#91;image: Coachi color palette, light and dark\]

**Brand palette**

| Name | Hex | Role |
| --- | --- | --- |
| Ink | #040814 | Dark background, text on light |
| Navy | #121C30 | Dark cards and panels |
| Cream | #F4EFE6 | Light background, text on dark |
| White | #FDFDFD | Light cards |
| Fire Red | #F2412E | The brand red, middle of the gradient |
| Ember | #FF5A3A | Red for text and buttons on dark |
| Deep Red | #C8141E | Red for text and buttons on light |
| Fire gradient | #FF7A45 > #F2412E > #C8141E (top to bottom) | Mark, progress, streaks, badges |

**UI tokens**

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| bg | #F4EFE6 | #040814 | Page background |
| surface | #FDFDFD | #121C30 | Cards, sheets, nav bar |
| surface-2 | #EAE3D6 | #1B2740 | Inputs, hover, chips, table stripes |
| border | #DDD4C4 | #26324D | Lines, dividers, input borders |
| text | #040814 | #F4EFE6 | Headlines, body |
| text-2 | #4A5468 | #A9B1C2 | Descriptions, labels |
| text-muted | #646C7E | #7C869B | Hints, timestamps (14 px and up) |
| text-disabled | #9AA1AE | #4A5468 | Disabled only |
| primary | #C8141E | #FF5A3A | Main buttons, links, active tab |
| on-primary | #FDFDFD | #040814 | Text and icons on primary |
| primary-hover | #A8101A | #FF7A45 | Hover and pressed |
| focus-ring | #C8141E | #FF7A45 | 2 px ring, 2 px offset |
| success | #15803D | #2BC48A | Done, personal best, on plan |
| warning | #B45309 | #FDB022 | Needs attention, plan ending |
| danger | #A3124F | #FF7AA2 | Errors, missed, expired |
| info | #1D5FD1 | #5EA8FF | Tips, neutral notices |

**Rules**

- **One red action per screen.** Primary red is for the main button only. Other buttons are secondary or ghost.
- **Danger is rose, not brand red,** so an error never looks like a normal button. Always show it with an icon and words, never color alone.
- **Fire gradient never sits behind text.** Use it for the mark, progress bars, streak flames, badges, and the journey milestones.
- **Status colors on light mode:** use them for text on White cards. On Cream, use them for icons and text 18 px and up.
- **Charts:** series 1 Fire Red, series 2 Info blue, series 3 Success green, series 4 Warning amber, then text-2 grey. Lines also differ by dash or marker, not color only.

## Typography

Four fonts, two per language: a loud display font for big moments and a clean UI font for everything else. All four are free on Google Fonts.

| Role | English | Arabic | Use for |
| --- | --- | --- | --- |
| Display | Anton 400, UPPERCASE | Badeen Display 400 | Logo, page heroes, H1, big stats |
| UI and body | Archivo 400, 500, 600, 700 | Cairo 400, 600, 700 | H2 and down, body, buttons, forms, tagline |

**English scale** (size in px, mobile / desktop)

| Style | Font | Size | Line height | Letter spacing |
| --- | --- | --- | --- | --- |
| Display | Anton, uppercase | 40 / 64 | 1.05 | 0.01em |
| H1 | Anton, uppercase | 32 / 44 | 1.1 | 0.01em |
| H2 | Archivo 700 | 24 / 30 | 1.25 | 0 |
| H3 | Archivo 700 | 20 / 22 | 1.3 | 0 |
| H4 | Archivo 600 | 17 / 18 | 1.35 | 0 |
| Body L | Archivo 400 | 17 / 18 | 1.55 | 0 |
| Body | Archivo 400 | 15 / 16 | 1.55 | 0 |
| Body S | Archivo 400 | 13 / 14 | 1.5 | 0 |
| Caption | Archivo 500 | 12 / 12 | 1.4 | 0.01em |
| Label | Archivo 700, uppercase | 11 / 12 | 1.3 | 0.12em |
| Button | Archivo 600 | 15 / 16 | 1 | 0.01em |
| Stat number | Anton | 36 / 48 | 1 | 0 |

**Arabic scale** (size in px, mobile / desktop)

| Style | Font | Size | Line height |
| --- | --- | --- | --- |
| Display | Badeen Display | 44 / 68 | 1.3 |
| H1 | Badeen Display | 34 / 48 | 1.35 |
| H2 | Cairo 700 | 24 / 30 | 1.5 |
| H3 | Cairo 700 | 20 / 22 | 1.5 |
| H4 | Cairo 600 | 17 / 18 | 1.55 |
| Body L | Cairo 400 | 17 / 18 | 1.8 |
| Body | Cairo 400 | 15 / 16 | 1.8 |
| Body S | Cairo 400 | 13 / 14 | 1.7 |
| Caption | Cairo 600 | 12 / 12 | 1.6 |
| Label | Cairo 700 | 12 / 12 | 1.5 |
| Button | Cairo 700 | 15 / 16 | 1.2 |
| Stat number | Anton | 36 / 48 | 1 |

**Rules**

- **Anton is uppercase only** and never under 24 px. Below that, use Archivo 700.
- **Badeen Display never under 28 px.** Below that, use Cairo 700.
- **No letter spacing on Arabic,** ever. It breaks the joined letters.
- **Arabic needs more line height** than English (1.7 to 1.8 for body), because of dots and tails.
- **Numbers:** use Western digits (1, 2, 3) in both languages for weights, reps, and dates. Turn on tabular numbers in tables and logs so columns line up.
- **Text colors:** headlines use text, body uses text or text-2, hints use text-muted. Red text only for links and the tagline.
- **Mixed text:** when English words appear in Arabic (like "PB" or a brand name), keep them in Cairo; don't switch to Archivo mid-sentence.

## Layout

Everything sits on a 4 px grid. Phone first: design the 390 px screen, then let it grow.

**Spacing**

| Token | px | Use |
| --- | --- | --- |
| space-1 | 4 | Icon to label |
| space-2 | 8 | Inside chips, tight lists |
| space-3 | 12 | Between related fields |
| space-4 | 16 | Card padding on phone, page side margin on phone |
| space-5 | 24 | Card padding on desktop, between cards |
| space-6 | 32 | Between sections on phone |
| space-7 | 48 | Between sections on desktop |
| space-8 | 64 | Hero spacing |

**Corners**

| Token | px | Use |
| --- | --- | --- |
| radius-sm | 8 | Inputs, small chips |
| radius-md | 12 | Buttons |
| radius-lg | 16 | Cards |
| radius-xl | 24 | Sheets, modals, big hero cards |
| radius-full | 999 | Pills, avatars, progress bars |
| Mark tile | 22.7% of size | App icon tile (68 on a 300 tile) |

**Shadows**

- Light mode: one soft shadow for cards, `0 1px 2px rgba(4,8,20,.06), 0 6px 16px rgba(4,8,20,.06)`. Stronger only for menus and modals.
- Dark mode: no shadows. Show depth with surface steps (bg > surface > surface-2) and a 1 px border.

**Breakpoints**

| Name | Width | Layout |
| --- | --- | --- |
| Phone | under 768 px | 1 column, bottom tab bar, 16 px side margin |
| Tablet | 768 to 1023 px | 2 columns for cards, bottom tab bar |
| Desktop | 1024 px and up | Side menu, content max 1200 px, 24 px gutters |

**Touch and icons**

- Tap targets at least 44 x 44 px; main buttons 48 px tall on phone.
- Icons: [Lucide](https://lucide.dev), outline style, 1.75 px stroke, 20 px in UI and 24 px in the tab bar. Same color as the text next to them.
- RTL: in Arabic, mirror the whole layout and any arrow icons (back, next). Don't mirror the logo, the arm mark, numbers, or charts' time axis direction.

## Components

The same parts on every screen, built only from the tokens above.

**Buttons** (radius-md, Button text style)

| Type | Fill | Text | Border | When |
| --- | --- | --- | --- | --- |
| Primary | primary | on-primary | none | The one main action (Start workout, Save plan) |
| Secondary | surface-2 | text | border | Other actions |
| Ghost | none | text | none | Low actions (Cancel, Skip) |
| Danger | none | danger | danger | Delete, end subscription; always confirm first |
| Disabled | surface-2 | text-disabled | none | Can't be used yet |

Heights: 48 px phone, 40 px compact desktop, 56 px for big CTAs. Icon + text gap 8 px. Full width on phone forms.

**Inputs**

- 48 px tall, radius-sm, fill surface-2, 1 px border, label above in Label or Caption style.
- Focus: 2 px focus-ring. Error: danger border, icon, and message under the field.
- Number inputs for weight and reps get big + and - buttons (44 px) on both sides.

**Cards**

- surface fill, radius-lg, padding 16 px phone / 24 px desktop, light shadow (light mode) or 1 px border (dark mode).
- Card title H4, meta text in Caption text-2.

**Status chips** (radius-full, Caption 600, icon + word)

| Status | Color | Example |
| --- | --- | --- |
| Done | success | Workout done, on plan |
| Needs attention | warning | 2 workouts missed, plan ends in 5 days |
| Missed / expired | danger | Missed today, subscription expired |
| Info | info | New plan from coach |
| Neutral | text-2 on surface-2 | Rest day, draft |

Chip fill = the status color at 12% opacity, text and icon = the full status color.

**Progress and wins**

- Progress bars and goal bars: 8 px tall, radius-full, track surface-2, fill fire gradient.
- Streaks, personal bests, and milestones: a fire gradient icon (flame, trophy, arm) with the stat next to it in Anton, in text color. No text on the gradient.
- Journey milestones timeline: gradient dot for reached, border-only dot for next.

**Navigation**

- Phone: bottom tab bar, surface fill, 64 px tall, active tab in primary with its label, others text-muted.
- Desktop: left side menu (right in Arabic), active item with surface-2 fill and a 3 px primary bar on the inner edge.

**Charts**

- Gridlines in border, axis labels in Caption text-muted, values in tabular numbers.
- Main line in Fire Red, 2 px. Personal bests marked with a gradient dot.

## Voice

Coachi sounds like a good coach: short, warm, and pushing you forward. Never shouting, never guilt.

| Do | Don't |
| --- | --- |
| Short words, short sentences | Long, formal text |
| Talk to one person: "you" / "إنت" | "Users", "the client" |
| Celebrate wins with a number: "+5 kg on bench" | Empty hype: "AMAZING!!!" |
| Missed days: calm and forward: "Back at it tomorrow" | Blame: "You failed your plan" |

**Arabic:** friendly, simple Egyptian Arabic for the UI, like the examples below. Keep all UI text in translation files, so a Gulf version in simple Modern Standard Arabic is just a new file later. Coaches write to clients in their own dialect.

**Examples**

| Moment | English | Arabic |
| --- | --- | --- |
| Main button | Start workout | ابدأ التمرين |
| Done | Workout done. Nice work | خلصت التمرين. شغل حلو |
| New PB | New best: 60 kg | رقم جديد: 60 كجم |
| Missed day | Missed today. Back at it tomorrow | فاتك تمرين النهارده. نكمل بكرة |
| Empty list | No clients yet. Add your first one | لسه مفيش عملاء. ضيف أول عميل |

## Code

Copy these into the app so code and design use the same names. Dark is the default; light mode switches with `data-theme="light"` on `<html>`, and Arabic with `lang="ar" dir="rtl"`.

**Tokens (globals.css)**

```css
:root {
  /* dark (default) */
  --bg: #040814; --surface: #121C30; --surface-2: #1B2740; --border: #26324D;
  --text: #F4EFE6; --text-2: #A9B1C2; --text-muted: #7C869B; --text-disabled: #4A5468;
  --primary: #FF5A3A; --on-primary: #040814; --primary-hover: #FF7A45; --focus-ring: #FF7A45;
  --success: #2BC48A; --warning: #FDB022; --danger: #FF7AA2; --info: #5EA8FF;
  --fire: linear-gradient(180deg, #FF7A45 0%, #F2412E 45%, #C8141E 100%);
  --shadow-card: none;

  --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px; --radius-xl: 24px; --radius-full: 999px;
  --font-display: var(--font-anton); --font-ui: var(--font-archivo);
}
[data-theme="light"] {
  --bg: #F4EFE6; --surface: #FDFDFD; --surface-2: #EAE3D6; --border: #DDD4C4;
  --text: #040814; --text-2: #4A5468; --text-muted: #646C7E; --text-disabled: #9AA1AE;
  --primary: #C8141E; --on-primary: #FDFDFD; --primary-hover: #A8101A; --focus-ring: #C8141E;
  --success: #15803D; --warning: #B45309; --danger: #A3124F; --info: #1D5FD1;
  --shadow-card: 0 1px 2px rgba(4,8,20,.06), 0 6px 16px rgba(4,8,20,.06);
}
:lang(ar) {
  --font-display: var(--font-badeen); --font-ui: var(--font-cairo);
  letter-spacing: 0 !important;
}
body { background: var(--bg); color: var(--text); font-family: var(--font-ui); }
```

**Fonts (app/fonts.ts, Next.js)**

```ts
import { Anton, Archivo, Cairo, Badeen_Display } from "next/font/google";

export const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });
export const archivo = Archivo({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-archivo" });
export const cairo = Cairo({ weight: ["400", "600", "700"], subsets: ["arabic", "latin"], variable: "--font-cairo" });
export const badeen = Badeen_Display({ weight: "400", subsets: ["arabic"], variable: "--font-badeen" });
```

Add all four `.variable` class names to `<html>`. If `Badeen_Display` isn't in your Next.js version's font list yet, load it with a Google Fonts `<link>` instead.

**Tailwind v4 (@theme)**

```css
@theme inline {
  --color-bg: var(--bg); --color-surface: var(--surface); --color-surface-2: var(--surface-2);
  --color-border: var(--border); --color-text: var(--text); --color-text-2: var(--text-2);
  --color-muted: var(--text-muted); --color-primary: var(--primary); --color-on-primary: var(--on-primary);
  --color-success: var(--success); --color-warning: var(--warning); --color-danger: var(--danger); --color-info: var(--info);
  --font-display: var(--font-display); --font-ui: var(--font-ui);
}
```

Then use classes like `bg-surface text-text-2 rounded-[var(--radius-lg)]`. Use logical classes (`ms-4`, `pe-2`, `text-start`) instead of left/right, so Arabic flips on its own.
