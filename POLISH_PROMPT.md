Polish round for Vantage OS. Read CLAUDE.md, SPECS.md and this whole file
first. I tested the live site (vantageui.vercel.app) at 375x667 like a phone.
It already looks great (dot clock, orbit lock screen, retro Nokia mode,
brightness dial, Customise app). Now make it feel like a finished flagship
phone: fix every problem below, add the new features, and animate everything.

Work in the order of the parts below. One item at a time, quality check +
commit after each. Stop after each PART, show screenshots, wait for "continue".

=====================================================================
PART 1 - Fix what I found
=====================================================================

1. Clock timer default: HORIZONTAL numbers, not vertical. Change the default
   to horizontal and migrate saved data once (vantage.clock.v1 has
   "vertical": true; set it to false a single time, then respect the user's
   choice). Keep the vertical option as a setting.
2. Widgets do nothing when tapped. Every widget must open its app with the
   app growing out of the widget's exact shape. Long-press a widget: a
   context menu (Edit, Resize, Style, Remove, Edit home screen).
3. Home page 1 shows the date twice (date circle + calendar widget). Replace
   the date circle with the Lock In focus ring.
4. "Now playing: System music, Available after unlock" is a dead widget.
   Show a "Connect Spotify" state with a button (Spotify Web API login), or
   the last played track, with an animated dot visualizer.
5. Pages 2 to 5 are mostly empty, and icon-only pages are confusing (I can't
   tell what the sliders, target and gamepad icons are). Reduce to 3 balanced
   pages, each with widgets AND icons. Show small labels under icons by
   default (setting to turn off). Replace "CHOOSE A PHOTO" with a real
   default photo widget (a built-in wallpaper image) and a subtle edit hint.
6. Swiping up from the bottom inside an app opens the app switcher instead
   of going home. Quick swipe up = home. Swipe up and pause = app switcher.
   Tapping empty space in the switcher = home.
7. Every app has an empty strip at the top and no status bar. Show the status
   bar everywhere (time, battery), and give every app the same header.
8. Customise: big empty space above the title. Theme cards are too small:
   the dot clock is unreadable and the "Ask anything" pill has no text.
   Use 2 cards per row, bigger, like real mini phones.
9. Retro mode isn't fully retro yet: menu icons are modern line icons (make
   pixel icons), the timer ring uses smooth circles/round dots (make it a
   stepped square-pixel ring), the app switcher shows modern rounded cards
   (make it a retro list), and a running timer doesn't show on the retro
   home screen (show it in the status line).
10. Control center only has 4 toggles + brightness. See Part 3.
11. Lock screen has no widgets, notifications, music or shortcuts. See Part 3.
12. Search: add suggestions before typing (recent apps, actions), results for
    settings, actions ("start 25 min focus"), math ("12*7"), unit conversion,
    and fuzzy matching. Animate results in.
13. Lock In setup: add step dots, a small animated illustration per step, and
    slide transitions between steps.

=====================================================================
PART 2 - Animate EVERYTHING (springs from CLAUDE.md, 60 fps on the SE)
=====================================================================

- Boot: dotted V logo assembles dot by dot, then dissolves into the lock screen.
- Unlock: orbit rings expand outward and fade while the clock lifts away;
  home widgets enter with a short staggered scale+fade (30 ms apart).
- Dot numbers: when a digit changes, dots morph individually (old dots fade
  out, new ones pop in with a tiny stagger). Colon blinks softly.
- Page swipes: follow the finger, rubber-band at the ends, slight parallax
  between wallpaper and widgets, page dots stretch while moving.
- Apps open from their icon/widget and close back into it, with the home
  screen scaling down slightly behind.
- Every press: scale 0.96 + subtle highlight. Toggles: spring thumb, color
  fills from the thumb. Sliders and dials: tick sound every step.
- Sheets and control center: drag-following, velocity-based snap, backdrop
  fade, content staggers in.
- Lists: items stagger in; swipe actions reveal with resistance; delete
  collapses smoothly.
