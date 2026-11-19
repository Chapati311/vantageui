# Vantage OS feature roadmap

Work top to bottom (see FINAL_PROMPT.md, which replaces PROMPT.md). Tick items off as
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
      home and lock, daily shuffle), Home screen, Lock screen (8 clock
      styles), Icons (shape, style, labels), Fonts, Colors, Status bar,
      Control center, Notifications, Live pill, Motion and feel, Sounds, Boot
      and unlock, Modes, App styles, Accessibility, Setups (export/import,
      replay first-boot setup) [PWA]
- [x] Customise extras from SPECS 5: wallpaper that reacts to the weather,
      control center tile order, UI sound packs, lock widgets and bottom
      shortcuts [PWA]
- [ ] Icon packs (FINAL_PROMPT Part 2) [PWA]
- [ ] Setup as a QR code [PWA] (needs a QR library; installing it was not
      allowed in this session)
- [x] Widget system: sizes 1x1, 2x1, 2x2, 4x2; styles solid, glass, outline,
      tinted (also per widget); widget gallery; folders [PWA]
- [x] Smart stacks that rotate by time of day [PWA]
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

## Phase 6: Lock In (moves into the Vantage app in FINAL_PROMPT Part 3)
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
- [x] Deployed to Vercel: https://vantageui.vercel.app (auto-deploys on push) [PWA]

## Polish round (POLISH_PROMPT.md)
- [x] Part 1: all 13 found problems fixed [PWA]
- [x] Part 2 motion: boot assembles and dissolves, unlock (clock lifts, home
      pops in staggered), dot-by-dot digit morphing, page parallax and
      stretching dots, apps open from icon or widget with home scaling
      behind, press highlight, toggle fill, slider and dial ticks, staggered
      sheets and lists, smooth delete, theme spreads in a circle from the tap,
      dot shimmer loading, check-mark success toast, charging wave on the
      battery widget, floating dots in empty states, live pill morph and
      long-press controls, Reduce motion [PWA]
      (iOS 16 Safari has no view transitions, so on the phone the theme
      change is a 300 ms crossfade instead of the circle)
- [x] First-boot setup, replayable from Customise > Setups [PWA]
- [x] Live pill: timer, stopwatch, focus, recording, music; long press for
      controls [PWA]
- [x] App quick actions on long press [PWA]
- [x] Gestures: double-tap empty home to lock, pinch to edit, hold the
      wallpaper to change it, two-finger swipe down for search [PWA]
- [x] Today view (swipe right from page 1) [PWA]
- [x] Lock screen: lock widgets, now playing, notification stack, flashlight
      and camera shortcuts, charging animation, tap clock to change style [PWA]
- [x] Bigger control center: music, volume dial, modes, quick timers, Lock In
      start, calculator, voice note, dark/light, keep awake, edit mode [PWA]
      (volume = Vantage's own music and sounds; keep awake needs iOS 16.4+)
- [x] Smart stacks, weather-reactive wallpaper [PWA]
- [x] Notification grouping and actions [PWA]
- [x] Apps: bedtime card and stopwatch laps chart; weather dot graph, rain
      dots, sun arc, wind compass, 10 days, animated drawings; calculator
      history tape, unit and money converter, scientific sheet; notes pin,
      folders, formatted view, undo delete; recorder live waveform, trim,
      rename; "Surprise me" slot machine [PWA]
- [x] Konami / 7-tap easter egg (Game Boy mode) [PWA]
- [ ] Part 4 perfection loop [PWA]

## Final prompt (FINAL_PROMPT.md)
- [ ] Part 2: 10 signature theme packs (SPECS 1b), generated wallpapers, new
      widget styles, icon packs and clock styles [PWA]
- [ ] Part 3: Vantage replaces Lock In (VANTAGE.md section 6) [PWA]
- [ ] Part 4: real iPhone SE pass [PWA]
- [ ] Part 5: perfection loop, 5+ passes [PWA]

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
