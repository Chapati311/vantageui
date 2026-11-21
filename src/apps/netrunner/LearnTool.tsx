import { useState } from 'react';
import { Row, Section } from '../../components/kit';
import { CheckIcon } from '../../components/glyphs';
import styles from './Netrunner.module.css';

const PLACES = [
  { id: 'bandit', name: 'OverTheWire: Bandit', url: 'https://overthewire.org/wargames/bandit/', levels: 34, note: 'Linux and SSH basics, one level at a time. Start here.' },
  { id: 'pico', name: 'picoCTF', url: 'https://play.picoctf.org/practice', levels: 50, note: 'Beginner Capture-the-Flag puzzles from Carnegie Mellon.' },
  { id: 'thm', name: 'TryHackMe', url: 'https://tryhackme.com/hacktivities', levels: 30, note: 'Guided rooms in the browser: networking, web, Linux.' },
  { id: 'htb', name: 'Hack The Box Academy', url: 'https://academy.hackthebox.com/', levels: 20, note: 'Structured modules; the free tier covers the fundamentals.' },
  { id: 'natas', name: 'OverTheWire: Natas', url: 'https://overthewire.org/wargames/natas/', levels: 34, note: 'Web security, after Bandit.' },
];
const KEY = 'netrunner.learn.v1';

interface Progress {
  done: Record<string, number>;
  notes: string;
}

function load(): Progress {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Progress>;
    return { done: saved.done ?? {}, notes: saved.notes ?? '' };
  } catch {
    return { done: {}, notes: '' };
  }
}

/** 12. Learn: legal places to practise hacking, your progress, and notes for writeups. */
export function LearnTool() {
  const [progress, setProgress] = useState<Progress>(load);
  const update = (next: Progress) => {
    setProgress(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // kept until reload
    }
  };
  return (
    <>
      <p className={styles.note}>Only hack what you own or have permission for. These sites are built for practice, so everything there is allowed.</p>
      {PLACES.map((place) => {
        const done = progress.done[place.id] ?? 0;
        return (
          <Section key={place.id} label={place.name} note={place.note}>
            <Row title="Open" detail={place.url.replace(/^https:\/\//, '')} onPress={() => window.open(place.url, '_blank')} />
            <Row
              title={`Level ${done} of ${place.levels}`}
              detail={done >= place.levels ? 'Finished!' : 'Tap + when you finish a level'}
              icon={done >= place.levels ? <CheckIcon /> : undefined}
              trailing={
                <span className={styles.chips}>
                  <button type="button" className={styles.chip} aria-label={`${place.name}: one level back`} onClick={() => update({ ...progress, done: { ...progress.done, [place.id]: Math.max(0, done - 1) } })}>
                    −
                  </button>
                  <button type="button" className={styles.chip} aria-label={`${place.name}: level done`} onClick={() => update({ ...progress, done: { ...progress.done, [place.id]: Math.min(place.levels, done + 1) } })}>
                    +
                  </button>
                </span>
              }
            />
            <div className={styles.meter} style={{ margin: '0 var(--space-16) var(--space-16)' }}>
              <span style={{ width: `${(done / place.levels) * 100}%` }} />
            </div>
          </Section>
        );
      })}
      <Section label="Notes and writeups" note="Saved on this phone.">
        <textarea className={styles.textarea} value={progress.notes} onChange={(e) => update({ ...progress, notes: e.target.value })} placeholder="bandit0 -> bandit1: the password was in the file ~/readme" aria-label="Notes" />
      </Section>
    </>
  );
}
