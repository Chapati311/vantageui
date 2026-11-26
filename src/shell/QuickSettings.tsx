import { useDrag } from '@use-gesture/react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Dial } from '../components/kit/Dial';
import { Slider } from '../components/kit/Slider';
import { Toast } from '../components/kit/Toast';
import { Pressable } from '../components/Pressable';
import { RoundToggle } from '../components/RoundToggle';
import {
  BluetoothIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ContrastIcon,
  EyeIcon,
  FlashlightIcon,
  MicIcon,
  MoonIcon,
  PauseIcon,
  PlayIcon,
  SkipNextIcon,
  SkipPreviousIcon,
  SoundIcon,
  SunIcon,
  WifiIcon,
  AirplaneIcon,
  CellularIcon,
  RotationLockIcon,
  BellOffIcon,
} from '../components/glyphs';
import { hasRealControls, mediaCommand, setControl, useControls, type PhoneControls } from '../system/phoneControls';
import { CalculatorIcon, VantageIcon } from '../system/appIcons';
import { runAction } from '../system/actions';
import { keepAwakeSupported, useKeepAwake } from '../system/keepAwake';
import { currentTrack, getMusicVolume, usePlayer } from '../system/musicPlayer';
import { useRecorder } from '../system/recordings';
import { useSetting, useSettings, type ModeId } from '../system/settingsStore';
import { useTheme } from '../system/theme';
import { MOTION, SPRING, rubberBand } from '../theme/tokens';
import styles from './QuickSettings.module.css';

interface QuickSettingsProps {
  open: boolean;
  onClose: () => void;
}

/** Every tile the control center can show, in its default order. */
const TILES: { id: string; name: string }[] = [
  { id: 'toggles', name: 'Toggles' },
  { id: 'music', name: 'Music' },
  { id: 'dials', name: 'Brightness and volume' },
  { id: 'modes', name: 'Modes' },
  { id: 'timers', name: 'Quick timers' },
  { id: 'shortcuts', name: 'Shortcuts' },
];

const MODES: { id: ModeId; name: string }[] = [
  { id: 'clean', name: 'Clean' },
  { id: 'focus', name: 'Focus' },
  { id: 'retro', name: 'Retro' },
  { id: 'winddown', name: 'Wind Down' },
  { id: 'hacker', name: 'Hacker' },
];

/** Music: the song playing in Vantage, with controls. */
function MusicTile() {
  const player = usePlayer();
  const song = currentTrack(player);
  return (
    <div className={styles.music}>
      <span className={styles.musicText}>
        <span className={styles.musicTitle}>{song?.title ?? 'Not playing'}</span>
        <span className={styles.musicArtist}>{song ? song.artist || 'Your music' : 'Add songs in Music'}</span>
      </span>
      <Pressable
        className={styles.musicButton}
        aria-label="Previous song"
        disabled={!song}
        onClick={() => void runAction('music.previous', {})}
      >
        <SkipPreviousIcon />
      </Pressable>
      <Pressable
        className={styles.musicButton}
        aria-label={player.playing ? 'Pause' : 'Play'}
        disabled={!song && player.tracks.length === 0}
        onClick={() => void runAction('music.togglePlay', {})}
      >
        {player.playing ? <PauseIcon /> : <PlayIcon />}
      </Pressable>
      <Pressable className={styles.musicButton} aria-label="Next song" disabled={!song} onClick={() => void runAction('music.next', {})}>
        <SkipNextIcon />
      </Pressable>
    </div>
  );
}

/** Music on the real phone: whatever app is playing (Spotify, Music, podcasts...). */
function NowPlayingTile({ playing }: { playing: PhoneControls['nowPlaying'] }) {
  return (
    <div className={styles.music}>
      {playing?.artwork && <img className={styles.musicArt} src={`data:image/jpeg;base64,${playing.artwork}`} alt="" />}
      <span className={styles.musicText}>
        <span className={styles.musicTitle}>{playing?.title ?? 'Not playing'}</span>
        <span className={styles.musicArtist}>{playing ? playing.artist || playing.album || '' : 'Play something in any app'}</span>
      </span>
      <Pressable className={styles.musicButton} aria-label="Previous song" disabled={!playing} onClick={() => void mediaCommand('previous')}>
        <SkipPreviousIcon />
      </Pressable>
      <Pressable className={styles.musicButton} aria-label={playing?.playing ? 'Pause' : 'Play'} disabled={!playing} onClick={() => void mediaCommand('toggle')}>
        {playing?.playing ? <PauseIcon /> : <PlayIcon />}
      </Pressable>
      <Pressable className={styles.musicButton} aria-label="Next song" disabled={!playing} onClick={() => void mediaCommand('next')}>
        <SkipNextIcon />
      </Pressable>
    </div>
  );
}

