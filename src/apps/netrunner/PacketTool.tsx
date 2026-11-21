import { useState } from 'react';
import { Button, Row, Section } from '../../components/kit';
import { hasRootTools, useToolRun } from '../../system/rootTools';
import { Output } from './Output';
import styles from './Netrunner.module.css';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'web', label: 'Web' },
  { id: 'dns', label: 'DNS' },
  { id: 'tcp', label: 'TCP' },
  { id: 'udp', label: 'UDP' },
  { id: 'host', label: 'One host' },
];

interface Packet {
  time: string;
  from: string;
  to: string;
  what: string;
}

/** "2026-11-21 17:00:00.123456 IP 192.168.1.238.52344 > 17.57.146.20.443: tcp 0" */
function parse(text: string): Packet | null {
  const m = text.match(/^\S+ (\d\d:\d\d:\d\d)\.\d+ IP6? (\S+) > (\S+): (.*)$/);
  return m ? { time: m[1], from: m[2], to: m[3].replace(/:$/, ''), what: m[4] } : null;
}

/**
 * 7. Packet view: this phone's own traffic, live (tcpdump on its Wi-Fi), as a
 * readable list or raw, with filters. "Save .pcap" records packets to a file
 * you can open in Wireshark on the laptop.
 */
export function PacketTool() {
  const [filter, setFilter] = useState('all');
  const [host, setHost] = useState('');
  const [raw, setRaw] = useState(false);
  const live = useToolRun(1500);
  const pcap = useToolRun();
  const packets = live.lines.map((l) => parse(l.text)).filter((p): p is Packet => !!p);

  if (!hasRootTools()) return <p className={styles.note}>Packet view captures this phone's own traffic: it runs on the jailbroken iPhone running Vantage OS.</p>;
  const args = [filter, 2000, ...(filter === 'host' ? [host] : [])];
  return (
    <>
      <div className={styles.chips}>
        {FILTERS.map((f) => (
          <button key={f.id} type="button" className={styles.chip} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>
      {filter === 'host' && (
        <div className={styles.inputRow}>
          <input className={styles.input} value={host} onChange={(e) => setHost(e.target.value.trim())} aria-label="Host" placeholder="17.57.146.20 or apple.com" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
        </div>
      )}
      <div className={styles.inputRow}>
        <Button kind="primary" wide disabled={filter === 'host' && !host} onPress={() => (live.running ? live.stop() : void live.start('capture', args))}>
          {live.running ? `Stop (${packets.length})` : 'Capture'}
        </Button>
        <Button wide onPress={() => setRaw((r) => !r)}>
          {raw ? 'Readable' : 'Raw'}
        </Button>
      </div>
      {raw ? (
        <Output title={`tcpdump -i en0 ${filter}`} lines={live.lines} running={live.running} code={live.code} onStop={live.stop} empty="Press Capture, then use the phone." />
      ) : (
        packets.length > 0 && (
          <Section label={`${packets.length} packets`}>
            {packets
              .slice(-80)
              .reverse()
              .map((p, i) => (
                <Row key={i} title={<span className={styles.mono}>{`${p.from} → ${p.to}`}</span>} detail={<span className={styles.mono}>{p.what}</span>} value={p.time} />
              ))}
          </Section>
        )
      )}
      <Section label="Save for Wireshark" note="Records 500 packets to a .pcap file on the phone. Copy it to the laptop with: scp root@<phone ip>:/var/mobile/Library/Caches/com.vantageos.bridge/capture.pcap .">
        <Row title={pcap.running ? 'Recording…' : pcap.code === 0 ? 'Saved capture.pcap' : 'Record 500 packets'} detail={pcap.lines.map((l) => l.text).filter((t) => /packets/.test(t)).join(' · ') || undefined} onPress={pcap.running ? pcap.stop : () => void pcap.start('pcap', [filter, 500, ...(filter === 'host' ? [host] : [])])} />
      </Section>
    </>
  );
}
