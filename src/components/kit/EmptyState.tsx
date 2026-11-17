import type { ComponentType } from 'react';
import { WarningIcon } from '../glyphs';
import { Button } from './Button';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  /**
   * 'empty': nothing here yet. 'loading': waiting for data (three dots light up
   * in turn). 'error': something failed, usually with a "Try again" action.
   */
  kind?: 'empty' | 'loading' | 'error';
  /** One or two big serif words, e.g. "No notes" */
  title: string;
  /** One short sentence: what this is, or what to do */
  message?: string;
  /** A line-art glyph above the title */
  icon?: ComponentType;
  /** One button, e.g. "New note" or "Try again" */
  action?: { label: string; onPress: () => void };
}

/** What an app shows when there is nothing to show: empty, loading or failed. */
export function EmptyState({ kind = 'empty', title, message, icon, action }: EmptyStateProps) {
  const Glyph = icon ?? (kind === 'error' ? WarningIcon : undefined);
  return (
    <div className={styles.state} role={kind === 'error' ? 'alert' : 'status'} aria-busy={kind === 'loading'}>
      {kind === 'loading' ? (
        <span className={styles.dots} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      ) : (
        Glyph && (
          <span className={`${styles.icon} ${kind === 'error' ? styles.error : ''}`}>
            <Glyph />
          </span>
        )
      )}
      <h2 className={styles.title}>{title}</h2>
      {message && <p className={styles.message}>{message}</p>}
      {action && (
        <div className={styles.action}>
          <Button onPress={action.onPress}>{action.label}</Button>
        </div>
      )}
    </div>
  );
}
