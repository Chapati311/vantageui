import { motion, useTransform } from 'motion/react';
import { useSetting } from '../../system/settingsStore';
import { homePageProgress } from './homeMotion';
import styles from './PageDots.module.css';

interface PageDotsProps {
  count: number;
  current: number;
  /** A first, hollow dot for the Today view left of page 1 */
  today?: boolean;
}

/** Distance between dot centres and the dot size (px), as in the CSS. */
const PITCH = 12;
const DOT = 4;

/**
 * Small dots showing which home page you are on. While you swipe, the
 * bright dot stretches toward the next one and then lets go of the last.
 */
export function PageDots({ count: pages, current, today }: PageDotsProps) {
  const [style] = useSetting('pageDots');
  // With Today, positions are shifted by one (Today = position 0)
  const shift = today ? 1 : 0;
  const count = pages + shift;
  const left = useTransform(homePageProgress, (progress) => {
    const page = Math.max(0, Math.min(count - 1, progress + shift));
    const whole = Math.floor(page);
    return whole * PITCH + Math.max(0, (page - whole - 0.5) * 2) * PITCH;
  });
  const width = useTransform(homePageProgress, (progress) => {
    const page = Math.max(0, Math.min(count - 1, progress + shift));
    const whole = Math.floor(page);
    const fraction = page - whole;
    const right = whole * PITCH + DOT + Math.min(1, fraction * 2) * PITCH;
    const start = whole * PITCH + Math.max(0, (fraction - 0.5) * 2) * PITCH;
    return Math.min(right, (count - 1) * PITCH + DOT) - start;
  });

  if (style === 'hidden') return null;
  if (style === 'numbers') {
    return (
      <span className={`label ${styles.numbers}`} aria-label={current < 0 ? 'Today' : `Page ${current + 1} of ${pages}`}>
        {current < 0 ? 'Today' : `${current + 1} / ${pages}`}
      </span>
    );
  }
  return (
    <div className={styles.dots} aria-label={current < 0 ? 'Page Today' : `Page ${current + 1} of ${pages}`}>
      {Array.from({ length: count }, (_, index) => (
        <span key={index} className={`${styles.dot} ${today && index === 0 ? styles.todayDot : ''}`} />
      ))}
      <motion.span className={styles.active} style={{ left, width }} />
    </div>
  );
}
