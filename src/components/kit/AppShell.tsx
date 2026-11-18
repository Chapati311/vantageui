import { motion, useMotionValue, useTransform, type MotionValue } from 'motion/react';
import { createContext, useContext, type ReactNode, type UIEvent } from 'react';
import styles from './AppShell.module.css';

/** How far the app's content has scrolled (px). LargeTitle shrinks with it. */
const ScrollContext = createContext<MotionValue<number> | null>(null);

export function useAppScroll(): MotionValue<number> | null {
  return useContext(ScrollContext);
}

interface AppShellProps {
  /** The page title. Big serif at the top, small and centered once you scroll. */
  title?: string;
  /** Buttons on the left of the top bar (a back button) */
  leading?: ReactNode;
  /** Buttons on the right of the top bar */
  trailing?: ReactNode;
  /** Something under the title that scrolls with it, e.g. a SearchField */
  header?: ReactNode;
  /** A floating TabBar */
  tabBar?: ReactNode;
  /** Content that must not scroll (a timer screen). Default: it scrolls. */
  fixed?: boolean;
  children: ReactNode;
}

/** Scrolled past this (px), the small title shows in the bar. */
const COMPACT_AT = 40;

/**
 * The frame of every app: a top bar (back button, small title, actions), a
 * big serif title that shrinks as you scroll, the content, and room for a
 * floating tab bar. Every Vantage app is built inside one of these.
 */
export function AppShell({ title, leading, trailing, header, tabBar, fixed, children }: AppShellProps) {
  const scrollY = useMotionValue(0);
  const compactOpacity = useTransform(scrollY, [COMPACT_AT - 12, COMPACT_AT], [0, 1]);
  const hasBar = Boolean(leading || trailing || title);
  // Without buttons the bar only holds the small title: it floats over the
  // content instead of pushing the big title down (no empty strip on top)
  const floating = !leading && !trailing;

  const onScroll = (event: UIEvent<HTMLDivElement>) => scrollY.set(event.currentTarget.scrollTop);

  return (
    <ScrollContext.Provider value={scrollY}>
      <div className={`${styles.shell} ${tabBar ? styles.withTabs : ''}`}>
        {hasBar && (
          <div className={`${styles.bar} ${floating ? styles.floating : ''}`}>
            {floating && <motion.span className={styles.barBg} style={{ opacity: compactOpacity }} />}
            <div className={styles.side}>{leading}</div>
            {title && (
              <motion.span className={styles.compactTitle} style={{ opacity: compactOpacity }} aria-hidden="true">
                {title}
              </motion.span>
            )}
            <div className={`${styles.side} ${styles.end}`}>{trailing}</div>
            <motion.span className={styles.barLine} style={{ opacity: compactOpacity }} />
          </div>
        )}
        <div className={`${styles.body} ${fixed ? styles.fixed : ''}`} onScroll={fixed ? undefined : onScroll} data-app-body>
          {title && <LargeTitle>{title}</LargeTitle>}
          {header}
          {children}
        </div>
        {tabBar && <div className={styles.tabBar}>{tabBar}</div>}
      </div>
    </ScrollContext.Provider>
  );
}

/**
 * The big Instrument Serif page title. Inside an AppShell it shrinks and
 * fades as you scroll, while the small title appears in the top bar.
 */
export function LargeTitle({ children }: { children: ReactNode }) {
  const scrollY = useAppScroll();
  const fallback = useMotionValue(0);
  const y = scrollY ?? fallback;
  const scale = useTransform(y, [-80, 0, COMPACT_AT], [1.08, 1, 0.82]);
  const opacity = useTransform(y, [0, COMPACT_AT], [1, 0]);
  return (
    <motion.h1 className={styles.largeTitle} style={{ scale, opacity }}>
      {children}
    </motion.h1>
  );
}