/** A small round shortcut button with a name under it. */
function Shortcut({ label, icon: Glyph, on, onPress }: { label: string; icon: () => ReactNode; on?: boolean; onPress: () => void }) {
  return (
    <Pressable className={`${styles.shortcut} ${on ? styles.shortcutOn : ''}`} aria-label={label} aria-pressed={on} onClick={onPress}>
      <span className={styles.shortcutCircle}>
        <Glyph />
      </span>
      <span className={styles.shortcutName}>{label}</span>
    </Pressable>
  );
}

/**
 * The frosted panel that springs down from the top: toggles, music,
 * brightness and volume dials, modes, quick timers and shortcuts. "Edit"
 * lets you reorder or hide every tile. Drag it up to close; a flick is enough.
 */
export function QuickSettings({ open, onClose }: QuickSettingsProps) {
  const settings = useSettings();
  // On the phone (host mode) every toggle, dial and slider is the REAL one
  const real = hasRealControls();
  const controls = useControls();
  const [savedBrightness] = useSetting('brightness');
  const brightness = real && controls.brightness !== undefined ? controls.brightness : savedBrightness;
  const [controlStyle] = useSetting('controlStyle');
  const theme = useTheme();
  const awake = useKeepAwake();
  const { recordingSince } = useRecorder();
  const [volume, setVolume] = useState(getMusicVolume);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toggle = (control: 'wifi' | 'bluetooth' | 'flashlight' | 'doNotDisturb') => (on: boolean) =>
    void runAction('controls.toggle', { control, on });
  const panel = useRef<HTMLDivElement>(null);

  // 0 = parked above the screen, 1 = fully down
  const shown = useMotionValue(open ? 1 : 0);
  const y = useTransform(shown, (value) => `${(value - 1) * 100}%`);
  const backdrop = useTransform(shown, [0, 1], [0, 0.6]);
  // Closed = not drawn at all (nothing can peek in under the status bar)
  const visibility = useTransform(shown, (value) => (value <= 0.002 ? 'hidden' : 'visible'));

  useEffect(() => {
    animate(shown, open ? 1 : 0, SPRING.sheet);
    if (!open) setEditing(false);
  }, [open, shown]);

  const bind = useDrag(
    ({ first, last, movement: [, moved], velocity: [, speed], direction: [, direction], memo, event }) => {
      // Dials and sliders turn; they don't move the panel
      if (first && (event.target as Element).closest('[role="slider"], [data-no-drag]')) return 'skip';
      if (memo === 'skip') return memo;
      const height = panel.current?.offsetHeight ?? 1;
      if (first) {
        shown.stop(); // catch it mid-spring
        memo = shown.get();
      }
      // Pulling it further down than fully open rubber-bands.
      const value = rubberBand((memo as number) + moved / height, 0, 1);
      if (!last) {
        shown.set(value);
        return memo;
      }
      const flick = speed > MOTION.flickVelocity;
      const stayOpen = flick ? direction > 0 : value > 0.5;
      const velocity = ((direction > 0 ? speed : -speed) * 1000) / height;
      animate(shown, stayOpen ? 1 : 0, { ...SPRING.sheet, velocity });
      if (!stayOpen) onClose();
      return memo;
    },
    { axis: 'y', filterTaps: true, enabled: open && !editing },
  );

  const order = settings.controlTiles.filter((id) => TILES.some((tile) => tile.id === id));
  const setOrder = (next: string[]) => void runAction('settings.set', { key: 'controlTiles', value: next });

  const tile = (id: string): ReactNode => {
    switch (id) {
      case 'toggles':
        if (real) {
          // Only what iOS really reports is shown (Part 2: nothing faked)
          const on = (value: boolean | undefined) => value === true;
          return (
            <div className={styles.toggleRows}>
              <div className={styles.toggles}>
                {controls.wifi && <RoundToggle risky label={controls.wifi.on && controls.wifi.network ? `Wi-Fi, ${controls.wifi.network}` : 'Wi-Fi'} icon={WifiIcon} on={controls.wifi.on} onChange={(v) => void setControl('wifi', v)} />}
                {controls.bluetooth && <RoundToggle risky label="Bluetooth" icon={BluetoothIcon} on={controls.bluetooth.on} onChange={(v) => void setControl('bluetooth', v)} />}
                {controls.flashlight !== undefined && <RoundToggle label="Light" icon={FlashlightIcon} on={controls.flashlight > 0} onChange={(v) => void setControl('flashlight', v)} />}
                {controls.dnd !== undefined && <RoundToggle label="Focus" icon={MoonIcon} on={on(controls.dnd)} onChange={(v) => void setControl('dnd', v)} />}
              </div>
              <div className={styles.toggles}>
                {controls.airplane !== undefined && <RoundToggle risky label="Airplane" icon={AirplaneIcon} on={on(controls.airplane)} onChange={(v) => void setControl('airplane', v)} />}
                {controls.cellular !== undefined && <RoundToggle risky label="Cellular" icon={CellularIcon} on={on(controls.cellular)} onChange={(v) => void setControl('cellular', v)} />}
                {controls.rotationLock !== undefined && <RoundToggle label="Rotation" icon={RotationLockIcon} on={on(controls.rotationLock)} onChange={(v) => void setControl('rotationLock', v)} />}
                {controls.silent !== undefined && <RoundToggle label="Silent" icon={BellOffIcon} on={on(controls.silent)} onChange={(v) => void setControl('silent', v)} />}
              </div>
            </div>
          );
        }
        return (
          <div className={styles.toggles}>
            <RoundToggle risky label="Wi-Fi" icon={WifiIcon} on={settings.wifi} onChange={toggle('wifi')} />
            <RoundToggle label="Bluetooth" icon={BluetoothIcon} on={settings.bluetooth} onChange={toggle('bluetooth')} />
            <RoundToggle label="Light" icon={FlashlightIcon} on={settings.flashlight} onChange={toggle('flashlight')} />
            <RoundToggle label="DND" icon={MoonIcon} on={settings.doNotDisturb} onChange={toggle('doNotDisturb')} />
          </div>
        );
      case 'music':
        return real ? <NowPlayingTile playing={controls.nowPlaying} /> : <MusicTile />;
      case 'dials':
        return controlStyle === 'dial' ? (
          <div className={styles.dials}>
            <Dial
              label="Brightness"
              icon={SunIcon}
              value={brightness}
              onInput={(level) => real && void setControl('brightness', level)}
              onChange={(level) => (real ? void setControl('brightness', level) : void runAction('controls.setBrightness', { level }))}
            />
            <Dial
              label="Volume"
              plain
              icon={SoundIcon}
              value={real && controls.volume !== undefined ? controls.volume : volume}
              onInput={(level) => (real ? void setControl('volume', level) : setVolume(level))}
              onChange={(level) => {
                if (real) return void setControl('volume', level);
                setVolume(level);
                void runAction('music.setVolume', { level });
              }}
            />
          </div>
        ) : (
          <div className={styles.sliders}>
            <Slider
              label="Brightness"
              value={Math.round(brightness * 100)}
              min={0}
              max={100}
              step={1}
              onChange={(value) => (real ? void setControl('brightness', value / 100) : void runAction('controls.setBrightness', { level: value / 100 }))}
            />
            <Slider
              label="Volume"
              value={Math.round((real && controls.volume !== undefined ? controls.volume : volume) * 100)}
              min={0}
              max={100}
              step={1}
              onChange={(value) => {
                if (real) return void setControl('volume', value / 100);
                setVolume(value / 100);
                void runAction('music.setVolume', { level: value / 100 });
              }}
            />
          </div>
        );
      case 'modes':
        return (
          <div className={styles.modes} role="radiogroup" aria-label="Mode">
            {MODES.map((mode) => (
              <Pressable
                key={mode.id}
                role="radio"
                aria-checked={settings.mode === mode.id}
                className={`${styles.chip} ${settings.mode === mode.id ? styles.chipOn : ''}`}
                onClick={() => void runAction('mode.set', { mode: mode.id })}
              >
                {mode.name}
              </Pressable>
            ))}
          </div>
        );
      case 'timers':
        return (
          <div className={styles.modes} aria-label="Quick timer">
            {[1, 5, 10, 25].map((minutes) => (
              <Pressable
                key={minutes}
                className={styles.chip}
                aria-label={`Start a ${minutes} minute timer`}
                onClick={() => {
                  void runAction('timer.quick', { minutes });
                  setToast(`${minutes} min timer started`);
                }}
              >
                {minutes} min
              </Pressable>
            ))}
          </div>
        );
      case 'shortcuts':
        return (
          <div className={styles.shortcuts}>
            <Shortcut
              label="Vantage"
              icon={VantageIcon}
              onPress={() => {
                onClose();
                void runAction('app.open', { appId: 'vantage' });
              }}
            />
            <Shortcut
              label="Calculator"
              icon={CalculatorIcon}
              onPress={() => {
                onClose();
                void runAction('app.open', { appId: 'calculator' });
              }}
            />
            <Shortcut
              label={recordingSince ? 'Stop' : 'Voice note'}
              icon={MicIcon}
              on={recordingSince !== null}
              onPress={() => {
                if (recordingSince) {
                  onClose();
                  void runAction('app.open', { appId: 'recorder' });
                } else void runAction('recorder.start', {});
              }}
            />
            <Shortcut
              label={theme.dark ? 'Light' : 'Dark'}
              icon={ContrastIcon}
              onPress={() => void runAction('theme.setAppearance', { appearance: theme.dark ? 'light' : 'dark' })}
            />
            <Shortcut
              label="Awake"
              icon={EyeIcon}
              on={awake}
              onPress={() => {
                if (!keepAwakeSupported()) {
                  setToast('Keep awake needs iOS 16.4 or newer');
                  return;
                }
                void runAction('device.keepAwake', { on: !awake });
              }}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`${styles.layer} ${open ? styles.open : ''}`} aria-hidden={!open}>
      {/* Dark area below the panel: tap it to close */}
      <motion.div className={styles.backdrop} style={{ opacity: backdrop, visibility }} onClick={onClose} />

      <motion.div ref={panel} className={styles.panel} style={{ y, visibility }} {...(bind() as object)}>
        <div className={styles.head}>
          <span className="label">{editing ? 'Edit controls' : 'Controls'}</span>
          <Pressable className={`label hit-44 ${styles.edit}`} data-no-drag onClick={() => setEditing((value) => !value)}>
            {editing ? 'Done' : 'Edit'}
          </Pressable>
        </div>

        {editing ? (
          // Edit mode: every tile as a row; move it up or down, or hide it
          <ul className={styles.editList} data-no-drag>
            {[...order, ...TILES.map((t) => t.id).filter((id) => !order.includes(id))].map((id) => {
              const shownTile = order.includes(id);
              const index = order.indexOf(id);
              return (
                <motion.li key={id} layout transition={SPRING.ui} className={`${styles.editRow} ${shownTile ? '' : styles.editHidden}`}>
                  <span className={styles.editName}>{TILES.find((t) => t.id === id)?.name}</span>
                  {shownTile && (
                    <>
                      <Pressable
                        className={styles.editButton}
                        aria-label="Move up"
                        disabled={index === 0}
                        onClick={() => setOrder(order.map((item, i) => (i === index - 1 ? id : i === index ? order[index - 1] : item)))}
                      >
                        <ChevronUpIcon />
                      </Pressable>
                      <Pressable
                        className={styles.editButton}
                        aria-label="Move down"
                        disabled={index === order.length - 1}
                        onClick={() => setOrder(order.map((item, i) => (i === index + 1 ? id : i === index ? order[index + 1] : item)))}
                      >
                        <ChevronDownIcon />
                      </Pressable>
                    </>
                  )}
                  <Pressable
                    className={`label ${styles.editShow}`}
                    onClick={() => setOrder(shownTile ? order.filter((item) => item !== id) : [...order, id])}
                  >
                    {shownTile ? 'Hide' : 'Show'}
                  </Pressable>
                </motion.li>
              );
            })}
          </ul>
        ) : (
          order.map((id) => (
            <motion.div key={id} layout="position" transition={SPRING.ui} className={styles.tile}>
              {tile(id)}
            </motion.div>
          ))
        )}
        <span className={styles.handle} />
      </motion.div>
      <Toast message={toast} kind="success" onDone={() => setToast(null)} />
    </div>
  );
}
