import {
  addLap,
  pauseTimer,
  resetStopwatch,
  resetTimer,
  setClockTab,
  setTimerDuration,
  startStopwatch,
  startTimer,
  stopStopwatch,
  type ClockTab,
} from '../apps/clock/clockStore';
import { openGame, type GameId } from '../apps/arcade/arcadeStore';
import { deleteAlarm, saveAlarm, setAlarmEnabled, snooze, stopRinging, updateAlarmSettings, type Alarm, type AlarmSettings } from '../apps/clock/alarmStore';
import { addWidget, removeHomeItem } from '../shell/home/layoutStore';
import type { WidgetSize } from '../shell/widgets/types';
import { convertNote, createNote, deleteNote, getNote, type Note } from '../apps/notes/notesStore';
import type { WallpaperConfig } from '../theme/wallpapers';
import {
  applyCustomPreset,
  applyPreset,
  deleteCustomPreset,
  getSettings,
  saveCustomPreset,
  setMode,
  updateSettings,
  type Appearance,
  type ModeId,
  type Settings,
} from './settingsStore';
import { clearNotifications, dismissNotification, pushNotification } from './notifications';
import { hasPasscode, removePasscode, setPasscode } from './passcode';
import { applySetup, deleteSetup, getSavedSetups, readSetupFile, saveSetup, surpriseMe } from './setups';
import { playSound } from './sounds';
import { refreshWeather } from './weather';
import { removeWallpaperPhoto, setWallpaperPhoto } from './wallpaperPhoto';

/**
 * EVERY USER-FACING ACTION, IN ONE PLACE.
 *
 * Buttons, gestures and widgets call `runAction('some.action', { ... })`
 * instead of changing things directly. Later the Vantage AI (SPECS.md
 * section 6) will call exactly the same actions, so anything you can do by
 * hand, the assistant can do too. Each action has a name, a description in
 * plain words (for the AI) and typed parameters.
 */

/** What the system shell (Shell.tsx) lets actions do. It registers itself at startup. */
export interface ShellControls {
  openApp: (appId: string, from?: DOMRect | null) => void;
  closeApp: () => void;
  lock: () => void;
  unlock: () => void;
  openSearch: () => void;
  openControlCenter: () => void;
  openNotifications: () => void;
  openAppSwitcher: () => void;
  closeOverlays: () => void;
}

let shell: ShellControls | null = null;

/** Called once by the shell so actions can open apps, lock the phone, ... */
export function registerShell(controls: ShellControls): () => void {
  shell = controls;
  return () => {
    if (shell === controls) shell = null;
  };
}

type Toggleable = 'wifi' | 'bluetooth' | 'flashlight' | 'doNotDisturb';

/** Settings an action may change directly with "settings.set". */
type SimpleSetting = Exclude<keyof Settings, 'customPresets' | 'windDownSince' | 'mode'>;

interface ActionDef<P> {
  description: string;
  run: (params: P) => void | Promise<void>;
}

const define = <P>(description: string, run: (params: P) => void | Promise<void>): ActionDef<P> => ({
  description,
  run,
});

