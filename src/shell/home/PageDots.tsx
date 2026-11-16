import styles from './PageDots.module.css';

interface PageDotsProps {
  count: number;
  current: number;
}

/** Small dots showing which home screen page you are on. */
export function PageDots({ count, current }: PageDotsProps) {
  return (
    <div className={styles.dots} aria-label={`Page ${current + 1} of ${count}`}>
      {Array.from({ length: count }, (_, index) => (
        <span key={index} className={`${styles.dot} ${index === current ? styles.active : ''}`} />
      ))}
    </div>
  );
}
