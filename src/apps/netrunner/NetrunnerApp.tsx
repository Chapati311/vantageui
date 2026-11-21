import { useEffect, useState, type ComponentType } from 'react';
import { CircleButton } from '../../components/CircleButton';
import { BackIcon } from '../../components/glyphs';
import { AppShell } from '../../components/kit';
import { Pressable } from '../../components/Pressable';
import { useControls } from '../../system/phoneControls';
import { setNetrunnerTool, useNetrunnerTool } from './netrunnerNav';
import { askTool, hasRootTools } from '../../system/rootTools';
import { BleTool } from './BleTool';
import { ConnectionTool } from './ConnectionTool';
import { DnsTool } from './DnsTool';
import { BluetoothRadarIcon, ConnectionIcon, DnsIcon, LearnIcon, MapIcon, PacketIcon, PingIcon, PrivacyIcon, ShieldIcon, SpeedIcon, TerminalIcon, ToolboxIcon } from './icons';
import { LearnTool } from './LearnTool';
import { MapTool } from './MapTool';
import { rate, useLiveStats } from './netStats';
import { PacketTool } from './PacketTool';
import { PingTool } from './PingTool';
import { PrivacyTool } from './PrivacyTool';
import { SecurityTool } from './SecurityTool';
import { SpeedTool } from './SpeedTool';
import { TerminalTool } from './TerminalTool';
import { ToolboxTool } from './ToolboxTool';
import styles from './Netrunner.module.css';

export type ToolId = 'connection' | 'map' | 'ping' | 'dns' | 'speed' | 'privacy' | 'packets' | 'ble' | 'security' | 'toolbox' | 'terminal' | 'learn';

export const TOOLS: { id: ToolId; name: string; note: string; icon: ComponentType; page: ComponentType }[] = [
  { id: 'connection', name: 'My Connection', note: 'IPs, router, DNS, live traffic', icon: ConnectionIcon, page: ConnectionTool },
  { id: 'map', name: 'Network Map', note: 'Who is on my Wi-Fi', icon: MapIcon, page: MapTool },
  { id: 'ping', name: 'Ping & Trace', note: 'Latency and the route there', icon: PingIcon, page: PingTool },
  { id: 'dns', name: 'DNS & Whois', note: 'Records, owner, certificate', icon: DnsIcon, page: DnsTool },
  { id: 'speed', name: 'Speed Test', note: 'Internet and LAN speed', icon: SpeedIcon, page: SpeedTool },
  { id: 'privacy', name: 'Privacy Monitor', note: "Who's talking to whom", icon: PrivacyIcon, page: PrivacyTool },
  { id: 'packets', name: 'Packet View', note: "This phone's own traffic", icon: PacketIcon, page: PacketTool },
  { id: 'ble', name: 'Bluetooth Radar', note: 'Devices around you', icon: BluetoothRadarIcon, page: BleTool },
  { id: 'security', name: 'Security Check', note: 'Ports, passwords, tweaks', icon: ShieldIcon, page: SecurityTool },
  { id: 'toolbox', name: 'Toolbox', note: 'Encode, hash, JWT, QR…', icon: ToolboxIcon, page: ToolboxTool },
  { id: 'terminal', name: 'Terminal', note: 'A shell on this phone', icon: TerminalIcon, page: TerminalTool },
  { id: 'learn', name: 'Learn', note: 'Legal practice + notes', icon: LearnIcon, page: LearnTool },
];

/**
 * Netrunner (HACKER_MODE.md section 2): real network, privacy and security
 * tools that run on this jailbroken iPhone through the Vantage root helper,
 * built on the jailbreak's own programs (nmap, tcpdump, traceroute, whois,
 * curl, lsof, dpkg). Scans only ever touch your own network.
 */
export function NetrunnerApp() {
  const tool = useNetrunnerTool();
  const setTool = setNetrunnerTool;

  const current = TOOLS.find((t) => t.id === tool);
  if (current) {
    const Page = current.page;
    return (
      <AppShell
        title={current.name}
        leading={
          <CircleButton small label="Back" onClick={() => setTool(null)}>
            <BackIcon />
          </CircleButton>
        }
      >
        <Page />
      </AppShell>
    );
  }
  return (
    <AppShell title="Netrunner">
      <StatusCard />
      <div className={styles.grid}>
        {TOOLS.map((t) => (
          <Pressable key={t.id} className={styles.tile} onClick={() => setTool(t.id)} aria-label={`${t.name}: ${t.note}`}>
            <span className={styles.tileIcon}>
              <t.icon />
            </span>
            <span className={styles.tileName}>{t.name}</span>
            <span className={styles.tileNote}>{t.note}</span>
          </Pressable>
        ))}
      </div>
      <p className={styles.note}>Only scan and test what you own or have permission to. Netrunner's scanners refuse anything outside your own network.</p>
    </AppShell>
  );
}

/** The top card: is the root helper there, and this phone's address and traffic right now. */
function StatusCard() {
  const [helper, setHelper] = useState<'checking' | 'ready' | 'missing'>(hasRootTools() ? 'checking' : 'missing');
  const [missing, setMissing] = useState<string[]>([]);
  const live = useLiveStats();
  const controls = useControls();
  useEffect(() => {
    if (!hasRootTools()) return;
    void askTool('tools')
      .then((a) => {
        const tools = ((a.data as { tools?: Record<string, boolean> } | null)?.tools ?? {}) as Record<string, boolean>;
        setMissing(Object.entries(tools).filter(([, ok]) => !ok).map(([name]) => name));
        setHelper('ready');
      })
      .catch(() => setHelper('missing'));
  }, []);
  const en0 = live.stats?.interfaces.en0;
  return (
    <div className={styles.status}>
      <span className={styles.statusDot} data-on={helper === 'ready' || undefined} />
      <span className={styles.statusText}>
        {helper === 'ready' ? (
          <>
            <strong>root@vantage · online</strong>
            <span>
              {controls.wifi?.on ? controls.wifi.network ?? 'Wi-Fi' : 'no Wi-Fi'} · {en0?.ipv4 ?? '…'} · ↓ {rate(live.down)} ↑ {rate(live.up)}
            </span>
            {missing.length > 0 && <span>Missing from Sileo: {missing.join(', ')}</span>}
          </>
        ) : helper === 'checking' ? (
          <strong>Connecting to the root helper…</strong>
        ) : (
          <>
            <strong>Tools offline</strong>
            <span>{hasRootTools() ? 'The root helper is not answering: reinstall Vantage OS.' : 'Netrunner runs on the jailbroken iPhone. The Toolbox and Learn work here.'}</span>
          </>
        )}
      </span>
    </div>
  );
}
