import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { DotLogo } from '../../components/DotLogo';
import { DotNumber } from '../../components/DotNumber';
import { Pressable } from '../../components/Pressable';
import { ScaledPreview } from '../../components/ScaledPreview';
import { Button, SegmentedControl } from '../../components/kit';
import { ThemeCard } from '../../apps/settings/ThemeCard';
import { useLockIn } from '../../apps/lockin/lockInStore';
import { runAction } from '../../system/actions';
import { LOCK_CLOCK_NAMES, LOCK_CLOCK_STYLES, useSettings } from '../../system/settingsStore';
import { useTheme } from '../../system/theme';
import { PRESETS } from '../../theme/presets';
import { SPRING } from '../../theme/tokens';
import { LIVE_WALLPAPERS, sameWallpaper, type WallpaperConfig } from '../../theme/wallpapers';
import { LockClock } from '../LockClock';
import { Wallpaper } from '../wallpaper/Wallpaper';
import tiles from '../../apps/settings/SettingsApp.module.css';
import styles from './FirstSetup.module.css';

const STEPS = ['welcome', 'name', 'theme', 'wallpaper', 'clock', 'focus', 'done'] as const;
const THEMES = ['midnight', 'ocean', 'aurora', 'paper', 'sunset', 'mono'];
const GOALS = [60, 120, 180, 240];

/** A hidden input focused during a tap, so iOS opens the keyboard (see `go`). */
function focusKeyboardStandIn() {
  removeKeyboardStandIn();
  const input = document.createElement('input');
  input.id = 'keyboard-stand-in';
  input.setAttribute('aria-hidden', 'true');
  input.tabIndex = -1;
  // 16 px stops iOS from zooming in; off-screen and invisible
  input.style.cssText = 'position:fixed;top:0;left:-200px;width:1px;height:1px;opacity:0;font-size:16px';
  document.body.appendChild(input);
  input.focus();
}

function removeKeyboardStandIn() {
  document.getElementById('keyboard-stand-in')?.remove();
}

/**
 * The first-boot setup, like a new phone: welcome, your name, a theme (the
 * whole screen changes as you pick), a wallpaper, a clock style, a daily
 * focus goal, done. Every choice applies right away, so "Back" and "Skip"
 * are always safe. Replay it from Customise > Setups.
 */
