import { useEffect, useState } from 'react';
import { Button, Row, Section } from '../../components/kit';
import { ShareIcon } from '../../components/glyphs';
import { useControls } from '../../system/phoneControls';
import { askTool, hasRootTools, formatBytes } from '../../system/rootTools';
import { rate, sparkPath, useLiveStats } from './netStats';
import styles from './Netrunner.module.css';

interface PublicIp {
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  org?: string;
  timezone?: string;
}

/** 1. My Connection: everything about how this phone is online right now. */
export function ConnectionTool() {
  const live = useLiveStats();
  const controls = useControls();
  const [router, setRouter] = useState<string | null>(null);
  const [dns, setDns] = useState<string[]>([]);
  const [pub, setPub] = useState<PublicIp | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const [routes, lookup, ip] = await Promise.all([askTool('run', 'routes'), askTool('run', 'dns', ['apple.com', 'A']), askTool('run', 'publicip')]);
      const line = routes.out.find((l) => /^default\s+\d/.test(l) && /en0/.test(l)) ?? routes.out.find((l) => /^default\s+\d/.test(l));
      setRouter(line?.split(/\s+/)[1] ?? null);
      setDns(((lookup.data as { servers?: string[] } | null)?.servers ?? []).filter((ip) => ip && ip !== '0.0.0.0'));
      try {
        setPub(JSON.parse(ip.out.join('')) as PublicIp);
      } catch {
        setPub(null);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  };
  useEffect(() => {
    if (hasRootTools()) void load();
  }, []);

  const en0 = live.stats?.interfaces.en0;
  const cell = live.stats?.interfaces.pdp_ip0;
  const wifi = controls.wifi;
  const card = [
    `Network: ${wifi?.on ? wifi.network ?? 'Wi-Fi' : 'not on Wi-Fi'}`,
    `Local IP: ${en0?.ipv4 ?? '-'}`,
    `Router: ${router ?? '-'}`,
    `DNS: ${dns.join(', ') || '-'}`,
    `Public IP: ${pub?.ip ?? '-'}${pub?.country ? ` (${pub.city ?? ''} ${pub.country}, ${pub.org ?? ''})` : ''}`,
  ].join('\n');
  const share = () => {
    if (navigator.share) void navigator.share({ title: 'My connection', text: card }).catch(() => {});
    else void navigator.clipboard?.writeText(card);
  };

  if (!hasRootTools()) return <p className={styles.note}>My Connection reads the phone itself: it works on the jailbroken iPhone running Vantage OS.</p>;
  const downs = live.history.map((h) => h.down);
  const ups = live.history.map((h) => h.up);
  const max = Math.max(1, ...downs, ...ups);
  return (
    <>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className="label">Down</span>
          <span className={styles.statValue}>{rate(live.down)}</span>
        </div>
        <div className={styles.stat}>
          <span className="label">Up</span>
          <span className={styles.statValue}>{rate(live.up)}</span>
        </div>
        <div className={styles.stat}>
          <span className="label">Signal</span>
          <span className={styles.statValue}>{wifi?.on && wifi.bars !== undefined ? `${'▮'.repeat(wifi.bars)}${'▯'.repeat(Math.max(0, 3 - wifi.bars))}` : '-'}</span>
        </div>
      </div>
      <svg className={styles.graph} viewBox="0 0 300 96" preserveAspectRatio="none" aria-label="Traffic, last 2 minutes">
        <path d={sparkPath(downs, 300, 96, max)} fill="none" stroke="var(--color-accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <path d={sparkPath(ups, 300, 96, max)} fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
      </svg>
      <Section label="Wi-Fi">
        <Row title="Network" value={wifi?.on ? wifi.network ?? 'Connected' : 'Not on Wi-Fi'} />
        <Row title="Local IP" value={<span className={styles.mono}>{en0?.ipv4 ?? '-'}</span>} />
        <Row title="Subnet mask" value={<span className={styles.mono}>{en0?.netmask ?? '-'}</span>} />
        <Row title="Router" value={<span className={styles.mono}>{router ?? '…'}</span>} />
        <Row title="DNS servers" value={<span className={styles.mono}>{dns.join(', ') || '…'}</span>} />
        <Row title="IPv6" value={<span className={styles.mono}>{en0?.ipv6 ?? 'none'}</span>} />
        <Row title="Traffic since boot" value={<span className={styles.mono}>↓ {formatBytes(en0?.rx ?? 0)} ↑ {formatBytes(en0?.tx ?? 0)}</span>} />
      </Section>
      <Section label="Internet" note="The public IP lookup asks ipinfo.io (it sees your public IP, like every website does).">
        <Row title="Public IP" value={<span className={styles.mono}>{pub?.ip ?? '…'}</span>} />
        <Row title="Location" value={pub ? [pub.city, pub.region, pub.country].filter(Boolean).join(', ') : '…'} />
        <Row title="Provider" value={pub?.org?.replace(/^AS\d+\s*/, '') ?? '…'} />
        {cell?.ipv4 && <Row title="Mobile data IP" value={<span className={styles.mono}>{cell.ipv4}</span>} />}
      </Section>
      {error && <p className={`${styles.note} ${styles.bad}`}>{error}</p>}
      <div className={styles.inputRow}>
        <Button wide onPress={() => void load()}>
          Refresh
        </Button>
        <Button wide icon={ShareIcon} onPress={share}>
          Share card
        </Button>
      </div>
    </>
  );
}
