import type { ReactNode } from 'react';
import styles from './Section.module.css';

interface SectionProps {
  /** Small uppercase label above the group */
  label?: string;
  /** A short line of help under the group */
  note?: string;
  /** Draw the rows on one rounded card (default). Off: just stack the children. */
  card?: boolean;
  children: ReactNode;
}

/** A labelled group: usually a card of Rows, with an optional note under it. */
export function Section({ label, note, card = true, children }: SectionProps) {
  return (
    <section className={styles.section}>
      {label && <h2 className={`label ${styles.label}`}>{label}</h2>}
      {card ? <div className={styles.card}>{children}</div> : children}
      {note && <p className={styles.note}>{note}</p>}
    </section>
  );
}
