You are building Vantage OS, my custom phone OS for my iPhone SE (2nd gen,
iOS 16.3). Before writing any code, read these files completely:
CLAUDE.md (rules, design system, customization), SPECS.md (every feature,
exact colors, app specs), FEATURES.md (roadmap), and look at every image
in inspiration/.

How to work:
- Work through the phases below IN ORDER. Inside a phase, build one
  feature at a time.
- After every feature: run the quality check from CLAUDE.md (Playwright
  screenshots at 375x667, check grid, hierarchy, accent, overlap,
  readability, performance), fix what fails, then commit with a clear
  message.
- At the END of each phase: stop, show me screenshots, list what you
  built and anything you couldn't do, and wait for me to say "continue"
  before starting the next phase.
- Never use placeholder text in finished screens. Never fake data that
  needs the jailbreak; show "Available after unlock" instead.
- Every color, font, radius and timing comes from the theme engine.
- Every user-facing action goes through src/system/actions.ts (see
  SPECS.md section 6) so the Vantage AI can use it later.
- Explain things simply, I'm a beginner.

PHASE 0 - Prepare
1. Update FEATURES.md so the roadmap matches SPECS.md exactly (phases
   below), keeping [PWA] / [BRIDGE] labels.
2. Fix existing layout problems: home pages must never overflow, page
   dots in their own row above the dock, consistent dot-matrix numbers.

PHASE 1 - Foundation
1. tokens.css / tokens.ts from CLAUDE.md, Playwright screenshot setup,
   motion + @use-gesture/react.
2. Theme engine with ALL 21 presets from SPECS.md section 1 (every token),
   status colors, mode colors (Focus, Retro, Wind Down), colors from
   wallpaper, light/dark/automatic, 300 ms crossfade on switch.
3. Retro design language as a real separate rendering mode (square
   pixels with ghost pixels, Press Start 2P + VT323, no rounded corners,
   stepped animation, old-phone layout).
4. Wallpaper system with the live wallpapers from SPECS.md section 5.
5. src/system/actions.ts and src/system/nativeBridge.ts (bridge with
   fallbacks, as described in CLAUDE.md).

PHASE 2 - Component kit
Build every kit component from SPECS.md section 2 plus DotNumber and
PixelNumber. Make a "Kit" test page that shows every component in every
state, in Midnight, Paper and Nokia LCD. Get it perfect before going on.

PHASE 3 - System shell
Lock screen (living orbit wallpaper, dot clock with blinking colon,
status bar), Nothing-style home screen (no app list), search, control
center with circular dials, notification center, live pill, app switcher,
apps zooming out of their icons, edge-swipe gestures, boot animation,
passcode screen. Spring physics everywhere, 60 fps on the SE.

PHASE 4 - Customise app and widgets
Build the Customise app from SPECS.md section 5 with the live preview and
every section. Theme gallery cards look like small phones with a dot
clock, accent circle and "Ask anything" pill. Then the widget system
(sizes, styles, stacks, gallery) and widgets in this order: time, space
and beauty, music (Spotify Web API, MusicKit JS), retro games, productivity,
info, fun, devices (unlock state), then Widget Lab.

PHASE 5 - Vantage apps
Following SPECS.md sections 2 and 3: Clock first (full spec, including
alarm sounds and the CreateAlarm Shortcut), then Calculator, Notes,
Weather, Calendar, Reminders, Music, Voice Recorder, Compass, Files,
Maps, Camera, Photos, Phone, Messages, Contacts, Mail, Browser, Settings.
Add the App styles setting (Vantage or Original per app).

PHASE 6 - Lock In
Following SPECS.md section 4, in four rounds: (1) app shell, setup and
Focus tab; (2) grades with all grading systems, custom system,
calculator, compensation rules, and unit tests; (3) timetable, homework,
exams with study plans, Work mode; (4) app blocking, Wind Down, Stats.

PHASE 7 - Modes and final polish
Focus mode, Retro mode (full old-phone experience with Snake), Wind
Down mode, custom modes. Then go through every screen in every theme,
fix anything that isn't perfect, check offline mode and performance on
the real phone (npm run dev -- --host), and deploy to Vercel.

Do NOT build the Vantage AI yet (SPECS.md section 6), only keep the
actions system ready for it.

Start with Phase 0 now.
