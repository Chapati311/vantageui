# Vantage OS feature roadmap

Work top to bottom, one phase at a time (see PROMPT.md). Tick items off as
they are finished. Details for every item are in SPECS.md.
[PWA] = possible now as a web app. [BRIDGE] = needs the jailbreak tweak.

## Phase 0: Prepare
- [x] Roadmap matches SPECS.md [PWA]
- [x] Home pages never overflow; page dots in their own row above the dock [PWA]
- [x] One dot-matrix number style everywhere (ghost dots, clock colors) [PWA]

## Phase 1: Foundation
- [x] Design tokens (tokens.css / tokens.ts) from CLAUDE.md [PWA]
- [x] Playwright screenshot quality check at 375x667 [PWA]
- [x] motion + @use-gesture/react installed and used for springs [PWA]
- [x] Theme engine with all 21 presets (10 dark, 5 light, 6 retro), every token [PWA]
- [x] Status colors (good / warning / bad, dark and light) [PWA]
- [x] Mode colors: Focus (grayscale), Retro, Wind Down (warm layer, dimming) [PWA]
- [x] Colors from wallpaper (vivid color becomes the accent, surfaces tinted 4%) [PWA]
- [x] Light / dark / automatic (schedule or sunset in Zurich), 300 ms crossfade [PWA]
- [x] Retro design language: square pixels with ghost pixels, Press Start 2P +
      VT323, no rounded corners, stepped animation, old-phone layout [PWA]
- [x] Wallpaper system: live (Orbit, Starfield, Aurora, Waves, Sundown, Pixel LCD),
      gradient, solid, photo; pause when not visible [PWA]
- [x] src/system/actions.ts: every user-facing action as a typed, named action [PWA]
- [x] src/system/nativeBridge.ts with fallbacks for every bridge function [PWA]

## Phase 2: Component kit
- [x] Kit in src/components/kit: AppShell, LargeTitle (shrinks on scroll),
      TabBar (floating pill), Section, Row, Toggle, Dial, Slider,
      SegmentedControl, Sheet (spring, drag to dismiss), SearchField,
      EmptyState, ContextMenu (long press), ScrollWheel [PWA]
- [x] DotNumber and PixelNumber [PWA]
- [x] "Kit" test page: every component in every state, in Midnight, Paper and Nokia LCD [PWA]

## Phase 3: System shell
- [x] Lock screen: living orbit wallpaper, dot clock with blinking colon, status bar [PWA]
- [x] Home screen: Nothing-style grid, no app list [PWA]
- [x] Search [PWA]
- [x] Control center with circular dials [PWA]
- [x] Notification center [PWA]
- [x] Live pill (timers, music, recording, Lock In) [PWA]
- [x] App switcher [PWA]
- [x] Apps zoom out of their icons [PWA]
- [x] Edge-swipe gestures [PWA]
- [x] Boot animation [PWA]
- [x] Passcode screen [PWA]
- [ ] Spring physics everywhere, 60 fps on the SE [PWA] (springs done; 60 fps
      still to be checked on the real phone)

## Phase 4: Customise app and widgets
- [x] Customise app: serif title, live mini phone preview, "Surprise me",
      LOOK and SYSTEM section grid [PWA]
- [x] Customise sections so far: Themes, Colors, Light and dark, Wallpapers,
      Lock screen (8 clock styles, size, position), Status bar (4 battery
      styles), Widgets, Modes, Motion and text, Sounds, Setups (save, switch,
      export/import file) [PWA]
- [x] Sections: Themes (gallery of all 21 as mini phones, edit any color,
      own themes, schedule), Widgets, Wallpapers (blur/dim/parallax, separate
      home and lock, daily shuffle, by time of day or weather), Home screen,
      Lock screen (8 clock styles), Icons, Fonts, Colors, Status bar, Control
      center, Notifications, Live pill, Motion and feel, Sounds, Boot and
      unlock, Modes, App styles, Accessibility, Setups (export/import, QR) [PWA]
- [x] Widget system: sizes 1x1, 2x1, 2x2, 4x2; styles solid, glass, outline,
      tinted; smart stacks; widget gallery [PWA]
- [x] Time widgets: dot clock, vertical clock, thin analog, flip, binary, word
      clock, world clocks, sunrise/sunset arc, moon phase [PWA]
- [x] Space and beauty widgets: live solar system, orbit, starfield, aurora
      drift, lava lamp, rain on glass, ocean wave line, breathing circle,
      Lock In plant [PWA]
- [x] Music widgets: Spotify now playing (Web API), Apple Music (MusicKit JS),
      dot-matrix visualizer, spinning vinyl [PWA]
