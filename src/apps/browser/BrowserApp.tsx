import { useState } from 'react';
import { CircleButton } from '../../components/CircleButton';
import { BackIcon, PinIcon, ShareIcon } from '../../components/glyphs';
import { AppShell, EmptyState, Row, SearchField, Section, SwipeToDelete } from '../../components/kit';
import { useOnline } from '../../system/useOnline';
import styles from './Browser.module.css';

interface Saved {
  title: string;
  url: string;
}

const STORAGE_KEY = 'vantage.browser.v1';

function load(): { bookmarks: Saved[]; history: Saved[] } {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    return { bookmarks: saved.bookmarks ?? [], history: saved.history ?? [] };
  } catch {
    return { bookmarks: [], history: [] };
  }
}

/** Turns what you typed into an address: a web address as is, anything else a search. */
function toUrl(input: string): string {
  const text = input.trim();
  if (/^https?:\/\//i.test(text)) return text;
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(text)) return `https://${text}`;
  return `https://duckduckgo.com/?q=${encodeURIComponent(text)}`;
}

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

/**
 * Browser: a start page with your bookmarks and history. Pages open inside
 * Vantage; many big sites refuse to be shown inside another app, so
 * "Open in Safari" is always one tap away.
 */
export function BrowserApp() {
  const online = useOnline();
  const [data, setData] = useState(load);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState<string | null>(null);

  const save = (next: typeof data) => {
    setData(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Kept until reload.
    }
  };

  const open = (input: string) => {
    if (!input.trim()) return;
    const url = toUrl(input);
    setPage(url);
    save({ ...data, history: [{ title: hostOf(url), url }, ...data.history.filter((item) => item.url !== url)].slice(0, 30) });
  };

  if (page) {
    const saved = data.bookmarks.some((item) => item.url === page);
    return (
      <AppShell
        fixed
        leading={
          <CircleButton small label="Start page" onClick={() => setPage(null)}>
            <BackIcon />
          </CircleButton>
        }
        trailing={
          <>
            <CircleButton
              small
              label={saved ? 'Remove bookmark' : 'Bookmark'}
              onClick={() =>
                save({ ...data, bookmarks: saved ? data.bookmarks.filter((item) => item.url !== page) : [...data.bookmarks, { title: hostOf(page), url: page }] })
              }
            >
              <span className={saved ? styles.saved : undefined}>
                <PinIcon />
              </span>
            </CircleButton>
            <CircleButton small label="Open in Safari" onClick={() => window.open(page, '_blank', 'noopener')}>
              <ShareIcon />
            </CircleButton>
          </>
        }
      >
        <span className={`label ${styles.host}`}>{hostOf(page)}</span>
        <iframe className={styles.frame} src={page} title={hostOf(page)} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" referrerPolicy="no-referrer" />
        <span className={styles.hint}>Blank page? This site doesn't allow being shown inside apps: use Open in Safari (top right).</span>
      </AppShell>
    );
  }

  return (
    <AppShell title="Browser" header={<SearchField value={query} onChange={setQuery} onSubmit={open} placeholder="Search or type an address" />}>
      {!online && <EmptyState kind="error" title="Offline" message="Connect to the internet to browse." />}
      {data.bookmarks.length > 0 && (
        <Section label="Bookmarks">
          {data.bookmarks.map((item) => (
            <SwipeToDelete key={item.url} onDelete={() => save({ ...data, bookmarks: data.bookmarks.filter((b) => b.url !== item.url) })}>
              <Row title={item.title} detail={item.url} onPress={() => open(item.url)} />
            </SwipeToDelete>
          ))}
        </Section>
      )}
      {data.history.length > 0 ? (
        <Section label="Recently visited" note="Swipe left to forget one.">
          {data.history.slice(0, 12).map((item) => (
            <SwipeToDelete key={item.url} onDelete={() => save({ ...data, history: data.history.filter((h) => h.url !== item.url) })}>
              <Row title={item.title} detail={item.url} onPress={() => open(item.url)} />
            </SwipeToDelete>
          ))}
        </Section>
      ) : (
        online && data.bookmarks.length === 0 && <EmptyState title="Where to?" message="Type an address or something to search for." />
      )}
    </AppShell>
  );
}