const ACTIONS = {
  // ---- Shell
  'app.open': define<{ appId: string; from?: DOMRect | null }>(
    'Open an app by its id (phone, messages, notes, clock, weather, calculator, music, maps, settings).',
    ({ appId, from }) => {
      shell?.openApp(appId, from ?? null);
      playSound('openApp');
    },
  ),
  'app.close': define<Record<string, never>>('Close the open app and go back home.', () => shell?.closeApp()),
  'shell.lock': define<Record<string, never>>('Lock the phone.', () => shell?.lock()),
  'shell.unlock': define<Record<string, never>>('Unlock the phone (asks for the passcode if one is set).', () => {
    shell?.unlock();
    if (!hasPasscode()) playSound('unlock');
  }),
  'shell.openSearch': define<Record<string, never>>('Open search.', () => shell?.openSearch()),
  'shell.openControlCenter': define<Record<string, never>>('Open the control center (quick settings).', () =>
    shell?.openControlCenter(),
  ),
  'shell.openNotifications': define<Record<string, never>>('Open the notification center.', () =>
    shell?.openNotifications(),
  ),
  'shell.openAppSwitcher': define<Record<string, never>>('Show the recently used apps.', () =>
    shell?.openAppSwitcher(),
  ),
  'shell.closeOverlays': define<Record<string, never>>(
    'Close search, the control center, the notification center and the app switcher.',
    () => shell?.closeOverlays(),
  ),

  // ---- Home screen
  'home.addWidget': define<{ widgetId: string; size: WidgetSize; page?: number }>(
    'Put a widget on the home screen (first free spot, from the given page on).',
    ({ widgetId, size, page }) => void addWidget(widgetId, size, page ?? 0),
  ),
  'home.removeWidget': define<{ itemId: string }>('Take a widget off the home screen.', ({ itemId }) =>
    removeHomeItem(itemId),
  ),

  // ---- Arcade
  'arcade.open': define<{ game?: GameId }>('Open the Arcade, optionally straight into one game.', ({ game }) => {
    openGame(game ?? null);
    shell?.openApp('arcade');
    playSound('openApp');
  }),

  // ---- Customise
  'customise.surprise': define<Record<string, never>>(
    'Surprise me: pick a random theme, wallpaper and sometimes accent.',
    () => surpriseMe(),
  ),
  'setups.save': define<{ name: string }>('Save the whole look (settings and home layout) as a named setup.', ({ name }) =>
    saveSetup(name),
  ),
  'setups.apply': define<{ id: string }>('Switch to a saved setup.', ({ id }) => {
    const setup = getSavedSetups().find((item) => item.id === id);
    if (setup) applySetup(setup);
  }),
  'setups.delete': define<{ id: string }>('Delete a saved setup.', ({ id }) => deleteSetup(id)),
  'setups.import': define<{ file: Blob }>('Load a setup from an exported file.', async ({ file }) =>
    applySetup(await readSetupFile(file)),
  ),

  // ---- Notifications
  'notifications.push': define<{ appId: string; title: string; body: string }>(
    'Show a notification from a Vantage app.',
    (notification) => pushNotification(notification),
  ),
  'notifications.dismiss': define<{ id: string }>('Remove one notification.', ({ id }) => dismissNotification(id)),
  'notifications.clear': define<Record<string, never>>('Remove all notifications.', () => clearNotifications()),

  // ---- Passcode
  'passcode.set': define<{ code: string }>('Set (or change) the 6-digit passcode.', ({ code }) => setPasscode(code)),
  'passcode.remove': define<Record<string, never>>('Turn the passcode off.', () => removePasscode()),

  // ---- Look
  'theme.apply': define<{ id: string }>(
    'Switch to one of the 21 theme presets by id (e.g. midnight, ocean, paper, nokia).',
    ({ id }) => applyPreset(id),
  ),
  'theme.setAppearance': define<{ appearance: Appearance }>('Use dark, light or automatic appearance.', ({ appearance }) =>
    updateSettings({ appearance }),
  ),
  'theme.setAccent': define<{ color: string | null }>(
    'Set the accent color (a hex color like #2DD4BF), or null for the theme\'s own accent.',
    ({ color }) => updateSettings({ accent: color, matchWallpaper: false }),
  ),
  'theme.matchWallpaper': define<{ on: boolean }>('Take the accent and surface tint from the wallpaper.', ({ on }) =>
    updateSettings({ matchWallpaper: on }),
  ),
  'theme.savePreset': define<{ name: string }>('Save the current look as a named preset.', ({ name }) =>
    saveCustomPreset(name),
  ),
  'theme.applySavedPreset': define<{ id: string }>('Switch to a saved preset.', ({ id }) => applyCustomPreset(id)),
  'theme.deleteSavedPreset': define<{ id: string }>('Delete a saved preset.', ({ id }) => deleteCustomPreset(id)),
  'wallpaper.set': define<{ wallpaper: WallpaperConfig }>('Change the wallpaper.', ({ wallpaper }) =>
    updateSettings({ wallpaper }),
  ),
  'wallpaper.setPhoto': define<{ file: Blob }>('Use a photo as the wallpaper.', async ({ file }) => {
    await setWallpaperPhoto(file);
    updateSettings({ wallpaper: { kind: 'photo' } });
  }),
  'wallpaper.removePhoto': define<Record<string, never>>('Remove the wallpaper photo.', async () => {
    await removeWallpaperPhoto();
    if (getSettings().wallpaper.kind === 'photo') updateSettings({ wallpaper: { kind: 'theme' } });
  }),
  'mode.set': define<{ mode: ModeId }>('Switch mode: clean, focus, retro or winddown.', ({ mode }) => setMode(mode)),
  'settings.set': define<{ key: SimpleSetting; value: Settings[SimpleSetting] }>(
    'Change any simple setting (text size, widget style, sounds, ...) by its name.',
    ({ key, value }) => updateSettings({ [key]: value } as Partial<Settings>),
  ),

  // ---- Controls
  'controls.toggle': define<{ control: Toggleable; on?: boolean }>(
    'Turn Wi-Fi, Bluetooth, the flashlight or Do Not Disturb on or off.',
    ({ control, on }) => {
      const next = on ?? !getSettings()[control];
      updateSettings({ [control]: next } as Partial<Settings>);
      // For now these switches only change how they look (as asked). Connecting
      // them to the phone goes through nativeBridge.ts (setFlashlight,
      // toggleDoNotDisturb) once that is wanted.
    },
  ),
  'controls.setBrightness': define<{ level: number }>('Set the brightness from 0 to 1.', ({ level }) =>
    updateSettings({ brightness: level }),
  ),

  // ---- Clock
  'clock.showTab': define<{ tab: ClockTab }>('Show the alarm, world clock, stopwatch or timer tab.', ({ tab }) =>
    setClockTab(tab),
  ),
  'alarm.save': define<{ alarm: Alarm }>('Add or change an alarm (hour, minute, label, repeat days, sound).', ({ alarm }) => saveAlarm(alarm)),
  'alarm.delete': define<{ id: string }>('Delete an alarm.', ({ id }) => deleteAlarm(id)),
  'alarm.setEnabled': define<{ id: string; enabled: boolean }>('Switch an alarm on or off.', ({ id, enabled }) =>
    setAlarmEnabled(id, enabled),
  ),
  'alarm.settings': define<Partial<AlarmSettings>>('Change alarm sound, volume, gentle wake, vibration or snooze length.', (patch) =>
    updateAlarmSettings(patch),
  ),
  'alarm.stop': define<Record<string, never>>('Stop the ringing alarm.', () => stopRinging()),
  'alarm.snooze': define<Record<string, never>>('Snooze the ringing alarm.', () => snooze()),
  'timer.setDuration': define<{ minutes: number }>('Set the timer length in minutes.', ({ minutes }) =>
    setTimerDuration(minutes * 60_000),
  ),
  'timer.start': define<Record<string, never>>('Start or resume the timer.', () => startTimer()),
  'timer.pause': define<Record<string, never>>('Pause the timer.', () => pauseTimer()),
  'timer.reset': define<Record<string, never>>('Reset the timer (also stops a finished timer).', () => resetTimer()),
  'stopwatch.start': define<Record<string, never>>('Start the stopwatch.', () => startStopwatch()),
  'stopwatch.stop': define<Record<string, never>>('Stop the stopwatch.', () => stopStopwatch()),
  'stopwatch.lap': define<Record<string, never>>('Record a lap.', () => addLap()),
  'stopwatch.reset': define<Record<string, never>>('Reset the stopwatch.', () => resetStopwatch()),

  // ---- Notes
  'notes.create': define<{ kind: Note['kind']; onCreated?: (id: string) => void }>(
    'Create a new note (text) or to-do list (checklist).',
    ({ kind, onCreated }) => onCreated?.(createNote(kind).id),
  ),
  'notes.delete': define<{ id: string }>('Delete a note.', ({ id }) => deleteNote(id)),
  'notes.convert': define<{ id: string }>('Switch a note between text and checklist.', ({ id }) => {
    const note = getNote(id);
    if (note) convertNote(note);
  }),

  // ---- Weather
  'weather.refresh': define<Record<string, never>>('Download the latest weather.', () => refreshWeather(true)),
};

export type ActionId = keyof typeof ACTIONS;
export type ActionParams<K extends ActionId> = Parameters<(typeof ACTIONS)[K]['run']>[0];

/** The last actions that ran (newest last), for the assistant to know what just happened. */
const history: { id: ActionId; at: number }[] = [];

/** Runs an action by name. */
export async function runAction<K extends ActionId>(id: K, params: ActionParams<K>): Promise<void> {
  history.push({ id, at: Date.now() });
  if (history.length > 50) history.shift();
  await (ACTIONS[id].run as (p: ActionParams<K>) => void | Promise<void>)(params);
}

/** Every action with its description, e.g. to tell the AI what it can do. */
export function listActions(): { id: ActionId; description: string }[] {
  return (Object.keys(ACTIONS) as ActionId[]).map((id) => ({ id, description: ACTIONS[id].description }));
}

export function recentActions(): readonly { id: ActionId; at: number }[] {
  return history;
}
