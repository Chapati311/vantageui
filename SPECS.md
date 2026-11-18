# Vantage OS: product specs

Read together with CLAUDE.md (rules, design system, customization) and
FEATURES.md (roadmap). If anything here conflicts with CLAUDE.md, CLAUDE.md
wins on code rules and design tokens, SPECS.md wins on features.

---

## 1. Themes and colors

21 presets in three groups. Every preset sets the same tokens, so every
screen and app works in every theme. Max one accent element per page.

### Dark themes

| Theme | Background | Surface | Surface raised | Text | Text secondary | Accent |
| --- | --- | --- | --- | --- | --- | --- |
| Midnight (default) | #06090D | #0E141A | #151C23 | #FFFFFF | #8A939C | #2DD4BF mint |
| Ocean | #041416 | #0A2226 | #0F2E33 | #E8FBF8 | #7FA7A6 | #5EEAD4 aqua |
| Aurora | #07070D | #11111A | #191926 | #F5F3FF | #9792AE | #A78BFA violet |
| Mono | #000000 | #0A0A0A | #141414 | #FFFFFF | #8C8C8C | #FFFFFF white |
| Sunset | #120A0A | #1C1111 | #261716 | #FFF4EC | #B39486 | #FB923C amber |
| Ember | #0C0807 | #17100E | #201714 | #FFF1EA | #A88D80 | #FF5A36 red-orange |
| Forest | #070C09 | #0F1A13 | #15241A | #ECF7EF | #86A08E | #4ADE80 green |
| Nebula | #0A0614 | #140D24 | #1C1333 | #F3EEFF | #A397C2 | #F472B6 pink |
| Arctic | #050A14 | #0C1626 | #122036 | #EAF4FF | #8BA3C2 | #7DD3FC ice blue |
| Volt | #05040A | #0F0D1A | #171428 | #F0F0FF | #8C88A8 | #E8FF3A neon yellow |

Dark borders: white at 6-10%.

### Light themes

| Theme | Background | Surface | Surface raised | Text | Text secondary | Accent |
| --- | --- | --- | --- | --- | --- | --- |
| Paper | #EDEEF0 | #F7F7F8 | #FFFFFF | #0B0D10 | #6B717A | #0F766E deep teal |
| Sand | #F2EDE4 | #FAF7F2 | #FFFFFF | #1E1A16 | #7A7067 | #C2410C burnt orange |
| Sky | #E9EFF6 | #F6F9FC | #FFFFFF | #0B1320 | #66758A | #2563EB blue |
| Blossom | #F6ECEE | #FCF6F7 | #FFFFFF | #22161A | #8A6F76 | #DB2777 pink |
| Matcha | #ECF0E6 | #F7F9F3 | #FFFFFF | #1A2014 | #6E7A63 | #4D7C0F green |

Light borders: black at 8%, plus shadow `0 1px 2px rgba(0,0,0,0.06)`.

### Retro themes (their own design language, not just old colors)

- Square pixels instead of round dots; numbers and icons on a hard pixel grid.
- No rounded corners, no blur, no gradients, no shadows.
- Pixel fonts: Press Start 2P (labels), VT323 (longer text).
- Ghost pixels: unlit pixels faintly visible (10% of ink), like a real LCD.
- Stepped animation (jumps of a few frames), never smooth springs.
- Old-phone layout: signal bars + battery bars at the top, operator name
  "VANTAGE", soft-key labels at the bottom ("Menu", "Names"), 3x3 icon-grid
  menus, bleep sounds. Snake preinstalled. Terminal themes show a prompt
  and blinking cursor. Classic Desktop uses grey 3D bevel windows, navy
  title bars and a Start bar.

