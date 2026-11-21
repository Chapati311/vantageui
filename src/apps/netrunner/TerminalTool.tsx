import { useEffect, useRef, useState } from 'react';
import { Row, Section } from '../../components/kit';
import { askTool, hasRootTools, runTool, type ToolLine } from '../../system/rootTools';
import styles from './Netrunner.module.css';

const PALETTE: { label: string; command: string }[] = [
  { label: 'Who am I', command: 'id && uname -a' },
  { label: 'Uptime', command: 'uptime' },
  { label: 'Disk space', command: 'df -h /var /private/preboot 2>/dev/null || df -h' },
  { label: 'Network interfaces', command: 'ifconfig en0' },
  { label: 'Listening services', command: 'lsof -nP -iTCP -sTCP:LISTEN 2>/dev/null || netstat -an -p tcp | grep LISTEN' },
  { label: 'Big files in Downloads', command: 'du -sh /var/mobile/Downloads/* 2>/dev/null | sort -hr | head' },
  { label: 'Installed tweaks', command: 'dpkg -l | grep -i tweak | head -30' },
  { label: 'Open connections', command: 'netstat -an -p tcp | grep ESTABLISHED | head -25' },
  { label: 'Battery', command: 'ioreg -rn AppleSmartBattery 2>/dev/null | grep -E "CurrentCapacity|MaxCapacity|CycleCount" || echo "(no ioreg)"' },
];
const SAVED_KEY = 'netrunner.saved.v1';
const HISTORY_KEY = 'netrunner.history.v1';
const loadList = (key: string): string[] => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as string[];
  } catch {
    return [];
  }
};
const saveList = (key: string, list: string[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // kept until reload
  }
};

interface Entry {
  command: string;
  lines: ToolLine[];
  code: number | null;
}

/**
 * 11. Terminal: a Vantage-styled shell on this phone (as the mobile user,
 * through the root helper), with history, saved commands and a palette.
 * Off unless Settings > Vantage OS > Allow Terminal is on.
 */
export function TerminalTool() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [command, setCommand] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [running, setRunning] = useState<(() => void) | null>(null);
  const [saved, setSaved] = useState<string[]>(() => loadList(SAVED_KEY));
  const [history, setHistory] = useState<string[]>(() => loadList(HISTORY_KEY));
  const [back, setBack] = useState(-1);
  const screen = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasRootTools()) return;
    void askTool('tools')
      .then((a) => setAllowed(!!(a.data as { terminal?: boolean } | null)?.terminal))
      .catch(() => setAllowed(false));
  }, []);
  useEffect(() => {
    screen.current?.scrollTo({ top: screen.current.scrollHeight });
  }, [entries]);

  const run = (text: string) => {
    const cmd = text.trim();
    if (!cmd || running) return;
    if (cmd === 'clear') {
      setEntries([]);
      setCommand('');
      return;
    }
    const nextHistory = [cmd, ...history.filter((h) => h !== cmd)].slice(0, 50);
    setHistory(nextHistory);
    saveList(HISTORY_KEY, nextHistory);
    setBack(-1);
    setCommand('');
    const index = entries.length;
    setEntries((list) => [...list, { command: cmd, lines: [], code: null }]);
    const handle = runTool('shell', [cmd, 120], (line) =>
      setEntries((list) => list.map((e, i) => (i === index ? { ...e, lines: [...e.lines, line].slice(-800) } : e))),
    );
    setRunning(() => handle.cancel);
    void handle.done.then((answer) => {
      setEntries((list) => list.map((e, i) => (i === index ? { ...e, code: answer.code, lines: e.lines.length ? e.lines : answer.err.map((t) => ({ kind: 'err' as const, text: t })) } : e)));
      setRunning(null);
    });
  };

  if (!hasRootTools()) return <p className={styles.note}>The Terminal runs on the jailbroken iPhone running Vantage OS.</p>;
  if (allowed === false)
    return (
      <Section label="Terminal is off" note="It can run any command on this phone (as the mobile user, not root), so it starts off. Turn it on in Settings > Vantage OS > Allow Terminal, then come back.">
        <Row title="Open Settings" onPress={() => (window.location.href = 'App-prefs:')} />
      </Section>
    );
  return (
    <>
      <div className={styles.terminal}>
        <div className={styles.terminalHead}>
          <span>mobile@vantage:~</span>
          {running && (
            <button type="button" className={`${styles.smallButton} hit-44`} onClick={running}>
              ^C
            </button>
          )}
        </div>
        <div ref={screen} className={styles.terminalBody} style={{ maxHeight: '40vh' }}>
          {entries.length === 0 && <span className={styles.dim}>Type a command, or pick one below. "clear" clears.</span>}
          {entries.map((e, i) => (
            <div key={i}>
              <div className={styles.good}>$ {e.command}</div>
              {e.lines.map((l, j) => (
                <div key={j} className={l.kind === 'err' ? styles.err : undefined}>
                  {l.text || ' '}
                </div>
              ))}
              {e.code !== null && e.code !== 0 && <div className={styles.dim}>(exit {e.code})</div>}
            </div>
          ))}
          {running && <span className={styles.cursor} />}
        </div>
      </div>
      <form
        className={styles.inputRow}
        onSubmit={(event) => {
          event.preventDefault();
          run(command);
        }}
      >
        <input
          className={styles.input}
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp' && history.length) {
              const next = Math.min(history.length - 1, back + 1);
              setBack(next);
              setCommand(history[next]);
            }
          }}
          placeholder="$ command"
          aria-label="Command"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
        />
        <button type="submit" className={styles.chip} disabled={!command.trim() || !!running}>
          Run
        </button>
      </form>
      <div className={styles.chips}>
        {command.trim() && !saved.includes(command.trim()) && (
          <button
            type="button"
            className={styles.chip}
            onClick={() => {
              const next = [command.trim(), ...saved].slice(0, 20);
              setSaved(next);
              saveList(SAVED_KEY, next);
            }}
          >
            + Save
          </button>
        )}
        {saved.map((s) => (
          <button key={s} type="button" className={styles.chip} onClick={() => run(s)} onContextMenu={(e) => { e.preventDefault(); const next = saved.filter((x) => x !== s); setSaved(next); saveList(SAVED_KEY, next); }}>
            {s.length > 24 ? `${s.slice(0, 22)}…` : s}
          </button>
        ))}
      </div>
      <Section label="Command palette">
        {PALETTE.map((p) => (
          <Row key={p.label} title={p.label} detail={<span className={styles.mono}>{p.command}</span>} onPress={() => run(p.command)} />
        ))}
      </Section>
      {history.length > 0 && (
        <Section label="History">
          {history.slice(0, 8).map((h) => (
            <Row key={h} title={<span className={styles.mono}>{h}</span>} onPress={() => setCommand(h)} />
          ))}
        </Section>
      )}
    </>
  );
}
