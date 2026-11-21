import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Row, Section, Sheet } from '../../components/kit';
import { askTool, hasRootTools, isPrivateIp } from '../../system/rootTools';
import styles from './Netrunner.module.css';

interface Endpoint {
  ip: string;
  port: number;
  seen: number; // how many checks it was connected in
  first: number;
  last: number;
}

interface AppTraffic {
  process: string;
  endpoints: Record<string, Endpoint>;
}

interface Owner {
  org: string;
  country: string;
  city: string;
}

/** Companies whose main business is ads, analytics or tracking (matched on the network owner's name). */
const TRACKERS = /facebook|meta platforms|appsflyer|adjust|branch metrics|amplitude|mixpanel|criteo|applovin|unity technologies|ironsource|bytedance|tiktok|doubleclick|google ads|taboola|outbrain|moloco|liftoff|vungle|chartboost|inmobi|segment\.io|braze|onesignal|sentry|bugsnag|crashlytics|newrelic|datadog/i;

const owners = new Map<string, Promise<Owner>>();
function ownerOf(ip: string): Promise<Owner> {
  if (isPrivateIp(ip) || ip.startsWith('127.') || ip === '::1') return Promise.resolve({ org: 'Your own network', country: '', city: '' });
  if (!owners.has(ip))
    owners.set(
      ip,
      fetch(`https://ipinfo.io/${ip}/json`)
        .then((r) => r.json() as Promise<{ org?: string; country?: string; city?: string }>)
        .then((j) => ({ org: (j.org ?? 'Unknown').replace(/^AS\d+\s*/, ''), country: j.country ?? '', city: j.city ?? '' }))
        .catch(() => ({ org: 'Unknown', country: '', city: '' })),
    );
  return owners.get(ip)!;
}

/** "apsd 86 mobile 14u IPv4 0x.. 0t0 TCP 192.168.1.238:49207->17.57.146.146:5223 (ESTABLISHED)" */
function parse(lines: string[]): { process: string; ip: string; port: number }[] {
  const out: { process: string; ip: string; port: number }[] = [];
  for (const line of lines) {
    const m = line.match(/^(\S+)\s+\d+\s+\S+.*?(?:TCP|UDP)\s+\S+->\[?([0-9a-f.:]+?)\]?:(\d+)/i);
    if (m && !line.includes('(LISTEN)')) out.push({ process: m[1].replace(/\\x20/g, ' '), ip: m[2], port: Number(m[3]) });
  }
  return out;
}

/**
 * 6. Privacy Monitor: which apps on this phone talk to which servers, how
 * often, who owns those servers, and where they are. Trackers stand out.
 * (iOS doesn't count bytes per connection for lsof, so "how much" is how often
 * and how long an app keeps talking.)
 */
export function PrivacyTool() {
  const [apps, setApps] = useState<Record<string, AppTraffic>>({});
  const [watching, setWatching] = useState(false);
  const [checks, setChecks] = useState(0);
  const [info, setInfo] = useState<Record<string, Owner>>({});
  const [open, setOpen] = useState<AppTraffic | null>(null);
  const timer = useRef(0);

  const check = async () => {
    const answer = await askTool('run', 'connections').catch(() => null);
    if (!answer) return;
    const now = Date.now();
    const found = parse(answer.out);
    setApps((before) => {
      const next = { ...before };
      for (const c of found) {
        const app = (next[c.process] = next[c.process] ? { ...next[c.process], endpoints: { ...next[c.process].endpoints } } : { process: c.process, endpoints: {} });
        const key = `${c.ip}:${c.port}`;
        const e = app.endpoints[key];
        app.endpoints[key] = e ? { ...e, seen: e.seen + 1, last: now } : { ip: c.ip, port: c.port, seen: 1, first: now, last: now };
      }
      return next;
    });
    setChecks((n) => n + 1);
    for (const c of found) if (!info[c.ip]) void ownerOf(c.ip).then((o) => setInfo((m) => (m[c.ip] ? m : { ...m, [c.ip]: o })));
  };

  useEffect(() => {
    if (!watching) return;
    void check();
    timer.current = window.setInterval(() => void check(), 5000);
    return () => window.clearInterval(timer.current);
  }, [watching]); // eslint-disable-line react-hooks/exhaustive-deps

  const ranked = useMemo(
    () =>
      Object.values(apps)
        .map((a) => {
          const endpoints = Object.values(a.endpoints);
          return { app: a, talks: endpoints.reduce((s, e) => s + e.seen, 0), servers: endpoints.length, trackers: endpoints.filter((e) => TRACKERS.test(info[e.ip]?.org ?? '')).length };
        })
        .sort((x, y) => y.talks - x.talks),
    [apps, info],
  );
  const countries = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(apps).forEach((a) => Object.values(a.endpoints).forEach((e) => {
      const c = info[e.ip]?.country;
      if (c) counts[c] = (counts[c] ?? 0) + 1;
    }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [apps, info]);
  const trackerTotal = ranked.reduce((s, r) => s + r.trackers, 0);

  if (!hasRootTools()) return <p className={styles.note}>The Privacy Monitor watches this phone's own connections: it runs on the jailbroken iPhone running Vantage OS.</p>;
  return (
    <>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className="label">Apps</span>
          <span className={styles.statValue}>{ranked.length}</span>
        </div>
        <div className={styles.stat}>
          <span className="label">Servers</span>
          <span className={styles.statValue}>{ranked.reduce((s, r) => s + r.servers, 0)}</span>
        </div>
        <div className={styles.stat}>
          <span className="label">Trackers</span>
          <span className={`${styles.statValue} ${trackerTotal ? styles.bad : ''}`}>{trackerTotal}</span>
        </div>
      </div>
      <Button kind="primary" wide onPress={() => setWatching((w) => !w)}>
        {watching ? `Watching… (${checks} checks) · Stop` : 'Start watching'}
      </Button>
      <p className={styles.note}>Checks every 5 seconds which apps have connections open. Leave it running and use your apps; server owners come from ipinfo.io.</p>
      {ranked.length > 0 && (
        <Section label="Who talks the most">
          {ranked.map(({ app, talks, servers, trackers }) => (
            <Row key={app.process} title={app.process} detail={`${servers} server${servers === 1 ? '' : 's'}${trackers ? ` · ${trackers} tracker${trackers === 1 ? '' : 's'}` : ''}`} value={`${talks}×`} onPress={() => setOpen(app)} />
          ))}
        </Section>
      )}
      {countries.length > 0 && (
        <Section label="Where the data goes">
          {countries.map(([country, n]) => (
            <Row key={country} title={country} value={`${n} server${n === 1 ? '' : 's'}`} />
          ))}
        </Section>
      )}
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.process}>
        {open && (
          <Section>
            {Object.values(open.endpoints)
              .sort((a, b) => b.seen - a.seen)
              .map((e) => {
                const o = info[e.ip];
                const tracker = TRACKERS.test(o?.org ?? '');
                return (
                  <Row
                    key={`${e.ip}:${e.port}`}
                    title={<span className={tracker ? styles.bad : undefined}>{o?.org ?? 'looking up…'}{tracker ? ' · tracker' : ''}</span>}
                    detail={<span className={styles.mono}>{`${e.ip}:${e.port}${o?.country ? ` · ${o.city ? `${o.city}, ` : ''}${o.country}` : ''}`}</span>}
                    value={`${e.seen}×`}
                  />
                );
              })}
          </Section>
        )}
      </Sheet>
    </>
  );
}
