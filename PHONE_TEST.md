# Testing Vantage OS on the iPhone SE (with your finger)

Start the dev server so the phone can reach it (same Wi-Fi):

    npm run dev -- --host

Open the "Network" address it prints in Safari on the phone, then Share >
Add to Home Screen, and open it from the home screen (not from Safari).
Or test the deployed version: https://vantageui.vercel.app (close and reopen
it once after a deploy so the new version loads).

## What I could not check from the computer

These need the real A13 and iOS 16.3. Tick each one:

- [ ] Cold start: from tapping the icon to the lock screen in under 1.5 s
      (the boot animation itself is 2 s; turn it off in Customise > Boot to
      time the real start).
- [ ] 60 fps: swipe between home pages fast, open and close 5 apps, pull the
      control center down and up. Nothing should stutter. Note which one does.
- [ ] Theme change: Customise > Themes, tap a theme. On iOS 16 it crossfades
      (the circle from your finger needs iOS 18). It should not flash white.
- [ ] Text fields: tap the search field, a note, the calculator converter.
      Safari must NOT zoom in.
- [ ] Long press anywhere: no copy/lookup bubble, no text selection.
- [ ] Turn the phone sideways: the screen stays upright.
- [ ] Sound: the first tap after opening wakes the sounds; then unlock and
      toggles click quietly. Switch the sound pack in Customise > Sounds.
- [ ] Safe areas: nothing hides under the top edge or the bottom corners.
- [ ] Offline: open every app once, then turn on airplane mode, close the app
      fully and open it again. Everything except weather/maps/money rates
      should work (those show their saved data).
- [ ] Battery: leave it on the home screen for 10 minutes with a live
      wallpaper, then check Settings > Battery. It should be modest.
- [ ] Low Power Mode: a web app can't detect it on iOS 16. If animations
      feel heavy in Low Power Mode, turn on Customise > Motion > Reduce motion.

## New gestures to try

- Swipe right on home page 1: the Today view. Tap "Plan my day".
- Double-tap an empty spot on the home screen: it locks.
- Pinch two fingers together on the home screen: edit mode.
- Hold an empty spot on the home screen: wallpaper picker.
- Swipe down with two fingers: search.
- Lock screen: tap the clock to change its style; hold the flashlight or
  camera button for half a second; tap the clock 7 times quickly (secret).
- Hold the live pill (while a timer runs): pause / cancel buttons.
- Vantage: tap the "Ask anything" bar, double-tap the very top of the
  screen, hold the little bar at the bottom of any app, or hold "Swipe up
  to unlock" on the lock screen.