export function FirstSetup() {
  const settings = useSettings();
  const theme = useTheme();
  const lockIn = useLockIn();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [name, setName] = useState(settings.userName);

  const nameInput = useRef<HTMLInputElement>(null);

  const go = (next: number) => {
    const target = Math.max(0, Math.min(STEPS.length - 1, next));
    // iOS only opens the keyboard during a tap, but the name field appears
    // after the slide animation. Focus a hidden stand-in now (inside the tap),
    // then hand the focus to the real field when it is there.
    if (STEPS[target] === 'name') focusKeyboardStandIn();
    setDirection(next > step ? 1 : -1);
    setStep(target);
  };

  // The real name field is on screen: take the focus (and the open keyboard) over.
  useEffect(() => {
    if (STEPS[step] !== 'name') return;
    const id = window.setTimeout(() => {
      nameInput.current?.focus();
      removeKeyboardStandIn();
    }, 50);
    return () => window.clearTimeout(id);
  }, [step]);
  const finish = () => void runAction('setup.finish', { name });
  const id = STEPS[step];

  const pickWallpaper = (wallpaper: WallpaperConfig) => void runAction('wallpaper.set', { wallpaper, screen: 'both' });
  const wallpaperTile = (wallpaper: WallpaperConfig, label: string) => {
    const selected = sameWallpaper(wallpaper, settings.wallpaper);
    return (
      <Pressable
        key={label}
        className={`${tiles.tile} ${selected ? tiles.selected : ''}`}
        aria-pressed={selected}
        onClick={() => pickWallpaper(wallpaper)}
      >
        <span className={tiles.tileFrame}>
          <ScaledPreview>
            <Wallpaper place="preview" config={wallpaper} paused />
          </ScaledPreview>
        </span>
        <span className={tiles.tileName}>{label}</span>
      </Pressable>
    );
  };

  let body: ReactNode;
  let title = '';
  let text = '';
  switch (id) {
    case 'welcome':
      body = (
        <div className={styles.hello}>
          <div className={styles.logo}>
            <DotLogo animated />
          </div>
          <h1 className={styles.big}>Hello</h1>
          <p className="label">Vantage OS</p>
        </div>
      );
      break;
    case 'name':
      title = 'Your name';
      text = 'Used for greetings on Today and the lock screen. It stays on this phone.';
      body = (
        // The wrapper sets the big serif size: inputs take their parent's size
        // (global.css, so iOS never zooms into a field)
        <div className={styles.nameField}>
          <input
            ref={nameInput}
            className={styles.nameInput}
            placeholder="First name"
            aria-label="Your first name"
            value={name}
            maxLength={24}
            autoComplete="given-name"
            autoCapitalize="words"
            enterKeyHint="next"
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              // Return = Next
              if (event.key === 'Enter') {
                event.currentTarget.blur();
                go(step + 1);
              }
            }}
          />
        </div>
      );
      break;
    case 'theme':
      title = 'Pick a look';
      text = 'Everything changes as you tap. More themes live in Customise.';
      body = (
        <div className={`${tiles.tiles} ${tiles.tilesTwo}`}>
          {THEMES.map((themeId) => {
            const preset = PRESETS.find((p) => p.id === themeId)!;
            const selected = theme.presetId === themeId;
            return (
              <Pressable
                key={themeId}
                className={`${tiles.tile} ${selected ? tiles.selected : ''}`}
                aria-pressed={selected}
                onClick={() => void runAction('theme.apply', { id: themeId })}
              >
                <span className={tiles.tileFrame}>
                  <ThemeCard preset={preset} />
                </span>
                <span className={tiles.tileName}>{preset.name}</span>
              </Pressable>
            );
          })}
        </div>
      );
      break;
    case 'wallpaper':
      title = 'Wallpaper';
      text = 'Live wallpapers move gently and pause when the screen is off.';
      body = (
        <div className={tiles.tiles}>
          {wallpaperTile({ kind: 'theme' }, 'Theme')}
          {LIVE_WALLPAPERS.filter((live) => live.id !== 'pixel').map((live) => wallpaperTile({ kind: 'live', id: live.id }, live.name))}
        </div>
      );
      break;
    case 'clock':
      title = 'Lock clock';
      text = 'Tap the clock on the lock screen any time to try the next style.';
      body = (
        <>
          <div className={styles.clockFrame}>
            <ScaledPreview>
              <div className={styles.clockStage}>
                <LockClock />
              </div>
            </ScaledPreview>
          </div>
          <div className={styles.chips}>
            {LOCK_CLOCK_STYLES.map((style) => (
              <Pressable
                key={style}
                className={`${styles.chip} ${settings.lockClockStyle === style ? styles.chipOn : ''}`}
                aria-pressed={settings.lockClockStyle === style}
                onClick={() => void runAction('settings.set', { key: 'lockClockStyle', value: style })}
              >
                {LOCK_CLOCK_NAMES[style]}
              </Pressable>
            ))}
          </div>
        </>
      );
      break;
    // Vantage replaces Lock In (VANTAGE.md): the daily focus goal is Vantage's.
    // (It is stored with the focus data that Vantage syncs when you sign in.)
    case 'focus':
      title = 'Vantage';
      text = 'How long do you want to focus each day? Vantage keeps you to it: focus sessions, school, grades and stats all live in Vantage.';
      body = (
        <>
          <div className={styles.goal}>
            <DotNumber value={String(Math.round(lockIn.dailyGoal / 60))} size={96} />
            <span className="label">hours of focus a day</span>
          </div>
          <SegmentedControl
            label="Daily focus goal"
            value={String(GOALS.includes(lockIn.dailyGoal) ? lockIn.dailyGoal : 120)}
            onChange={(value) => void runAction('lockin.setDailyGoal', { minutes: Number(value) })}
            options={GOALS.map((minutes) => ({ id: String(minutes), label: `${minutes / 60} h` }))}
          />
        </>
      );
      break;
    case 'done':
      body = (
        <div className={styles.hello}>
          <svg className={styles.check} viewBox="0 0 48 48" aria-hidden="true">
            <circle cx="24" cy="24" r="22" pathLength={1} />
            <path d="M14 25 21 32 34 17" pathLength={1} />
          </svg>
          <h1 className={styles.big}>{name.trim() ? `All set, ${name.trim()}` : 'All set'}</h1>
          <p className={styles.text}>Long-press anything to change it. Swipe right on the first page for Today.</p>
        </div>
      );
      break;
  }

  return (
    <motion.div
      className={styles.layer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={SPRING.app}
    >
      {/* The real wallpaper behind, so wallpaper and theme choices show live */}
      <div className={styles.wallpaper} aria-hidden="true">
        <Wallpaper place="home" />
      </div>
      <div className={styles.top}>
        <div
          className={styles.dots}
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
          aria-label={`Step ${step + 1} of ${STEPS.length}`}
        >
          {STEPS.map((stepId, index) => (
            <motion.span
              key={stepId}
              className={`${styles.dot} ${index <= step ? styles.dotOn : ''}`}
              animate={{ width: index === step ? 24 : 8 }}
              transition={SPRING.ui}
            />
          ))}
        </div>
        {id !== 'done' && (
          <Pressable className={`label ${styles.skip}`} onClick={finish}>
            Skip
          </Pressable>
        )}
      </div>

      <div className={styles.stage}>
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={id}
            className={styles.step}
            custom={direction}
            variants={{
              enter: (dir: number) => ({ opacity: 0, x: dir * 48 }),
              center: { opacity: 1, x: 0 },
              exit: (dir: number) => ({ opacity: 0, x: dir * -48 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={SPRING.ui}
          >
            {title && <h1 className={styles.title}>{title}</h1>}
            {text && <p className={styles.text}>{text}</p>}
            {body}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={styles.footer}>
        {step > 0 && id !== 'done' ? <Button onPress={() => go(step - 1)}>Back</Button> : <span />}
        {id === 'welcome' ? (
          <Button kind="primary" onPress={() => go(1)}>
            Get started
          </Button>
        ) : id === 'done' ? (
          <Button kind="primary" onPress={finish}>
            Start
          </Button>
        ) : (
          <Button kind="primary" onPress={() => go(step + 1)}>
            Next
          </Button>
        )}
      </div>
    </motion.div>
  );
}
