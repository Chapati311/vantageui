import { useEffect, useState } from 'react';
import { Button, Row, Section } from '../../components/kit';
import { askTool, hasRootTools } from '../../system/rootTools';
import { PORT_NAMES } from './oui';
import styles from './Netrunner.module.css';

interface Finding {
  level: 'bad' | 'warn' | 'good' | 'info';
  title: string;
  fix?: string;
}

interface Listener {
  process: string;
  port: number;
  address: string;
}

/** 9. Phone security check: what this phone exposes, and what to fix. */
export function SecurityTool() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [listeners, setListeners] = useState<Listener[]>([]);
  const [packages, setPackages] = useState<{ id: string; version: string; section: string; name: string }[]>([]);
  const [system, setSystem] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    const out: Finding[] = [];
    try {
      const [listening, passwords, pkgs, swvers, tools] = await Promise.all([
        askTool('run', 'listening'),
        askTool('run', 'passwords'),
        askTool('run', 'packages'),
        askTool('run', 'swvers'),
        askTool('tools'),
      ]);
      // Passwords
      const pw = (passwords.data ?? {}) as Record<string, string>;
      for (const user of ['root', 'mobile']) {
        if (pw[user] === 'default') out.push({ level: 'bad', title: `The ${user} password is still "alpine"`, fix: `Anyone on your Wi-Fi could log in over SSH. Open NewTerm and type: passwd ${user}` });
        else if (pw[user] === 'changed') out.push({ level: 'good', title: `The ${user} password was changed` });
      }
      // Listening ports
      const found: Listener[] = [];
      for (const line of listening.out) {
        const m = line.match(/^(\S+)\s+\d+\s+\S+.*TCP\s+(\S+):(\d+)\s+\(LISTEN\)/);
        if (m && !found.some((f) => f.port === Number(m[3]))) found.push({ process: m[1], address: m[2], port: Number(m[3]) });
      }
      setListeners(found.sort((a, b) => a.port - b.port));
      const open = found.filter((f) => f.address === '*' || f.address === '0.0.0.0' || f.address === '[::]');
      const ssh = open.filter((f) => f.port === 22 || f.port === 2222);
      if (ssh.length) out.push({ level: pw.root === 'default' || pw.mobile === 'default' ? 'bad' : 'warn', title: `SSH is open to your network (port ${ssh.map((s) => s.port).join(', ')})`, fix: 'Fine for working with your laptop; with changed passwords it is safe on your own Wi-Fi. On public Wi-Fi, turn OpenSSH off in Sileo.' });
      const others = open.filter((f) => ![22, 2222, 62078, 5353, 7000, 49152].includes(f.port));
      for (const f of others) out.push({ level: 'warn', title: `${f.process} listens on port ${f.port} for the whole network`, fix: PORT_NAMES[f.port] ? `${PORT_NAMES[f.port]}. Remove it in Sileo if you don't use it.` : 'Check what it is; remove it in Sileo if you don’t need it.' });
      if (!others.length) out.push({ level: 'good', title: 'No unexpected open ports' });
      // Packages / tweaks
      const list = pkgs.out
        .map((l) => l.split('\t'))
        .filter((p) => p.length >= 3)
        .map(([id, version, section, name]) => ({ id, version, section, name: name || id }));
      setPackages(list);
      const tweaks = list.filter((p) => /tweak/i.test(p.section));
      out.push({ level: 'info', title: `${list.length} packages installed, ${tweaks.length} of them tweaks` });
      // System
      const version = swvers.out.find((l) => /ProductVersion/.test(l))?.split(':')[1]?.trim() ?? '';
      setSystem(swvers.out.join('\n'));
      if (version) out.push({ level: 'warn', title: `iOS ${version}`, fix: 'Older iOS versions have security holes that later updates fixed; staying on it keeps the jailbreak. Avoid untrusted links and profiles.' });
      const t = (tools.data ?? {}) as { terminal?: boolean };
      if (t.terminal) out.push({ level: 'info', title: 'Netrunner Terminal is allowed', fix: 'Turn it off in Settings > Vantage OS when you don’t use it.' });
    } catch (e) {
      out.push({ level: 'bad', title: (e as Error).message });
    }
    setFindings(out);
    setBusy(false);
  };

  useEffect(() => {
    if (hasRootTools()) void run();
  }, []);

  if (!hasRootTools()) return <p className={styles.note}>The security check looks inside this phone: it runs on the jailbroken iPhone running Vantage OS.</p>;
  const order = { bad: 0, warn: 1, info: 2, good: 3 };
  const score = findings.filter((f) => f.level === 'bad').length ? 'At risk' : findings.filter((f) => f.level === 'warn').length ? 'Mostly safe' : 'Safe';
  return (
    <>
      <div className={styles.status}>
        <span className={styles.statusDot} data-on={score === 'Safe' || undefined} />
        <span className={styles.statusText}>
          <strong className={score === 'At risk' ? styles.bad : score === 'Safe' ? styles.good : styles.warn}>{busy ? 'Checking…' : score}</strong>
          {findings.filter((f) => f.level === 'bad').length} to fix · {findings.filter((f) => f.level === 'warn').length} to look at
        </span>
      </div>
      <Section label="Findings">
        {[...findings]
          .sort((a, b) => order[a.level] - order[b.level])
          .map((f, i) => (
            <Row key={i} title={<span className={styles[f.level === 'info' ? 'mono' : f.level]}>{f.title}</span>} detail={f.fix} />
          ))}
      </Section>
      {listeners.length > 0 && (
        <Section label="Listening on this phone">
          {listeners.map((l) => (
            <Row key={l.port} title={`${l.port} · ${l.process}`} detail={`${PORT_NAMES[l.port] ?? 'service'} · ${l.address === '*' ? 'whole network' : l.address}`} />
          ))}
        </Section>
      )}
      {packages.length > 0 && (
        <Section label="Jailbreak packages">
          {packages
            .filter((p) => /tweak|system|networking|security|utilities/i.test(p.section))
            .slice(0, 60)
            .map((p) => (
              <Row key={p.id} title={p.name} detail={`${p.id} · ${p.section}`} value={<span className={styles.mono}>{p.version}</span>} />
            ))}
        </Section>
      )}
      {system && <pre className={styles.code}>{system}</pre>}
      <Button wide disabled={busy} onPress={() => void run()}>
        Check again
      </Button>
    </>
  );
}
