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
- [ ] Customise app: serif title, live mini phone preview, "Surprise me",
      LOOK and SYSTEM section grid [PWA]
- [ ] Sections: Themes (gallery of all 21 as mini phones, edit any color,
      own themes, schedule), Widgets, Wallpapers (blur/dim/parallax, separate
      home and lock, daily shuffle, by time of day or weather), Home screen,
      Lock screen (8 clock styles), Icons, Fonts, Colors, Status bar, Control
      center, Notifications, Live pill, Motion and feel, Sounds, Boot and
      unlock, Modes, App styles, Accessibility, Setups (export/import, QR) [PWA]
- [ ] Widget system: sizes 1x1, 2x1, 2x2, 4x2; styles solid, glass, outline,
      tinted; smart stacks; widget gallery [PWA]
- [ ] Time widgets: dot clock, vertical clock, thin analog, flip, binary, word
      clock, world clocks, sunrise/sunset arc, moon phase [PWA]
- [ ] Space and beauty widgets: live solar system, orbit, starfield, aurora
      drift, lava lamp, rain on glass, ocean wave line, breathing circle,
      Lock In plant [PWA]
- [ ] Music widgets: Spotify now playing (Web API), Apple Music (MusicKit JS),
      dot-matrix visualizer, spinning vinyl [PWA]
- [ ] System now playing for any app [BRIDGE]
- [ ] Retro game widgets (playable): Snake, Pong, Blocks, Breakout,
      Flappy-style, 2048, Minesweeper, Vanta Pet [PWA]
- [ ] Productivity widgets: Lock In ring + streak, next lesson, homework due,
      grade average, dot calendar, reminders, notes, countdown [PWA]
- [ ] Info and tools widgets: line-art weather, rain chance dots, UV and air
      quality, compass, quote of the day, photo frame, favorite contacts,
      flashlight, voice note, Ask Vantage bar [PWA]
- [ ] Fun widgets: dice, coin flip, tally counter [PWA]
- [ ] Device widgets: AirPods, exact battery, connected devices, storage
      ("Available after unlock" until then) [BRIDGE]
- [ ] Widget Lab: build widgets from blocks bound to data, save, export/import [PWA]

## Phase 5: Vantage apps
All built only from the component kit, each with one signature detail and
real empty, loading and error states. App styles setting: Vantage or
Original per app.
- [ ] Clock: Alarm (cards, scroll wheel, ringing screen, snooze), alarm
      sounds (packs, custom file, gentle wake), World (day/night arc, dot
      globe), Stopwatch (ring with sweeping dot), Timer (ring dial, vertical
      dot numbers) [PWA]
- [ ] Clock: alarms also created with the "CreateAlarm" iOS Shortcut [PWA]
- [ ] Clock: native alarms that ring when closed [BRIDGE]
- [ ] Calculator (dot-matrix display) [PWA]
- [ ] Notes (editorial serif writing) [PWA]
- [ ] Weather (line-art and dot visuals) [PWA]
- [ ] Calendar (month view made of dots) [PWA]
- [ ] Reminders [PWA]
- [ ] Music (circular progress ring) for your own files [PWA]
- [ ] Voice Recorder [PWA]
- [ ] Compass (thin dial rings) [PWA]
- [ ] Files [PWA]
- [ ] Maps (MapLibre + OpenStreetMap) [PWA]
- [ ] Camera (minimal ring shutter) and Photos [PWA, limited]
- [ ] Phone, Messages, Contacts, Mail: front-ends that hand off to the real apps [PWA]
- [ ] Phone, Messages, Contacts, photo library with real data [BRIDGE]
- [ ] Browser [PWA]
- [ ] Settings [PWA]
- [ ] App styles setting: Vantage or Original per app and for all apps [PWA]

## Phase 6: Lock In
- [ ] Round 1: app shell, first-launch setup (student / working, country,
      school type, distraction apps), Focus tab (ring, session types, tags,
      goals, ambient sounds, break screen, strict session, streaks, widget,
      live pill) [PWA]
- [ ] Round 2: grades with all 11 grading systems + custom system, weighted
      averages, "What do I need?" calculator, compensation rules, trends,
      unit tests [PWA]
- [ ] Round 3: timetable, homework, exams with study plans, Work mode [PWA]
- [ ] Round 4: app blocking (lists, lock modes, daily limits, locked icons,
      emergency unlock, FocusOn/FocusOff Shortcuts), Wind Down (schedule,
      routine, morning summary), Stats [PWA]
- [ ] System-wide app blocking [BRIDGE]

## Phase 7: Modes and final polish
- [ ] Focus mode [PWA]
- [ ] Retro mode: full old-phone experience with Snake [PWA]
- [ ] Wind Down mode [PWA]
- [ ] Custom modes (own theme, wallpaper, layout; schedule or manual) [PWA]
- [ ] Every screen checked in every theme [PWA]
- [ ] Offline mode and performance checked on the real phone [PWA]
- [ ] Deployed to Vercel [PWA]

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
