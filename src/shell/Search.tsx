import { summon } from '../vantage/summon';
import { VantageIcon } from '../system/appIcons';
import { Toast } from '../components/kit/Toast';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type RefObject } from 'react';
import { setCustomiseSection } from '../apps/customise/customiseNav';
import { SESSION_TYPES, startSession } from '../apps/lockin/focusStore';
import { newAlarm } from '../apps/clock/alarmStore';
import { updateNote } from '../apps/notes/notesStore';
import { Pressable } from '../components/Pressable';
import { BellIcon, CheckIcon, CopyIcon, EditIcon, SearchIcon, SunIcon } from '../components/glyphs';
import { runAction } from '../system/actions';
import { APPS, getApp } from '../system/appRegistry';
import { ClockIcon, CustomiseIcon, LockInIcon, NotesIcon, RemindersIcon } from '../system/appIcons';
import { newReminder } from '../system/reminders';
import { PRESETS } from '../theme/presets';
import { SPRING } from '../theme/tokens';
import { shapeOf, type ScreenRect } from './AppView';
import { bestScore, calculate, convert, niceNumber, parseCommand, type Command } from './searchEngine';
import styles from './Search.module.css';

/** Something search can do that is not an app (lock, mute, ...). */
export interface SearchAction {
  id: string;
  name: string;
  icon: ComponentType;
  keywords?: string[];
  run: () => void;
}

interface SearchProps {
  open: boolean;
  /** The Shell holds this so it can open the keyboard the moment you swipe. */
  inputRef: RefObject<HTMLInputElement | null>;
  actions: SearchAction[];
  /** Recently opened apps, newest first (suggestions before you type) */
  recents: string[];
  onClose: () => void;
  onOpenApp: (appId: string, from: ScreenRect) => void;
}

interface Result {
  key: string;
  name: string;
  detail?: string;
  icon: ComponentType;
  appId?: string;
  run?: () => void;
  score: number;
}

/** Customise sections search can open directly. */
const SETTINGS = [
  { id: 'themes', name: 'Themes', keywords: ['theme', 'dark', 'colors', 'preset'] },
  { id: 'colors', name: 'Accent color', keywords: ['accent', 'color', 'colour'] },
  { id: 'appearance', name: 'Light and dark', keywords: ['dark mode', 'light mode', 'night', 'automatic'] },
  { id: 'wallpapers', name: 'Wallpaper', keywords: ['background', 'photo', 'live'] },
  { id: 'lock', name: 'Lock screen clock', keywords: ['clock style', 'lock'] },
  { id: 'home', name: 'Home screen', keywords: ['page dots', 'hide apps', 'layout'] },
  { id: 'icons', name: 'Icons', keywords: ['icon shape', 'labels', 'names'] },
  { id: 'fonts', name: 'Fonts and text size', keywords: ['font', 'text size', 'bold'] },
  { id: 'widgetlab', name: 'Widget Lab', keywords: ['widgets', 'build', 'custom widget'] },
  { id: 'controls', name: 'Control center', keywords: ['brightness', 'dial', 'slider'] },
  { id: 'notifications', name: 'Notifications', keywords: ['notification', 'lock screen count'] },
  { id: 'motion', name: 'Motion and feel', keywords: ['animation', 'speed', 'bounce', 'reduce motion'] },
  { id: 'sounds', name: 'Sounds', keywords: ['volume', 'mute', 'sound'] },
  { id: 'music', name: 'Spotify and Apple Music', keywords: ['spotify', 'apple music', 'connect'] },
  { id: 'modes', name: 'Modes', keywords: ['focus mode', 'retro', 'wind down', 'custom mode'] },
  { id: 'setups', name: 'Setups', keywords: ['export', 'import', 'backup', 'surprise'] },
];

const COMMAND_ICON: Record<Command['type'], ComponentType> = {
  focus: LockInIcon,
  timer: ClockIcon,
  alarm: BellIcon,
  note: NotesIcon,
  reminder: RemindersIcon,
  theme: SunIcon,
};

function describe(command: Command): string {
  switch (command.type) {
    case 'focus':
      return `Start ${command.minutes} min focus`;
    case 'timer':
      return `Start a ${command.minutes} min timer`;
    case 'alarm':
      return `Alarm at ${String(command.hour).padStart(2, '0')}:${String(command.minute).padStart(2, '0')}`;
    case 'note':
      return `New note: ${command.text}`;
    case 'reminder':
      return `Remind me: ${command.text}`;
    case 'theme':
      return `Switch to ${PRESETS.find((preset) => preset.id === command.id)?.name}`;
  }
}