- Theme change: new theme spreads in a circle from where you tapped.
- Loading: dot-matrix shimmer skeletons, never spinners.
- Success: small dot "burst" or checkmark draw-on.
- Charging: dots fill the battery ring with a wave when you plug in.
- Empty states: gentle looping micro-animation (floating dots).
- Live pill: morphs width/height between states, expands on long press.
- Respect "Reduce motion": replace movement with fades.

=====================================================================
PART 3 - New features (all [PWA] unless marked)
=====================================================================

System
- First-boot setup like a new phone: welcome animation, your name, pick a
  theme (live preview), wallpaper, clock style, Lock In basics, done screen.
  Can be replayed from Customise > Setups.
- Today view: swipe right from home page 1. Greeting with your name,
  weather, next lessons/events, homework due, Lock In ring, quote, and
  a "plan my day" card.
- Lock screen: row of up to 4 lock widgets, now playing card, notification
  stack (swipe to clear), live timer/focus, flashlight and camera shortcuts
  at the bottom (long press to use), charging animation, tap clock to cycle
  clock styles.
- Control center: music card with controls, volume dial, brightness dial,
  Wi-Fi/Bluetooth/flashlight/DND, mode switcher (Clean, Focus, Retro, Wind
  Down), quick timer (1/5/10/25 min), Lock In start, calculator, voice note,
  theme toggle (dark/light), screen-on keep-awake. Edit mode to rearrange.
- Live pill: timer, stopwatch, focus session, recording, music; tap opens
  the app, long press expands with controls.
- App quick actions on long press (Clock: 5-min timer; Notes: new note;
  Lock In: start 25 min; Weather: tomorrow; Calculator: copy last result).
- Smart stacks that rotate by time of day (morning: weather + first lesson;
  afternoon: homework + focus; evening: Wind Down + tomorrow's alarm).
- Gestures: double-tap empty home to lock, pinch home to edit layout,
  long-press wallpaper to change it, two-finger swipe down for search.
- Weather-reactive wallpaper option: subtle rain dots when raining, stars at
  night, warmer at sunset.
- Notification center with Vantage app notifications, grouping and actions.

Apps
- Clock: bedtime-friendly alarm list, world clock with day/night globe,
  stopwatch laps chart.
- Weather: hourly dot graph, 10-day bars, rain-chance dots, sunrise/sunset
  arc, feels-like, wind compass, animated condition illustrations.
- Calculator: history tape, unit and currency converter, scientific mode in
  landscape-style sheet.
- Notes: checklists, pin, search, folders, markdown, swipe to delete with undo.
- Arcade app: Snake, Pong, Blocks, Breakout, 2048, Minesweeper with high
  scores and the retro look; playable as widgets too.
- Voice Recorder: live dot waveform, trim, rename.
- Music: local files player with ring progress and visualizer; Spotify
  connect.
- Lock In: everything from SPECS.md section 4 that isn't built yet.
- Customise: every section from SPECS.md section 5 fully working, plus
  "Surprise me" that animates through random setups like a slot machine.
- Easter egg: type the Konami code (or tap the lock clock 7 times) to switch
  to Game Boy retro mode with a pixel animation.

=====================================================================
PART 4 - Perfection loop
=====================================================================

Repeat this loop at least 3 times, and keep going until a full pass finds
nothing:
1. Write a Playwright script that acts like a phone user at 375x667: boot,
   unlock, swipe every page, open every widget and app, use every tab,
   open control center, search, notification center, app switcher, go home.
2. Screenshot every screen in Midnight, Paper and Nokia LCD.
3. Look at every screenshot and list problems: misalignment, off-grid items,
   overflow, clipped text, empty or dead areas, unclear icons, inconsistent
   dot styles, anything not animated, anything that feels unfinished.
4. Fix everything on the list, then start the next pass.
At the end, show me the final screenshots and the list of everything you
fixed in each pass, then deploy to Vercel.
