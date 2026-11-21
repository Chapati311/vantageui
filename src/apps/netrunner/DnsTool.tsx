import { useEffect, useState } from 'react';
import { Button, Row, Section } from '../../components/kit';
import { askTool, hasRootTools, useToolRun } from '../../system/rootTools';
import { Output } from './Output';
import { takeNetrunnerTarget } from './netrunnerNav';
import styles from './Netrunner.module.css';

interface Record {
  type: string;
  ttl?: number;
  text: string;
}

const TYPES = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME'];
const DOH_TYPES: { [name: string]: number } = { A: 1, NS: 2, CNAME: 5, MX: 15, TXT: 16, AAAA: 28 };

/** DNS over HTTPS (Cloudflare): the web fallback when the phone's own resolver isn't there. */
async function dohLookup(name: string): Promise<Record[]> {
  const results = await Promise.all(
    TYPES.map(async (type) => {
      const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`, { headers: { accept: 'application/dns-json' } });
      const json = (await response.json()) as { Answer?: { type: number; TTL: number; data: string }[] };
      return (json.Answer ?? []).filter((a) => a.type === DOH_TYPES[type]).map((a) => ({ type, ttl: a.TTL, text: a.data }));
    }),
  );
  return results.flat();
}

/** 4. DNS & Whois: a domain's records, who registered it, and its HTTPS certificate. */
export function DnsTool() {
  const [start] = useState(takeNetrunnerTarget);
  const [domain, setDomain] = useState(start?.value ?? 'apple.com');
  const [records, setRecords] = useState<Record[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const whois = useToolRun();
  const cert = useToolRun();
  const clean = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim().toLowerCase();

  const lookup = async () => {
    setBusy(true);
    setError(null);
    try {
      if (hasRootTools()) {
        const answer = await askTool('run', 'dns', [clean]);
        const data = answer.data as { records?: { type: string; ttl: number; text: string }[] } | null;
        // "apple.com.  3600  IN  A  17.253.144.10" -> the value part
        setRecords((data?.records ?? []).map((r) => ({ type: r.type, ttl: r.ttl, text: r.text.split(/\s+IN\s+\w+\s+/)[1] ?? r.text })));
      } else setRecords(await dohLookup(clean));
    } catch (e) {
      setError((e as Error).message);
      setRecords([]);
    }
    setBusy(false);
  };

  // Opened from Search / Vantage with a domain ("whois example.com", "dns apple.com"): go
  useEffect(() => {
    if (!start) return;
    void lookup();
    if (start.action === 'whois' && hasRootTools()) void whois.start('whois', [clean]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // whois: the useful lines, in words
  const pick = (re: RegExp) => whois.lines.map((l) => l.text.match(re)?.[1]?.trim()).find(Boolean);
  const registrar = pick(/^\s*Registrar:\s*(.+)$/i);
  const created = pick(/^\s*Creation Date:\s*(.+)$/i) ?? pick(/^\s*created:\s*(.+)$/i);
  const expires = pick(/Expir\w* Date:\s*(.+)$/i) ?? pick(/^\s*expires?:\s*(.+)$/i);
  const owner = pick(/^\s*Registrant Organization:\s*(.+)$/i) ?? pick(/^\s*org(?:-name)?:\s*(.+)$/i);
  // curl -v: "*  subject: CN=apple.com", "*  start date:", "*  expire date:", "*  issuer:"
  const certField = (name: string) => cert.lines.map((l) => l.text.match(new RegExp(`\\*\\s+${name}:\\s*(.+)$`))?.[1]).find(Boolean);
  const certExpire = certField('expire date');
  const daysLeft = certExpire ? Math.round((Date.parse(certExpire) - Date.now()) / 86_400_000) : null;

  return (
    <>
      <div className={styles.inputRow}>
        <input className={styles.input} value={domain} onChange={(e) => setDomain(e.target.value)} aria-label="Domain" placeholder="example.com" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
      </div>
      <div className={styles.inputRow}>
        <Button kind="primary" wide disabled={!clean || busy} onPress={() => void lookup()}>
          Records
        </Button>
        <Button wide disabled={!clean || whois.running || !hasRootTools()} onPress={() => void whois.start('whois', [clean])}>
          Whois
        </Button>
        <Button wide disabled={!clean || cert.running || !hasRootTools()} onPress={() => void cert.start('cert', [clean])}>
          Certificate
        </Button>
      </div>
      {error && <p className={`${styles.note} ${styles.bad}`}>{error}</p>}
      {records.length > 0 && (
        <Section label={`${records.length} record${records.length === 1 ? '' : 's'}`} note={hasRootTools() ? 'From the phone’s own DNS servers.' : 'Looked up with DNS over HTTPS (Cloudflare).'}>
          {records.map((r, i) => (
            <Row key={i} title={<span className={styles.mono}>{r.text}</span>} detail={`${r.type}${r.ttl !== undefined ? ` · TTL ${r.ttl}s` : ''}`} />
          ))}
        </Section>
      )}
      {(registrar || created || expires) && (
        <Section label="Who registered it">
          {owner && <Row title="Owner" value={owner} />}
          {registrar && <Row title="Registrar" value={registrar} />}
          {created && <Row title="Created" value={created.slice(0, 10)} />}
          {expires && <Row title="Expires" value={expires.slice(0, 10)} />}
        </Section>
      )}
      {(whois.running || whois.lines.length > 0) && <Output title={`whois ${clean}`} lines={whois.lines} running={whois.running} code={whois.code} onStop={whois.stop} />}
      {certExpire && (
        <Section label="HTTPS certificate">
          <Row title="For" value={<span className={styles.mono}>{certField('subject')?.replace(/^CN=/, '')}</span>} />
          <Row title="Issued by" detail={certField('issuer')} />
          <Row title="Valid from" value={certField('start date')} />
          <Row title="Expires" value={<span className={daysLeft !== null && daysLeft < 14 ? styles.bad : styles.good}>{certExpire} {daysLeft !== null ? `(${daysLeft} days)` : ''}</span>} />
        </Section>
      )}
      {(cert.running || cert.lines.length > 0) && <Output title={`curl -vI https://${clean}`} lines={cert.lines} running={cert.running} code={cert.code} onStop={cert.stop} />}
    </>
  );
}
