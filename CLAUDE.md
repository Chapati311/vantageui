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

- Done: boot animation, living orbit lock screen, home grid with pages and edit
  mode, app view with zoom, search, quick settings, UI sounds, light mode,
  Settings app (Sounds, Light mode).
- Placeholders only: every app except Settings shows a "coming soon" screen.
  Weather data, the notification count and the quick settings controls are fake.
- Not built yet: modes (Focus, Retro), adding/removing widgets in edit mode,
  the real mini-apps, the native bridge beyond `getBattery`.
- Known iOS limits: the battery level is unavailable in Safari (shows "--"),
  and swipes from the very top/bottom edge of the screen belong to iOS, so
  our edge zones are deliberately generous (top 56px, bottom 40px).

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
- Dark and light are the same tokens in `theme/theme.css`; light mode is
  `data-theme="light"` on `<html>`. Use `--motion-screen` and `--motion-control`
  for every transition.
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
