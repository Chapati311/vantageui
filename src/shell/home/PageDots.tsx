import { useSetting } from '../../system/settingsStore';
import styles from './PageDots.module.css';

interface PageDotsProps {
  count: number;
  current: number;
}

/** Small dots showing which home screen page you are on. */
export function PageDots({ count, current }: PageDotsProps) {
  const [style] = useSetting('pageDots');
  if (style === 'hidden') return null;
  if (style === 'numbers') {
    return (
      <span className={`label ${styles.numbers}`} aria-label={`Page ${current + 1} of ${count}`}>
        {current + 1} / {count}
      </span>
    );
  }
  return (
    <div className={styles.dots} aria-label={`Page ${current + 1} of ${count}`}>
      {Array.from({ length: count }, (_, index) => (
        <span key={index} className={`${styles.dot} ${index === current ? styles.active : ''}`} />
      ))}
    </div>
  );
}
