# Vantage OS

My own phone operating system interface for my spare iPhone SE. Vantage OS is the
phone member of the Vantage family (Vantage is also my AI assistant), so the two
should feel like they belong together.

## What this is

- A full-screen web app (PWA) that acts as the ENTIRE interface of the phone.
- Device: iPhone SE (2nd gen), A13 chip, iOS 16.3, Safari / WKWebView.
- Plan:
  1. Phase 1 (now): run as a PWA added to the home screen, deployed on Vercel.
  2. Phase 2 (later): the phone gets jailbroken (Dopamine) and a SpringBoard tweak
     loads this web app as the real home screen. The tweak will expose a native
     bridge (see "Native bridge" below). Keep the code ready for that.
- The user should never feel like they are in a website. No browser UI, no
  scrolling page, no text selection, no zoom.

## Tech stack

- Vite + React + TypeScript
- Plain CSS with CSS variables for theming (CSS Modules per component are fine).
  No heavy UI libraries.
- Animations: CSS transitions/transforms first. Framer Motion only if really needed.
- Storage: localStorage for small settings, IndexedDB for notes and app data.
- PWA: vite-plugin-pwa with a service worker so everything works offline.
- Weather data: Open-Meteo API (free, no key). Default location: Zurich.
- Deployment: Vercel, auto-deploys when I push to GitHub.

## Screen and device rules

- Design for 375 x 667 points (iPhone SE). Test in Chrome DevTools "iPhone SE".
- Full-screen standalone PWA: manifest `display: standalone`,
  `apple-mobile-web-app-capable`, black-translucent status bar.
- Respect safe areas with `env(safe-area-inset-*)`.
- Disable: page scrolling, overscroll bounce, pinch zoom, double-tap zoom,
  text selection, long-press callouts, tap highlight.
- Only scroll inside specific containers (notes, long settings lists) when needed.
- Touch targets at least 44 x 44 points.
- Performance matters (A13 chip): animate only `transform` and `opacity`,
  avoid large `backdrop-filter` blurs, avoid re-rendering the whole app on
  every clock tick. Target a smooth 60 fps.

## Design language

Clean, minimal, confident. Inspired by Nothing OS, but ORIGINAL: never copy
Nothing's logos, fonts, glyphs or exact layouts.

- Base colors: deep blue-black `#06090D`, surfaces `#0E141A` and `#151C23`,
  white `#FFFFFF`, muted text `#8A939C`, hairlines `rgba(255,255,255,0.12)`.
- Accent: mint-to-teal, matching the Vantage assistant.
  - Accent solid: `#2DD4BF`
  - Accent gradient: `linear-gradient(135deg, #6EE7B7, #14B8A6)`
  - Use the accent sparingly: one highlight per screen, active toggles, the logo.
- Fonts (Google Fonts, self-hosted so they work offline):
  - Display (clock, big numbers): **Doto** (dot-matrix style)
  - Editorial titles (rare): **Instrument Serif**
  - Body / UI text: **Inter**
- Shapes: large rounded widgets (radius 24-28px), round toggles, generous spacing.
- Text: as little as possible. Short labels, lots of empty space.
- Motion: fast and snappy, 150-250ms, ease-out. Gestures follow the finger
  and snap when released. Nothing should ever feel laggy.
- Sound: very subtle UI sounds (unlock, open app, toggle), with a setting to
  turn them off. A web app can't detect silent mode, so keep them quiet.
- Logo: a single bold "V" drawn in dots, in the accent color.

## Visual references (folder `inspiration/`)

Look at the images in `inspiration/` before designing any screen. What they
share, and what Vantage OS should feel like:

- **Deep and dark, one glowing accent.** Near-black with a hint of blue
  (background `#06090D`, surfaces `#0E141A` / `#151C23`) instead of flat grey.
  The mint-teal accent glows softly, like light, not like paint.
- **Big expressive numbers.** The clock, temperature, timers and battery are
  hero elements: huge dot-matrix numbers (Doto). In some places numbers can
  run vertically, rotated 90deg (see 01), e.g. the timer in the Clock app.
- **Thin lines and rings.** 1px hairlines, thin circular rings and dials
  (see 04). Quick settings brightness/volume are circular dials you rotate
  with your finger, not plain sliders. Battery is a ring.
