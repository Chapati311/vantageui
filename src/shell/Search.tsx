import { motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState, type ComponentType, type RefObject } from 'react';
import { APPS } from '../system/appRegistry';
import type { ScreenRect } from './AppView';
import { SPRING } from '../theme/tokens';
import styles from './Search.module.css';
import { Pressable } from '../components/Pressable';

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
  onClose: () => void;
  onOpenApp: (appId: string, from: ScreenRect) => void;
}

interface Result {
  key: string;
  name: string;
  icon: ComponentType;
  appId?: string;
  run?: () => void;
}

const matches = (query: string, name: string, keywords: string[] = []) =>
  [name, ...keywords].some((word) => word.toLowerCase().includes(query));

/** Swipe up further than this (px) to close the search. */
const CLOSE_SWIPE = 50;

/**
 * Minimal search: one input, and matching apps and actions as big glyph
 * tiles while you type. It is always in the page (just invisible when
 * closed) so the keyboard can open instantly.
 */
export function Search({ open, inputRef, actions, onClose, onOpenApp }: SearchProps) {
  const [query, setQuery] = useState('');
  const swipeStartY = useRef<number | null>(null);

  // Start empty every time it opens.
  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return [
      ...APPS.filter((app) => matches(q, app.name, app.keywords)).map((app) => ({
        key: `app:${app.id}`,
        name: app.name,
        icon: app.icon,
        appId: app.id,
      })),
      ...actions
        .filter((action) => matches(q, action.name, action.keywords))
        .map((action) => ({
          key: `action:${action.id}`,
          name: action.name,
          icon: action.icon,
          run: action.run,
        })),
    ];
  }, [query, actions]);

  const choose = (result: Result, tile: Element | null) => {
    if (result.appId) {
      onOpenApp(result.appId, tile?.getBoundingClientRect() ?? { left: 0, top: 0, width: 0, height: 0 });
    } else {
      result.run?.();
    }
    onClose();
  };

  return (
    <motion.div
      className={`${styles.search} ${open ? styles.open : ''}`}
      initial={false}
      // Springs down a little as it fades in
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
      <input
        ref={inputRef}
        className={styles.input}
        type="text"
        inputMode="search"
        enterKeyHint="go"
        placeholder="Search"
        aria-label="Search apps and actions"
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        tabIndex={open ? 0 : -1}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose();
          if (event.key === 'Enter' && results[0]) {
            choose(results[0], document.querySelector(`[data-result="${results[0].key}"]`));
          }
        }}
      />

      <div className={styles.results}>
        {results.map((result) => {
          const Glyph = result.icon;
          return (
            <Pressable
              key={result.key}
              className={styles.tile}
              data-result={result.key}
              tabIndex={open ? 0 : -1}
              onClick={(event) => choose(result, event.currentTarget)}
            >
              <Glyph />
              <span className={styles.name}>{result.name}</span>
            </Pressable>
          );
        })}
      </div>
    </motion.div>
  );
}
