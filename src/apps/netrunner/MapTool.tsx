import { useEffect, useMemo, useState } from 'react';
import { Button, Row, Section, Sheet } from '../../components/kit';
import { pushNotification } from '../../system/notifications';
import { useControls } from '../../system/phoneControls';
import { askTool, cidrOf, hasRootTools, runTool, useToolRun } from '../../system/rootTools';
import { useLiveStats } from './netStats';
import { normalizeMac, PORT_NAMES, vendorOf } from './oui';
import { Output } from './Output';
import styles from './Netrunner.module.css';

interface Device {
  ip: string;
  mac?: string;
  name?: string;
  vendor: string;
  firstSeen: number;
  lastSeen: number;
}

const TRUSTED_KEY = 'netrunner.trusted.v1';
const DEVICES_KEY = 'netrunner.devices.v1';

function load<T>(key: string, fallback: T): T {
  try {
    return (JSON.parse(localStorage.getItem(key) ?? 'null') as T) ?? fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: kept until reload
  }
}

/**
 * 2. Network Map (MY network only): who is on this Wi-Fi, as a live node
 * graph. Scanning needs a one-time "this is my network" confirmation per
 * Wi-Fi name; port scans only ever go to devices on it (the helper refuses
 * anything else).
 */
export function MapTool() {
  const live = useLiveStats();
  const controls = useControls();
  const ssid = controls.wifi?.on ? controls.wifi.network ?? 'this Wi-Fi' : null;
  const en0 = live.stats?.interfaces.en0;
  const cidr = en0?.ipv4 && en0.netmask ? cidrOf(en0.ipv4, en0.netmask) : null;
  const [trusted, setTrusted] = useState<string[]>(() => load(TRUSTED_KEY, []));
  const [all, setAll] = useState<Record<string, Record<string, Device>>>(() => load(DEVICES_KEY, {}));
  const [scanning, setScanning] = useState(false);
  const [fresh, setFresh] = useState<string[]>([]);
  const [selected, setSelected] = useState<Device | null>(null);
  const [router, setRouter] = useState<string | null>(null);
  const devices = useMemo(() => Object.values((ssid && all[ssid]) || {}).sort((a, b) => ipNum(a.ip) - ipNum(b.ip)), [all, ssid]);
  const isTrusted = !!ssid && trusted.includes(ssid);

  useEffect(() => {
    if (!hasRootTools()) return;
    void askTool('run', 'routes').then((routes) => {
      const line = routes.out.find((l) => /^default\s+\d/.test(l) && /en0/.test(l));
      setRouter(line?.split(/\s+/)[1] ?? null);
    });
  }, []);

  const scan = async () => {
    if (!cidr || !ssid) return;
    setScanning(true);
    const up = new Set<string>();
    await runTool('sweep', [cidr], (line) => {
      const match = line.text.match(/^Host:\s+(\d+\.\d+\.\d+\.\d+).*Status:\s+Up/);
      if (match) up.add(match[1]);
    }).done;
    const arp = await askTool('run', 'arp').catch(() => null);
    const macs = new Map<string, string>();
    arp?.out.forEach((line) => {
      const match = line.match(/\((\d+\.\d+\.\d+\.\d+)\) at ([0-9a-f:]+) on en0/i);
      if (match) {
        macs.set(match[1], normalizeMac(match[2]));
        up.add(match[1]);
      }
    });
    if (en0?.ipv4) up.add(en0.ipv4);
    const now = Date.now();
    const known = { ...((ssid && all[ssid]) || {}) };
    const added: string[] = [];
    for (const ip of up) {
      const mac = macs.get(ip);
      const key = mac ?? ip;
      const before = known[key];
      if (!before) added.push(ip);
      known[key] = { ip, mac, name: before?.name ?? (ip === en0?.ipv4 ? 'This iPhone' : ip === router ? 'Router' : undefined), vendor: vendorOf(mac), firstSeen: before?.firstSeen ?? now, lastSeen: now };
    }
    const next = { ...all, [ssid]: known };
    setAll(next);
    save(DEVICES_KEY, next);
    // A device never seen on this network before: say so (not on the very first scan)
    if (devices.length && added.length) {
      setFresh(added);
      pushNotification({ appId: 'netrunner', title: `New device on ${ssid}`, body: added.map((ip) => `${ip} (${vendorOf(macs.get(ip))})`).join(', ') });
    }
    setScanning(false);
  };

  const rename = (device: Device, name: string) => {
    if (!ssid) return;
    const key = device.mac ?? device.ip;
    const next = { ...all, [ssid]: { ...all[ssid], [key]: { ...device, name: name.trim() || undefined } } };
    setAll(next);
    save(DEVICES_KEY, next);
  };

  if (!hasRootTools()) return <p className={styles.note}>The network map scans your Wi-Fi from the jailbroken iPhone running Vantage OS.</p>;
  if (!ssid) return <p className={styles.note}>Join a Wi-Fi network first: the map only looks at the network the phone is on.</p>;
  if (!isTrusted)
    return (
      <Section label="Your network?" note="Scanning a network you don't own or have permission to test can be illegal. Netrunner only ever scans the Wi-Fi the phone is on, and only after you confirm it here.">
        <Row title={ssid} detail={cidr ? `Range ${cidr}` : 'Reading the address range…'} />
        <Row
          title="Yes, this is my network"
          detail="Or I have permission to test it"
          onPress={() => {
            const next = [...trusted, ssid];
            setTrusted(next);
            save(TRUSTED_KEY, next);
          }}
        />
      </Section>
    );

  return (
    <>
      <NetworkGraph devices={devices} me={en0?.ipv4} router={router} fresh={fresh} scanning={scanning} onSelect={setSelected} />
      <div className={styles.inputRow}>
        <Button kind="primary" wide disabled={scanning || !cidr} onPress={() => void scan()}>
          {scanning ? 'Scanning…' : devices.length ? 'Scan again' : 'Scan my network'}
        </Button>
      </div>
      <Section label={`${devices.length} device${devices.length === 1 ? '' : 's'} on ${ssid}`} note={cidr ? `Range ${cidr}. Tap a device to name it or see its open ports.` : undefined}>
        {devices.length === 0 && <Row title="No scan yet" detail="Scan to see who is on your Wi-Fi" />}
        {devices.map((device) => (
          <Row
            key={device.mac ?? device.ip}
            title={device.name ?? device.vendor}
            detail={`${device.ip}${device.mac ? ` · ${device.mac}` : ''}${fresh.includes(device.ip) ? ' · NEW' : ''}`}
            value={timeAgo(device.lastSeen)}
            onPress={() => setSelected(device)}
          />
        ))}
      </Section>
      <DeviceSheet device={selected} me={en0?.ipv4} onClose={() => setSelected(null)} onRename={rename} />
    </>
  );
}