- [ ] System now playing for any app [BRIDGE]
- [x] Retro game widgets (playable): Snake, Pong, Blocks, Breakout,
      Flappy-style, 2048, Minesweeper, Vanta Pet [PWA]
- [x] Productivity widgets: Lock In ring + streak, next lesson, homework due,
      grade average, dot calendar, reminders, notes, countdown [PWA]
- [x] Info and tools widgets: line-art weather, rain chance dots, UV and air
      quality, compass, quote of the day, photo frame, favorite contacts,
      flashlight, voice note, Ask Vantage bar [PWA]
- [x] Fun widgets: dice, coin flip, tally counter [PWA]
- [x] Device widgets: AirPods, exact battery, connected devices, storage
      ("Available after unlock" until then) [BRIDGE]
- [x] Widget Lab: build widgets from blocks bound to data, save, export/import [PWA]

## Phase 5: Vantage apps
All built only from the component kit, each with one signature detail and
real empty, loading and error states. App styles setting: Vantage or
Original per app.
- [x] Clock: Alarm (cards, scroll wheel, ringing screen, snooze), alarm
      sounds (packs, custom file, gentle wake), World (day/night arc, dot
      globe), Stopwatch (ring with sweeping dot), Timer (ring dial, vertical
      dot numbers) [PWA]
- [x] Clock: alarms also created with the "CreateAlarm" iOS Shortcut [PWA]
- [ ] Clock: native alarms that ring when closed [BRIDGE]
- [x] Calculator (dot-matrix display) [PWA]
- [x] Notes (editorial serif writing) [PWA]
- [x] Weather (line-art and dot visuals) [PWA]
- [x] Calendar (month view made of dots) [PWA]
- [x] Reminders [PWA]
- [x] Music (circular progress ring) for your own files [PWA]
- [x] Voice Recorder [PWA]
- [x] Compass (thin dial rings) [PWA]
- [x] Files [PWA]
- [x] Maps (MapLibre + OpenStreetMap) [PWA]
- [x] Camera (minimal ring shutter) and Photos [PWA, limited]
- [x] Phone, Messages, Contacts, Mail: front-ends that hand off to the real apps [PWA]
- [ ] Phone, Messages, Contacts, photo library with real data [BRIDGE]
- [x] Browser [PWA]
- [x] Settings [PWA]
- [x] App styles setting: Vantage or Original per app and for all apps [PWA]

## Phase 6: Lock In
- [x] Round 1: app shell, first-launch setup (student / working, country,
      school type, distraction apps), Focus tab (ring, session types, tags,
      goals, ambient sounds, break screen, strict session, streaks, widget,
      live pill) [PWA]
- [x] Round 2: grades with all 11 grading systems + custom system, weighted
      averages, "What do I need?" calculator, compensation rules, trends,
      unit tests [PWA]
- [x] Round 3: timetable, homework, exams with study plans, Work mode [PWA]
- [x] Round 4: app blocking (lists, lock modes, daily limits, locked icons,
      emergency unlock, FocusOn/FocusOff Shortcuts), Wind Down (schedule,
      routine, morning summary), Stats [PWA]
- [ ] System-wide app blocking [BRIDGE]

## Phase 7: Modes and final polish
- [x] Focus mode [PWA]
- [x] Retro mode: full old-phone experience with Snake [PWA]
- [x] Wind Down mode [PWA]
- [x] Custom modes (own theme, wallpaper, layout; schedule or manual) [PWA]
- [x] Every screen checked in every theme [PWA] (all apps in Midnight, Paper,
      Nokia LCD; home and Clock in all 21)
- [ ] Offline mode and performance checked on the real phone [PWA] (offline
      checked in a browser: works; the real phone is for you to test)
- [ ] Deployed to Vercel [PWA] (needs a push to GitHub: waiting for your OK)

## Later: after the jailbreak
- [ ] Vantage OS replaces the iOS home screen [BRIDGE]
- [ ] Real installed apps shown and launched from the home screen [BRIDGE]
- [ ] Real notifications from all apps in the notification center [BRIDGE]
- [ ] Real Wi-Fi, Bluetooth, airplane mode, brightness, volume controls [BRIDGE]
- [ ] Real battery, storage and network info [BRIDGE]
- [ ] Own incoming call screen [BRIDGE, hard]

## Later: Vantage AI (do not build yet, SPECS.md section 6)
- [ ] Vantage app as the phone-wide assistant using the user's own API key,
      controlling the phone through src/system/actions.ts [PWA]
