import { useEffect, useRef } from 'react';
import type { ToolLine } from '../../system/rootTools';
import styles from './Netrunner.module.css';

/**
 * The live terminal under every tool ("raw terminal output", HACKER_MODE 2):
 * what the real program printed, line by line, scrolled to the newest line,
 * with Stop while it runs and Copy when it's done.
 */
export function Output({
  title,
  lines,
  running,
  code,
  onStop,
  empty = 'Nothing yet.',
}: {
  title: string;
  lines: ToolLine[];
  running: boolean;
  code: number | null;
  onStop?: () => void;
  empty?: string;
}) {
  const body = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  useEffect(() => {
    const element = body.current;
    if (element && stick.current) element.scrollTop = element.scrollHeight;
  }, [lines]);

  const copy = () => void navigator.clipboard?.writeText(lines.map((line) => line.text).join('\n')).catch(() => {});
  return (
    <div className={styles.terminal}>
      <div className={styles.terminalHead}>
        <span>
          $ {title}
          {code !== null && !running && <span className={code === 0 ? styles.good : styles.warn}> · exit {code}</span>}
        </span>
        {running && onStop ? (
          <button type="button" className={`${styles.smallButton} hit-44`} onClick={onStop}>
            Stop
          </button>
        ) : lines.length > 0 ? (
          <button type="button" className={`${styles.smallButton} hit-44`} onClick={copy}>
            Copy
          </button>
        ) : null}
      </div>
      <div
        ref={body}
        className={styles.terminalBody}
        onScroll={(event) => {
          const element = event.currentTarget;
          stick.current = element.scrollHeight - element.scrollTop - element.clientHeight < 24;
        }}
      >
        {lines.length === 0 && !running && <span className={styles.dim}>{empty}</span>}
        {lines.map((line, index) => (
          <div key={index} className={line.kind === 'err' ? styles.err : undefined}>
            {line.text || ' '}
          </div>
        ))}
        {running && <span className={styles.cursor} />}
      </div>
    </div>
  );
}