/** Does a command. Returns a short confirmation, or an app to open. */
function runCommand(command: Command): { message?: string; openApp?: string } {
  switch (command.type) {
    case 'focus': {
      const pomodoro = SESSION_TYPES[0];
      startSession({ type: command.minutes === 25 ? 'pomodoro' : 'custom', work: command.minutes, rest: pomodoro.rest, rounds: 1, longRest: pomodoro.rest, tag: '', goal: '', strict: false });
      return { openApp: 'lockin' };
    }
    case 'timer':
      void runAction('timer.reset', {});
      void runAction('timer.setDuration', { minutes: command.minutes });
      void runAction('timer.start', {});
      void runAction('clock.showTab', { tab: 'timer' });
      return { openApp: 'clock' };
    case 'alarm':
      void runAction('alarm.save', { alarm: { ...newAlarm(), hour: command.hour, minute: command.minute } });
      return { message: `${describe(command)} is on.` };
    case 'note':
      void runAction('notes.create', { kind: 'text', onCreated: (id) => updateNote(id, { text: command.text }) });
      return { message: 'Note saved.' };
    case 'reminder':
      void runAction('reminders.save', { reminder: { ...newReminder(), title: command.text } });
      return { message: 'Reminder added.' };
    case 'theme':
      void runAction('theme.apply', { id: command.id });
      return { message: describe(command) };
  }
}

/** Swipe up further than this (px) to close the search. */
const CLOSE_SWIPE = 50;

/**
 * Search: before you type, your recent apps and a few things to try. While
 * you type: answers (math, units), commands ("start 25 min focus"), apps
 * (forgiving about typos), actions and Customise settings, animating in.
 */
