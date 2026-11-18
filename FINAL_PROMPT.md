FINAL PROMPT for Vantage OS. This replaces PROMPT.md and continues
POLISH_PROMPT.md. Read EVERYTHING first: CLAUDE.md, SPECS.md (note the new
section 1b and the changes in sections 3 and 4), FEATURES.md,
POLISH_PROMPT.md, VANTAGE.md, and every image in inspiration/ (01-14).

Facts to know before starting:
- The live site (vantageui.vercel.app) is OLDER than this repo: it still
  shows "CHOOSE A PHOTO", 5 pages and no icon labels. Deploy at the start
  and after every part, and always check the deployed version too.
- Lock In is being replaced by the Vantage app (see SPECS.md section 4 and
  VANTAGE.md). Keep the Lock In app working until Part 3 is done.
- Timer default is horizontal (done in 09e65cf); SPECS now matches.

Rules for the whole job:
- One item at a time. After each: quality check (CLAUDE.md), commit.
- Stop after each PART with screenshots and a list of what changed, wait
  for "continue".
- If something can't be done, say so, don't fake it.

=====================================================================
PART 0 - Audit
=====================================================================
Compare the repo with POLISH_PROMPT.md, SPECS.md and FEATURES.md and give
me a checklist: done / partly done / missing. Fix FEATURES.md so it is true.
Deploy.

=====================================================================
PART 1 - Finish the polish round
=====================================================================
Finish every unchecked item of POLISH_PROMPT.md parts 2 and 3, especially:
lock screen widgets + now playing + notifications + flashlight/camera
shortcuts + charging animation; the bigger control center (music, volume
dial, modes, quick timers, edit mode); first-boot setup; Today view;
app quick actions; smart stacks by time of day; weather-reactive
wallpaper; theme change spreading from the tap point; dot-by-dot digit
morphing; skeleton shimmer instead of spinners; the Konami easter egg.

=====================================================================
PART 2 - Signature theme packs (SPECS.md section 1b)
=====================================================================
1. Extend the theme engine from "colors" to "theme packs" (tokens +
   wallpaper + widgetStyle + iconPack + fontSet + clock style + accent rule
   + sound pack + home layout preset + legibility scrim).
2. Write scripts/gen-wallpapers to render the procedural wallpapers
   (reeded glass, glossy red folds, leaf veins, paper grain, flower-like
   macro) as WebP at 750x1334, under 250 KB, deterministic. If a photo
   looks clearly better, use a CC0/Unsplash-licensed one and credit it.
3. Build all 10 packs (5 dark, 5 light) so every screen looks designed for
   them: lock screen, home, control center, notification center, search,
   Customise, every Vantage app, the Vantage overlay, the boot animation.
   Match the inspiration images: Signal = 08, Porcelain = 09, Lacquer = 10,
   Obsidian Leaf = 11, Reed Glass and Night Reed = 13, Pop Ink and
   Notebook = 14, Frost = 09 (middle notification card).
4. New widget styles: glossy circle, black pill, color block, paper card,
   line-art data (dot grids, wireframe cylinder/cone/arcs like 08), big
   serif numeral date, 60-tick dial clock and timer like 09.
5. New icon packs: glyph-in-circle, pixel (like the music note in 11),
   color block. New clock styles: segmented mono ("00 02 57"), serif
   numeral, three-hand thin analog with red second dot.
6. Customise > Themes: a "Signature" section first, shown as large real
   mini phones with the actual wallpaper and widgets. Applying a pack
   animates: wallpaper crossfades, widgets morph to the new style with a
   stagger, the clock re-renders dot by dot.
7. Device page design from 12 (big product image, battery, toggles) for
   the AirPods/earbuds widget detail screen (data after the jailbreak).
Show me every pack on lock screen, home page 1 and one app.

=====================================================================
PART 3 - Vantage becomes the main app
=====================================================================
Follow VANTAGE.md section 6 (OS side). Then remove the Lock In app: move
its home spot, widgets, search results and quick actions to Vantage, keep
app blocking, Wind Down, live pill and widgets as os.* actions Vantage can
call. Migrate existing Lock In data so nothing is lost (offer to sync it
into Vantage's account on sign-in).

=====================================================================
PART 4 - Real iPhone SE pass (iOS 16.3 Safari, home screen web app)
=====================================================================
Check and fix: 60 fps on the A13 for every animation (Performance panel,
no layout thrashing, animate transform/opacity only, pause offscreen
canvases), memory with many widgets, cold start under 1.5 s (code
splitting per app, preload page 1), offline after first load, safe areas,
no 100vh bugs, inputs at 16px+ so Safari doesn't zoom, audio unlocked on
first tap, no text selection or callouts, landscape locked, battery-
friendly (stop animations when hidden, lower frame rate in Low Power).
Test with `npm run dev -- --host` on the phone and tell me exactly what
to check with my finger.

=====================================================================
PART 5 - Perfection loop (at least 5 passes, until a pass finds nothing)
=====================================================================
Each pass:
1. Playwright phone user at 375x667: boot, unlock, every home page, every
   widget tap and long press, every app and tab, control center, search,
   notifications, app switcher, Customise every section, Vantage summon.
2. Screenshots in: Midnight, Paper, Nokia LCD, Signal, Porcelain, Lacquer,
   Reed Glass, Pop Ink.
3. Review each screenshot against this checklist and write the problems:
   - grid: on the 4-column grid, equal gaps, nothing overflowing or clipped
   - hierarchy: one hero, one accent, nothing competing
   - type: consistent sizes from the scale, no orphan words, readable on
     wallpapers (scrim works), tabular numbers
   - dots: one dot style per pack, ghost dots consistent
   - icons: one pack per screen, optically centered, same stroke
   - empty states: designed, never blank or placeholder
   - motion: every change animated, interruptible, no jank
   - theme fit: looks designed for the pack, not recolored
   - copy: short, friendly, consistent capitalization
4. Fix everything, commit, deploy, next pass.
Finish with a gallery of final screenshots and the list of fixes per pass.

Start with PART 0 now.