function DeviceSheet({ device, me, onClose, onRename }: { device: Device | null; me?: string; onClose: () => void; onRename: (device: Device, name: string) => void }) {
  const run = useToolRun();
  const [name, setName] = useState('');
  useEffect(() => setName(device?.name ?? ''), [device]);
  const ports = run.lines
    .flatMap((line) => [...line.text.matchAll(/(\d+)\/open\/(tcp|udp)\/\/([^/]*)\/\/([^/]*)\//g)])
    .map((m) => ({ port: Number(m[1]), service: m[3], version: m[4] }));
  return (
    <Sheet open={!!device} onClose={onClose} title={device?.name ?? device?.vendor ?? 'Device'}>
      {device && (
        <>
          <div className={styles.inputRow}>
            <input
              className={styles.input}
              placeholder="Name it (Mom's laptop, TV…)"
              aria-label="Device name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onBlur={() => onRename(device, name)}
            />
          </div>
          <Section>
            <Row title="Address" value={<span className={styles.mono}>{device.ip}</span>} />
            <Row title="MAC" value={<span className={styles.mono}>{device.mac ?? 'unknown'}</span>} />
            <Row title="Maker" detail={device.vendor} />
            <Row title="First seen" value={new Date(device.firstSeen).toLocaleString()} />
            <Row title="Last seen" value={new Date(device.lastSeen).toLocaleString()} />
          </Section>
          {device.ip !== me && (
            <div className={styles.inputRow}>
              <Button wide disabled={run.running} onPress={() => void run.start('ports', [device.ip])}>
                Open ports
              </Button>
              <Button wide disabled={run.running} onPress={() => void run.start('services', [device.ip])}>
                Services
              </Button>
            </div>
          )}
          {ports.length > 0 && (
            <Section label={`${ports.length} open port${ports.length === 1 ? '' : 's'}`}>
              {ports.map((p) => (
                <Row key={p.port} title={`${p.port} ${p.service}`} detail={p.version || PORT_NAMES[p.port] || 'Unknown service'} />
              ))}
            </Section>
          )}
          {(run.running || run.lines.length > 0) && <Output title={`nmap ${device.ip}`} lines={run.lines} running={run.running} code={run.code} onStop={run.stop} />}
          {!run.running && run.code === 0 && ports.length === 0 && <p className={styles.note}>No open common ports: good.</p>}
        </>
      )}
    </Sheet>
  );
}

/** The map: router in the middle, this phone highlighted, everyone else around it. */
function NetworkGraph({ devices, me, router, fresh, scanning, onSelect }: { devices: Device[]; me?: string; router: string | null; fresh: string[]; scanning: boolean; onSelect: (d: Device) => void }) {
  const others = devices.filter((d) => d.ip !== router);
  const hub = devices.find((d) => d.ip === router);
  const C = 150;
  return (
    <svg className={styles.map} viewBox="0 0 300 300" role="img" aria-label={`Network map: ${devices.length} devices`}>
      {[60, 100, 135].map((r) => (
        <circle key={r} cx={C} cy={C} r={r} fill="none" stroke="var(--color-hairline)" strokeDasharray="2 5" />
      ))}
      {scanning && (
        <g style={{ transformOrigin: '150px 150px' }}>
          <path d="M150 150 L150 15 A135 135 0 0 1 245 55 Z" fill="rgb(var(--accent-rgb) / 0.14)">
            <animateTransform attributeName="transform" type="rotate" from="0 150 150" to="360 150 150" dur="2.4s" repeatCount="indefinite" />
          </path>
        </g>
      )}
      {others.map((d, i) => {
        const angle = (i / Math.max(1, others.length)) * Math.PI * 2 - Math.PI / 2;
        const ring = i % 2 ? 100 : 128;
        const x = C + Math.cos(angle) * ring;
        const y = C + Math.sin(angle) * ring;
        const mine = d.ip === me;
        const isNew = fresh.includes(d.ip);
        return (
          <g key={d.mac ?? d.ip} className={styles.node} onClick={() => onSelect(d)} role="button" aria-label={`${d.name ?? d.vendor}, ${d.ip}`}>
            <line x1={C} y1={C} x2={x} y2={y} stroke={mine ? 'var(--color-accent)' : 'var(--color-hairline)'} strokeWidth={mine ? 1.5 : 1} />
            {isNew && <circle className={styles.pulse} cx={x} cy={y} r={9} fill="none" stroke="var(--color-accent)" />}
            <circle cx={x} cy={y} r={mine ? 9 : 7} fill={mine ? 'var(--color-accent)' : 'var(--surface-raised, #1f2730)'} stroke="var(--text-secondary)" strokeWidth="1" />
            <text x={x} y={y + 20} textAnchor="middle" fontSize="9" fill="var(--text-secondary)" fontFamily="var(--font-mono)">
              {(d.name ?? d.ip.split('.').pop()!).slice(0, 12)}
            </text>
          </g>
        );
      })}
      <g className={styles.node} onClick={() => hub && onSelect(hub)} role="button" aria-label="Router">
        <circle cx={C} cy={C} r={16} fill="var(--color-bg)" stroke="var(--color-accent)" strokeWidth="1.5" />
        <path d="M143 152h14M146 147a6 6 0 0 1 8 0M148.5 150a2.5 2.5 0 0 1 3 0" stroke="var(--color-accent)" fill="none" strokeLinecap="round" />
        <text x={C} y={C + 30} textAnchor="middle" fontSize="9" fill="var(--text-primary)" fontFamily="var(--font-mono)">
          {router ?? 'router'}
        </text>
      </g>
    </svg>
  );
}

function ipNum(ip: string): number {
  return ip.split('.').reduce((sum, part) => sum * 256 + Number(part), 0);
}

function timeAgo(at: number): string {
  const s = Math.round((Date.now() - at) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.round(s / 60)} min`;
  if (s < 86400) return `${Math.round(s / 3600)} h`;
  return `${Math.round(s / 86400)} d`;
}