export function Search({ open, inputRef, actions, recents, onClose, onOpenApp }: SearchProps) {
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const clearToast = useCallback(() => setToast(null), []);
  const swipeStartY = useRef<number | null>(null);

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);


  const q = query.trim();
  const math = useMemo(() => calculate(q), [q]);
  const conversion = useMemo(() => convert(q), [q]);
  const answer = conversion ?? (math !== null ? `${q} = ${niceNumber(math)}` : null);
  const command = useMemo(() => parseCommand(q, PRESETS.map((preset) => preset.id)), [q]);

  const results = useMemo<Result[]>(() => {
    if (!q) return [];
    const list: Result[] = [
      ...APPS.filter((app) => !app.hidden).map((app) => ({ key: `app:${app.id}`, name: app.name, icon: app.icon, appId: app.id, score: bestScore(q, app.name, app.keywords) })),
      ...actions.map((action) => ({ key: `action:${action.id}`, name: action.name, icon: action.icon, run: action.run, score: bestScore(q, action.name, action.keywords) * 0.95 })),
      ...SETTINGS.map((setting) => ({
        key: `setting:${setting.id}`,
        name: setting.name,
        detail: 'Customise',
        icon: CustomiseIcon,
        score: bestScore(q, setting.name, setting.keywords) * 0.85,
        run: () => {
          setCustomiseSection(setting.id);
          void runAction('app.open', { appId: 'customise' });
        },
      })),
    ];
    return list.filter((result) => result.score > 0).sort((a, b) => b.score - a.score).slice(0, 10);
  }, [q, actions]);

  const choose = (result: Result, tile: Element | null) => {
    if (result.appId) {
      const icon = tile?.querySelector('svg') ?? tile;
      onOpenApp(result.appId, icon ? shapeOf(tile ?? icon) : { left: 0, top: 0, width: 0, height: 0 });
    } else result.run?.();
    onClose();
  };

  const doCommand = (value: Command) => {
    const outcome = runCommand(value);
    if (outcome.openApp) {
      onClose();
      void runAction('app.open', { appId: outcome.openApp });
    } else if (outcome.message) {
      setToast(outcome.message);
      setQuery('');
    }
  };

  const copyAnswer = () => {
    if (!answer) return;
    const value = answer.split(' = ').pop() ?? answer;
    void navigator.clipboard?.writeText(value).catch(() => undefined);
    setToast(`Copied ${value}`);
  };

  const suggestions: { label: string; command: Command }[] = [
    { label: 'Start 25 min focus', command: { type: 'focus', minutes: 25 } },
    { label: '5 min timer', command: { type: 'timer', minutes: 5 } },
    { label: 'Alarm 7:00', command: { type: 'alarm', hour: 7, minute: 0 } },
  ];

  let order = 0;
  const enter = () => ({
    initial: { opacity: 0, y: 8, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { ...SPRING.ui, delay: 0.03 * order++ },
  });

  return (
    <motion.div
      className={`${styles.search} ${open ? styles.open : ''}`}
      initial={false}
      animate={{ opacity: open ? 1 : 0, y: open ? 0 : -16 }}
      transition={SPRING.sheet}
      aria-hidden={!open}
      onPointerDown={(event) => {
        swipeStartY.current = event.clientY;
      }}
      onPointerUp={(event) => {
        const start = swipeStartY.current;
        swipeStartY.current = null;
        const swipedUp = start !== null && start - event.clientY > CLOSE_SWIPE;
        const tappedEmpty = event.target === event.currentTarget;
        if (swipedUp || tappedEmpty) onClose();
      }}
    >
      <div className={styles.field}>
        <SearchIcon />
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          inputMode="search"
          enterKeyHint="go"
          placeholder="Search or ask"
          aria-label="Search apps, settings and actions"
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          tabIndex={open ? 0 : -1}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') onClose();
            if (event.key !== 'Enter') return;
            if (/^ask vantage/i.test(q)) {
              onClose();
              summon('search', q.replace(/^ask vantage:?\s*/i, ''));
            } else if (command) doCommand(command);
            else if (answer) copyAnswer();
            else if (results[0]) choose(results[0], document.querySelector(`[data-result="${results[0].key}"]`));
          }}
        />
      </div>

      <div className={styles.results}>
        <AnimatePresence mode="popLayout">
          {!q && recents.length > 0 && (
            <motion.p key="recent-label" className={`label ${styles.group}`} {...enter()}>
              Recent
            </motion.p>
          )}
          {!q &&
            recents.slice(0, 4).map((appId) => {
              const app = getApp(appId);
              if (!app) return null;
              const Glyph = app.icon;
              return (
                <motion.div key={`recent:${appId}`} {...enter()}>
                  <Pressable className={styles.tile} data-result={`recent:${appId}`} tabIndex={open ? 0 : -1} onClick={(event) => choose({ key: appId, name: app.name, icon: app.icon, appId, score: 1 }, event.currentTarget)}>
                    <Glyph />
                    <span className={styles.name}>{app.name}</span>
                  </Pressable>
                </motion.div>
              );
            })}
          {!q && (
            <motion.p key="try-label" className={`label ${styles.group}`} {...enter()}>
              Try
            </motion.p>
          )}
          {!q &&
            suggestions.map((suggestion) => {
              const Glyph = COMMAND_ICON[suggestion.command.type];
              return (
                <motion.div key={`try:${suggestion.label}`} {...enter()}>
                  <Pressable className={styles.tile} tabIndex={open ? 0 : -1} onClick={() => doCommand(suggestion.command)}>
                    <Glyph />
                    <span className={styles.name}>{suggestion.label}</span>
                  </Pressable>
                </motion.div>
              );
            })}

          {answer && (
            <motion.div key="answer" className={styles.wide} {...enter()}>
              <Pressable className={`${styles.tile} ${styles.answer}`} tabIndex={open ? 0 : -1} onClick={copyAnswer} aria-label={`${answer}. Tap to copy`}>
                <span className={styles.answerText}>{answer.split(' = ').pop()}</span>
                <span className={styles.detail}>{answer.split(' = ')[0]}</span>
                <CopyIcon />
              </Pressable>
            </motion.div>
          )}
          {command && (
            <motion.div key={`command:${q}`} className={styles.wide} {...enter()}>
              <Pressable className={`${styles.tile} ${styles.command}`} tabIndex={open ? 0 : -1} onClick={() => doCommand(command)}>
                {(() => {
                  const Glyph = COMMAND_ICON[command.type];
                  return <Glyph />;
                })()}
                <span className={styles.name}>{describe(command)}</span>
                <CheckIcon />
              </Pressable>
            </motion.div>
          )}
          {results.map((result) => {
            const Glyph = result.icon;
            return (
              <motion.div key={result.key} {...enter()}>
                <Pressable className={styles.tile} data-result={result.key} tabIndex={open ? 0 : -1} onClick={(event) => choose(result, event.currentTarget)}>
                  <Glyph />
                  <span className={styles.nameBlock}>
                    <span className={styles.name}>{result.name}</span>
                    {result.detail && <span className={styles.detail}>{result.detail}</span>}
                  </span>
                </Pressable>
              </motion.div>
            );
          })}
          {q && !answer && (
            <motion.div key="ask" className={styles.wide} {...enter()}>
              <Pressable
                className={styles.tile}
                tabIndex={open ? 0 : -1}
                onClick={() => {
                  onClose();
                  summon('search', q.replace(/^ask vantage:?\s*/i, ''));
                }}
              >
                <VantageIcon />
                <span className={styles.name}>Ask Vantage: "{q.replace(/^ask vantage:?\s*/i, '')}"</span>
              </Pressable>
            </motion.div>
          )}
          {q && !answer && !command && results.length === 0 && (
            <motion.div key="nothing" className={styles.wide} {...enter()}>
              <Pressable
                className={styles.tile}
                tabIndex={open ? 0 : -1}
                onClick={() => doCommand({ type: 'note', text: q })}
              >
                <EditIcon />
                <span className={styles.name}>Nothing found. Save "{q}" as a note</span>
              </Pressable>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Toast message={toast} kind="success" onDone={clearToast} />
    </motion.div>
  );
}