- **Mixed widget shapes (see 02, 03).** Circles and rounded squares of
  different sizes on one grid. One widget per page may be filled with the
  accent (like Nothing's red circle); everything else stays monochrome.
- **Line-art and dot illustrations inside widgets (see 02, 06).** Weather
  details drawn as simple wireframe shapes and dot grids instead of emoji or
  colorful icons.
- **Editorial moments.** Occasional big serif words for titles and empty
  states (font: **Instrument Serif**, see 01), with small uppercase
  letter-spaced labels. Use rarely, so it feels special.
- **Soft glass, used sparingly (see 05, 06).** A few frosted cards for
  overlays like search and quick settings. Keep blur small: the A13 must
  stay at 60 fps.
- **A living lock screen (see 07).** An animated wallpaper that reacts to
  the unlock swipe, e.g. orbiting dots or particles that spread apart as you
  swipe up, with subtle parallax. Pause all animation when the screen is not
  visible to save battery.
- **Light mode exists too (see 03, 05):** soft off-white `#EDEEF0`, same
  layout, black text, same accent.

## Design system (follow EXACTLY, the goal is a flawless, premium UI)

Perfection comes from consistency. Never invent a size, color, radius or
timing: use these tokens (put them in `src/theme/tokens.css` / `tokens.ts`).
The colors below are only the DEFAULT theme ("Midnight"). Every color,
font, radius and effect must come from the theme engine (see
"Customization"), so the user can change all of it.

### Grid (375 x 667)
- Screen margin 16px. Gap 12px. 4 columns.
  Cell = (375 - 2*16 - 3*12) / 4 = 76.75px. Every widget and icon snaps to
  this grid: 1x1, 2x1, 2x2, 4x1, 4x2. Nothing sits off-grid.
- Top: 20px status bar + 12px. Bottom: dock 76.75px high, 16px from the
  bottom edge; page dots 8px above the dock in their own 16px row.
- Rows on a home page are computed from the space between the top and
  the page dots. A page may NEVER overflow. Max 7 items per page.
- Spacing scale: 4, 8, 12, 16, 24, 32. No other values.

### Hierarchy
- Every page has ONE hero (e.g. the clock). Everything else is quieter.
- Max ONE accent-colored element per page.
- Empty space is intentional. Fewer, better items beat a full page.

### Surfaces and depth
- Widget surface: `linear-gradient(180deg, #121920 0%, #0D1218 100%)`
- Border: 1px `rgba(255,255,255,0.06)`
- Top highlight: `inset 0 1px 0 rgba(255,255,255,0.05)`
- Radii: square widgets 28px, pills 999px, circles 50%. Nothing else.
- Accent glow (only on the accent element):
  `0 0 24px rgba(45,212,191,0.35)`
- Optional very subtle noise texture on the background (2-3% opacity).

### Typography scale
- Inter: 11 (labels, uppercase, +0.12em letter-spacing), 13, 15, 17, 22.
- Doto dot numbers: 28, 40, 64, 96. All dot numbers share one style.
- Instrument Serif: 34 for page titles only.
- Text colors: primary `#FFFFFF`, secondary `#8A939C`, tertiary `#4F5862`.
- Use tabular numbers so digits never jump when they change.

### Icons
- ONE icon set only (Phosphor "Light" or custom SVG), 24px, 1.5px stroke,
  round caps and joins, white. Optically centered in their circle.
- Icon circles are exactly one grid cell.

### Motion (this is what makes it feel premium)
- Use `motion` (Framer Motion) springs + `@use-gesture/react`. No linear or
  plain CSS-ease animations for anything you can touch.
- Springs: UI default `stiffness 400, damping 34`; app open/close
  `stiffness 260, damping 28`; sheets `stiffness 300, damping 30`.
- Gestures follow the finger 1:1. On release, use the swipe VELOCITY to
  decide where to go (a quick flick works even if the distance is short).
- Rubber-band at edges (resistance factor 0.55).
- Every animation is interruptible: grabbing something mid-animation
  catches it smoothly, no jumps.
- Press state on everything tappable: scale 0.96 on press, spring back.
- App open: the app grows out of the exact icon position; closing shrinks
  it back into the icon.
- Numbers that change (clock, battery) animate dot by dot, not jump.
- Performance: animate only transform and opacity, use motion values
  instead of React state during gestures, `will-change` only while
  animating. Must hold 60 fps on the iPhone SE (A13).

### Quality check (do this after EVERY UI change)
1. Take a screenshot with Playwright at 375x667 (set it up once).
2. Look at the screenshot yourself and check: on-grid? equal gaps? one hero?
   one accent? nothing overlapping or clipped? text readable? same dot style?
3. Fix what fails, screenshot again, and only then tell me it's done.

## Customization (as much as possible, like the best flagship phones)

Vantage OS is NOT "a black UI". Black is only the default theme. Build a
theme engine early, because everything depends on it.

- **Theme presets** the user can pick and edit:
  Midnight (current dark), Ocean (deep teal gradient), Aurora (dark with
  soft colored glows), Paper (light, off-white), Mono (pure black/white),
  Sunset (warm). Users can save their own presets.
- **Wallpapers:** solid, gradient, live (orbit, particles, waves, aurora),
  or the user's own photo. Option to blur/dim the wallpaper on the home screen.
- **Colors from the wallpaper** (like Material You): extract a palette from
  the wallpaper and generate accent + surface colors automatically.
- **Accent color picker** with any color, plus suggested ones.
- **Light / dark / automatic** (by time or sunset in Zurich).
- **Widget style:** solid, glass (frosted), outline-only, or tinted.
  Corner roundness slider. Widget opacity slider.
- **Icons:** shape (circle, squircle, square), style (outline, filled,
  tinted by accent), size, labels on/off.
- **Fonts:** choose clock font (dot-matrix, serif, bold sans, thin) and UI font.
- **Lock screen editor:** clock style, color, size and position, date
  style, lock screen widgets, live wallpaper choice.
- **Home grid:** 4x5 or 5x6 density, dock on/off, page dots on/off.
- **Motion:** animation speed, reduce motion, page transition style.
- **Sounds:** UI sound packs and volume.
- **Accessibility:** text size, bold text, high contrast.
- Save all of it locally, with export/import of the whole setup as a file.

The theme engine sets CSS variables on the root element; components only
ever read variables. Switching theme animates smoothly (crossfade, 300ms).

## Structure of the OS

Core screens (the "shell"):
- Boot animation: dotted "V" logo + "VANTAGE OS", about 2 seconds.
- Lock screen: big Doto clock, date, battery, swipe up to unlock.
- Home screen (Nothing-inspired, original): a 4-column grid where widgets and
  app icons live together. Widgets in 1x1, 2x1 and 2x2 sizes, shaped as circles
  and rounded squares (big dot-matrix clock, weather, battery ring, date).
  App icons are monochrome white glyphs on dark circles, no labels.
  Several pages swiped left/right with dot indicators. Long-press to enter
  edit mode and drag/resize items; the layout is saved on the device.
- NO app list and NO app drawer. Apps live on the home screen pages.
- Search: swipe down in the middle of the home screen for a minimal search
  that shows matching apps and actions as big glyph tiles.
- Quick settings: swipe down from the very top edge. A frosted glass panel with
  large round toggles and a circular brightness dial you turn with a finger.
- App view: apps open full-screen with a zoom animation that grows out of
  their icon; swipe up from the bottom edge to shrink back into the icon.

Modes (each mode = a theme + a list of allowed apps):
- **Clean** (default): the main Vantage OS look.
- **Focus**: grayscale, only essential apps (Phone, Messages, Music, Notes,
  Clock), big clock, no widgets, optional focus timer that locks the mode.
- **Retro**: old-Nokia style, pixel font, green-tinted monochrome, 3x3 icon
  grid menus, beeps, includes a Snake game.

Mini-apps live inside the OS and use the design system:
Clock (timer, stopwatch, world clock), Weather, Notes, Calculator, Settings,
Phone (keypad + favorites via `tel:`), Messages (via `sms:`), and later an
Assistant app that connects to Vantage.

### Built so far (update this list when something is added)

- Shell: boot animation, lock screen (wallpaper: orbit / dots / plain), home
  grid with pages and edit mode, fixed dock (4 apps from `DOCK_APP_IDS`) with
  page dots above it, app view with zoom, search, quick settings, UI sounds,
  light mode, accent colors.
- Real apps: Clock (timer, stopwatch, world clock; timers keep running in a
  store), Weather (live Open-Meteo data, shared with the widget), Notes
  (IndexedDB, text or checklist), Settings (wallpaper, accent, light mode,
  sounds, mode switcher).
- Widgets: clock, weather, battery ring, date, Ask Vantage bar (opens search),
  now playing, voice note, flashlight, calendar, notes preview.
- Still fake: now playing tracks, the calendar event, the notification count,
  the quick settings controls and flashlight (look only), the voice note button.
  The mode switcher is saved but Focus and Retro change nothing yet.
- Placeholders: Phone, Messages, Calculator, Music and Maps show "coming soon".
- Not built yet: modes (Focus, Retro), adding/removing widgets in edit mode,
  the Assistant, the native bridge beyond `getBattery`.
- Known iOS limits: the battery level is unavailable in Safari (shows "--"),
  timers can't chime while the phone is asleep, and swipes from the very
  top/bottom edge of the screen belong to iOS, so our edge zones are
  deliberately generous (top 56px, bottom 40px).

## Code organization

```
src/
  shell/        lock screen, home, search, quick settings, boot, gestures
  apps/         one folder per mini-app (apps/clock, apps/weather, ...)
  modes/        mode definitions (clean, focus, retro)
  theme/        CSS variables, fonts, shared styles
  system/       app registry, settings store, storage, sounds, native bridge
  components/   shared UI pieces (Widget, Toggle, IconButton, ...)
```

- Apps are registered in one place (`system/appRegistry.ts`) with id, name,
  icon, component, and which modes allow them. Adding an app should only mean
  creating its folder and adding one registry entry.
- Widgets are registered in `shell/widgets/widgetRegistry.ts` (id, component,
  allowed sizes) and placed in `shell/home/defaultLayout.ts`. The grid rules
  live in `shell/home/layout.ts`; the saved layout is in localStorage.
- Small saved settings go through `system/settingsStore.ts` (`useSetting`).
- The design system lives in `theme/tokens.css` (CSS variables) and
  `theme/tokens.ts` (the same numbers plus springs, for JavaScript). Keep the
  two in sync. `theme/theme.css` only holds the light mode and accent colour
  overrides (`data-theme` / `data-accent` on `<html>`) and older variable names
  that point at the tokens.
- Dot numbers: always `components/DotNumber` (sizes 28 / 40 / 64 / 96), never
  the Doto font. Temperatures: `components/Temperature`.
- Labels: the global class `label` (11px, uppercase, letter-spaced).
- Buttons: `components/Pressable` instead of `<button>` (spring press state).
- Motion: springs from `SPRING` in `tokens.ts` with `motion`; drags with
  `@use-gesture/react` (lock screen, app view, quick settings). The home
  grid's long-press and item dragging use our own pointer code in
  `shell/home/useHomeGestures.ts`, driven by motion values and springs.
- Keep files small and focused. One component per file.
- Use TypeScript types for everything shared (apps, modes, settings).
- All colors, fonts, radii and timings come from theme CSS variables, never
  hard-coded in components, so modes can restyle everything.

## Connecting to the real phone

Phase 1 (PWA) uses links that open real iOS apps:
- Calls `tel:`, messages `sms:`, maps `maps://?q=`, Spotify `spotify:`
- Quick settings toggles run iOS Shortcuts:
  `shortcuts://run-shortcut?name=<ShortcutName>`
  (my shortcuts: Flashlight, LowPower, DND)

### Native bridge (Phase 2, after jailbreak)

The jailbreak tweak will inject `window.vantageNative`. Always write code like:
"use the bridge if it exists, otherwise fall back to the Phase 1 links".
Put all of this in `system/nativeBridge.ts` so the rest of the app never
checks for the bridge directly.

Planned bridge functions (all return Promises):
- `openApp(bundleId: string)` - launch a real iOS app
- `listApps()` - installed apps with name, bundleId and icon (base64)
- `setFlashlight(on: boolean)`
- `getBattery()` - level 0-1 and charging state
- `setBrightness(level: number)`

## How to work with me

- I'm a beginner. After every change, explain in simple words what you did,
  which files you changed, and how I can test it.
- Build ONE feature at a time. Don't change unrelated things.
- If my request is unclear, ask me one short question before building.
- If something needs a command (installing a package etc.), tell me what it does.
- Commit for me when a feature works and tell me in one line what was saved.
  Local commits only: ask before pushing to GitHub.
- Never delete my files or reset git history without asking first.

## Commands

- `npm install` - install dependencies
- `npm run dev` - start the dev server (preview in Chrome, iPhone SE mode)
- `npm run dev -- --host` - dev server reachable from the iPhone on the same Wi-Fi
- `npm run build` - production build (Vercel runs this automatically)
- `npm run screenshots` - the quality check: with `npm run dev` running, saves
  every screen at 375x667 into `screenshots/` (Playwright). Then
  `node scripts/contact-sheet.mjs` puts them side by side on three sheets.
