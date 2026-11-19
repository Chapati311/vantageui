import type { ReactNode } from 'react';
import styles from './Notes.module.css';

/**
 * A tiny, safe markdown reader for notes (no HTML is ever injected):
 * # heading, ## smaller heading, - or * list, 1. numbered list,
 * [ ] / [x] to-do, > quote, **bold**, *italic*, `code`, --- line.
 */

/** Bold, italic and code inside one line. */
function inline(text: string, key: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let n = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    const k = `${key}-${n++}`;
    if (token.startsWith('**')) parts.push(<strong key={k}>{token.slice(2, -2)}</strong>);
    else if (token.startsWith('`')) parts.push(<code key={k}>{token.slice(1, -1)}</code>);
    else parts.push(<em key={k}>{token.slice(1, -1)}</em>);
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: ReactNode[] } | null = null;
  const flush = () => {
    if (!list) return;
    const key = `list-${blocks.length}`;
    blocks.push(list.ordered ? <ol key={key}>{list.items}</ol> : <ul key={key}>{list.items}</ul>);
    list = null;
  };

  text.split('\n').forEach((raw, index) => {
    const line = raw.trimEnd();
    const key = `l${index}`;
    let match: RegExpExecArray | null;
    if ((match = /^\s*[-*]\s+\[( |x|X)\]\s+(.*)$/.exec(line))) {
      flush();
      blocks.push(
        <p key={key} className={styles.mdTodo}>
          <span className={`${styles.mdBox} ${match[1] !== ' ' ? styles.mdBoxDone : ''}`} aria-hidden="true" />
          <span className={match[1] !== ' ' ? styles.mdDone : ''}>{inline(match[2], key)}</span>
        </p>,
      );
    } else if ((match = /^\s*([-*]|\d+\.)\s+(.*)$/.exec(line))) {
      const ordered = /\d/.test(match[1]);
      if (!list || list.ordered !== ordered) {
        flush();
        list = { ordered, items: [] };
      }
      list.items.push(<li key={key}>{inline(match[2], key)}</li>);
    } else {
      flush();
      if ((match = /^(#{1,3})\s+(.*)$/.exec(line))) {
        const Tag = (['h2', 'h3', 'h4'] as const)[match[1].length - 1];
        blocks.push(<Tag key={key}>{inline(match[2], key)}</Tag>);
      } else if (/^-{3,}$/.test(line.trim())) blocks.push(<hr key={key} />);
      else if ((match = /^>\s?(.*)$/.exec(line))) blocks.push(<blockquote key={key}>{inline(match[1], key)}</blockquote>);
      else if (line.trim()) blocks.push(<p key={key}>{inline(line, key)}</p>);
    }
  });
  flush();

  return <div className={styles.markdown}>{blocks.length ? blocks : <p className={styles.mdEmpty}>Nothing written yet.</p>}</div>;
}
