import type { ReactNode } from 'react';
import { CircleButton } from '../../components/CircleButton';
import { ScrollArea } from '../../components/ScrollArea';
import { BackIcon } from '../../components/glyphs';
import styles from './SettingsApp.module.css';

interface SettingsPageProps {
  title: string;
  /** Leave out on the main page */
  onBack?: () => void;
  children: ReactNode;
}

/** One page of the Settings app: a back button, a big title and a scrolling body. */
export function SettingsPage({ title, onBack, children }: SettingsPageProps) {
  return (
    <ScrollArea className={styles.page}>
      {onBack && (
        <div className={styles.bar}>
          <CircleButton small label="Back" onClick={onBack}>
            <BackIcon />
          </CircleButton>
        </div>
      )}
      <h1 className={styles.title}>{title}</h1>
      {children}
    </ScrollArea>
  );
}

/** A labelled group of settings, with an optional note under it. */
export function Section({ label, note, children }: { label: string; note?: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className="label">{label}</h2>
      {children}
      {note && <p className={styles.note}>{note}</p>}
    </section>
  );
}