| Theme | Screen | Ink | Extra |
| --- | --- | --- | --- |
| Nokia LCD | #C7F0D8 | #43523D | classic green phone screen |
| Game Boy | #9BBC0F | #0F380F | also #306230, #8BAC0F (4 shades only) |
| Amber CRT | #140C00 | #FFB000 | dim text #7A5400 |
| Green Terminal | #050A05 | #33FF66 | dim text #1A7A33 |
| Casio LCD | #B9C3A6 | #20261C | digital-watch look |
| Classic Desktop | desktop #008080 | black on #C0C0C0 windows | title bars #000080 |

### Theme notes

- Aurora: three big, very blurred glows (cyan #22D3EE, violet #A78BFA,
  green #34D399) drifting slowly. Pre-rendered blurred image, NOT live blur.
- Mono: accent element is filled white with black content.
- Paper: shadows replace borders.
- Dot-matrix clock everywhere in modern themes: lit dots, unlit dots at ~7%
  ("ghost" LED look), hours in text color, minutes in secondary, colon in accent.

### Status colors

| | Dark themes | Light themes |
| --- | --- | --- |
| Good / passing | #34D399 | #059669 |
| Close / warning | #FBBF24 | #D97706 |
| Bad / failing | #F87171 | #DC2626 |

### Mode colors

- Focus mode: current theme in grayscale, accent becomes plain white (black on light themes).
- Retro mode: switches to the chosen retro theme (Nokia LCD default) + old-phone layout.
- Wind Down: warm amber layer (#FFB36B at 12%), brightness to 80% over 10 minutes.
- Colors from wallpaper: most vivid photo color becomes the accent (adjusted
  until readable), surfaces tinted 4% toward it.

---

## 2. Vantage apps (redesigned system apps)

- Every basic app gets a Vantage version: Phone, Messages, Contacts, Camera,
  Photos, Clock, Weather, Calendar, Reminders, Notes, Calculator, Music,
  Maps (MapLibre + OpenStreetMap), Files, Voice Recorder, Compass, Mail,
  Browser, Settings.
- Setting: Customise > App styles. Per app and "all apps": Vantage or
  Original. Original opens the real iOS app (URL scheme now, bundle ID
  through the native bridge later).
- All apps are built ONLY from the shared component kit in
  `src/components/kit`: AppShell, LargeTitle (serif, shrinks on scroll),
  TabBar (floating pill), Section, Row, Toggle, Dial, Slider,
  SegmentedControl, Sheet (spring, drag to dismiss), SearchField,
  EmptyState, ContextMenu (long press), ScrollWheel, DotNumber, PixelNumber.
- Each app has ONE signature detail: Clock = vertical dot-matrix timer;
  Weather = line-art and dot visuals; Calculator = dot-matrix display;
  Calendar = month view made of dots; Notes = editorial serif writing;
  Music = circular progress ring; Compass = thin dial rings; Camera =
  minimal ring shutter.
- Every app has real empty, loading and error states. No placeholder text.
- Apps that need private iPhone data (messages, contacts, photo library)
  start as front-ends that hand off to the real apps, and connect to real
  data through the bridge after the jailbreak.

---

## 3. Clock app

Tabs (floating pill tab bar): Alarm, World, Stopwatch, Timer.

- **Timer (signature):** set by rotating a thin ring dial (dots light up,
  soft click per minute). Running: huge vertical dot-matrix numbers
  (setting: horizontal). Ring empties in the accent. Preset pills 1/3/5/10/25
  min, long-press to edit. End: accent pulse, swipe up to stop.
- **Alarm:** cards with dot-matrix time, label, 7 repeat-day dots, toggle.
  Swipe left to delete, tap to edit in a sheet with a themed scroll wheel.
  Ringing screen on the orbit wallpaper: swipe up stop, tap snooze, snooze
  length setting.
- **Alarm sounds:** per-alarm + default. Packs: Synth, Nature (rain, birds,
  waves), Retro (digital beeps), Calm (piano, chimes). Custom sound from a
  file (stored in IndexedDB). Preview, volume, gentle wake (30 s fade-in),
  vibration toggle.
- **Stopwatch:** dot-matrix time in a ring with a dot sweeping once per
  second. Laps: fastest in accent, slowest in grey.
- **World:** city cards (dot time, offset, day/night arc), slowly rotating
  dot globe.
- **Limit:** a web app on iOS 16.3 can't ring alarms when closed/locked.
  On save, also run the iOS Shortcut "CreateAlarm" with time + label so iOS
  rings it. After the jailbreak the bridge schedules alarms natively.

---

## 4. Lock In app

Preinstalled focus app for school and work. Tabs: Focus, School/Work,
Wind Down, Stats. First-launch setup: student or working, country and
school type, distraction apps. Connects to a home widget, the live pill
and system Focus mode.

### Focus
- One big ring with dot-matrix countdown and a "Lock in" button.
- Session types: Pomodoro (25/5, long break after 4), Deep work (50/10 or
  90/15), Custom (any lengths/rounds), Open (counts up).
- Tag sessions with a subject or project. Optional one-line goal before,
  "done / partly / not" check after.
- Ambient sounds: rain, cafe, library, white/brown noise, fireplace, lo-fi;
  mix two with separate volumes.
- Break screen with breathing animation and a tip.
- Strict session: can't pause/end early except emergency unlock (60 s wait).
- Streaks + daily goal ring. Home widget with one-tap start. Live pill shows
  the countdown on every screen.

### School / Work: grades
Built-in systems (all editable, plus fully custom: scale, best end, pass
mark, rounding, letter labels):

| System | Scale | Best | Pass from |
| --- | --- | --- | --- |
| Switzerland | 1-6 (half grades common) | 6 | 4 |
| Germany | 1-6 | 1 | 4 |
| Germany upper school (Oberstufe) | 0-15 points | 15 | 5 points |
| Austria | 1-5 | 1 | 4 |
| France | 0-20 | 20 | 10 |
| Netherlands | 1-10 | 10 | 5.5 |
| Italy | 1-10 | 10 | 6 |
| UK GCSE | 9-1 | 9 | 4 |
| UK A-level | A*-E | A* | E |
| USA | A-F, GPA 0-4.0 | A / 4.0 | D (varies) |
| India | percentage / CGPA 10 | 100% / 10 | varies by board |

- Subjects (color + glyph); grades with date, type (exam, quiz, oral,
  project) and weight.
- Weighted averages per subject and overall, rounded like the school rounds.
- Green/amber/red status. "What do I need?" calculator (honest when a target
  is impossible). Configurable compensation rules (e.g. Swiss promotion
  rules) showing promoted / on the edge / at risk. Grade trend per subject.
- Unit tests for every grading system and the calculator.

### School / Work: homework, exams, timetable, Work mode
- Weekly timetable grid; widget shows the next lesson.
- Homework with subject, due date, reminder; overdue turns red; swipe to complete.
- Exam countdown cards with an automatic study plan made of Focus sessions.
- Work mode: projects instead of subjects, tasks with priority and deadline,
  time tracking from tagged Focus sessions.

### App blocking
- Distraction list grouped as Social, Entertainment, Custom.
- Lock modes: during a session, on a schedule, during Wind Down, manual
  "lock for X hours". Daily limits per app.
- Locked icons turn grey with a small lock; tapping shows a calm lock screen
  (what you're locked in for, time left, back to focus).
- Strict mode, or emergency unlock (wait 60 s and type why).
- Silence notifications via iOS Shortcuts "FocusOn" / "FocusOff".
- Keep all blocking logic in one module so the bridge can later block apps
  system-wide.

### Wind Down
- Schedule + target sleep time. Theme warms and dims, home simplifies to
  clock, alarm and Lock In, distractions lock.
- Routine: set tomorrow's alarm, one-line journal, top 3 tasks for tomorrow,
  sleep sounds with fade-out timer.
- Morning: gentle wake alarm, then summary (weather, first lesson, homework due).

### Stats
Focus hours per day and subject, streaks, grade trends, weekly review.

---

## 5. Customise app

Preinstalled. Big serif title, live mini preview of the phone at the top
that updates instantly, "Surprise me" button, then a grid of sections
grouped LOOK and SYSTEM.

| Section | What you can change |
| --- | --- |
| Themes | gallery of all 21 presets as preview cards (mini dot clock, accent circle, "Ask anything" pill), edit any color, create/name your own, schedule themes |
| Widgets | gallery, per-widget style/size/data, Widget Lab |
| Wallpapers | live, gradient, solid, photo, pixel; blur/dim/parallax sliders; separate home and lock; daily shuffle; change with time of day or weather |
| Home screen | grid density, pages, dock, page transition, smart stacks, folders, hidden apps, page dots style |
| Lock screen | clock style (dot, pixel, serif, vertical, thin analog, flip, binary, word clock), size, position, color, lock widgets, notification style, two bottom shortcuts |
| Icons | packs (line, filled, dot-matrix, pixel, accent-tinted), shape, size, labels, badges, custom icon per app |
| Fonts | clock font, UI font, size, weight, letter spacing |
| Colors | accent (any), colors from wallpaper, per-mode colors |
| Status bar | items, battery style (%, ring, bar, pixel), alignment |
| Control center | tile order/size, dials or sliders, which toggles |
| Notifications | stack / list / count-only, banner style, what Lock In silences |
| Live pill | what appears (timers, music, recording, Lock In), style |
| Motion and feel | animation speed, spring bounciness, parallax, reduce motion |
| Sounds | UI sound packs (soft, glass, mechanical keys, retro bleeps, off), volume, default alarm sound |
| Boot and unlock | boot animation, unlock animation, passcode keypad style |
| Modes | Clean, Focus, Retro + custom modes with own theme/wallpaper/layout, by schedule or manual |
| App styles | Vantage or Original per app |
| Accessibility | text size, bold, high contrast, reduce transparency |
| Setups | save setups, export/import file, share as QR code, "Surprise me" |

### Live wallpapers
Orbit (default), Starfield, Aurora, Waves, Sundown, Pixel LCD, plus
gradients, solids and photos. Animations pause when not visible.

### Widget system
- Sizes 1x1, 2x1, 2x2, 4x2 on the home grid. Styles: solid, glass, outline,
  tinted. Follow the theme. Stackable (smart stacks).
- Categories:
  - Time: dot clock, vertical clock, thin analog, flip, binary, word clock,
    world clocks, sunrise/sunset arc, moon phase.
  - Space and beauty: live solar system (real planet positions, slowly
    moving), orbit, starfield, aurora drift, lava lamp, rain on glass, ocean
    wave line, breathing circle, a plant that grows with the Lock In streak.
  - Music: Spotify now playing (Spotify Web API; cover, progress, controls -
    controls need Premium), Apple Music (MusicKit JS), dot-matrix visualizer,
    spinning vinyl.
  - Devices: AirPods (L, R, case battery rings + connection), phone battery
    ring, connected devices, storage.
  - Retro games (playable): Snake, Pong, Blocks, Breakout, Flappy-style,
    2048, Minesweeper, Vanta Pet (pixel pet, happy when you focus).
  - Productivity: Lock In ring + streak, next lesson, homework due, grade
    average, dot calendar, reminders, notes, countdown.
  - Info and tools: line-art weather, rain chance dots, UV and air quality,
    compass, quote of the day, photo frame, favorite contacts, flashlight,
    voice note, Ask Vantage bar.
  - Fun: dice, coin flip, tally counter.
- Widget Lab: build widgets from blocks (text, big number, ring, bar, dot
  grid, image), bind each block to data (time, battery, weather, Lock In,
  music...), save, export/import as a file.
- Data that needs the jailbreak (AirPods, exact battery, system now playing)
  shows a clean "Available after unlock" state, never fake numbers.

---

## 6. Vantage AI

See VANTAGE.md (full spec and build prompt). Build it after POLISH_PROMPT.md is done.
