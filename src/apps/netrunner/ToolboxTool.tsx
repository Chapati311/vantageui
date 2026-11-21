import qrcode from 'qrcode-generator';
import { useEffect, useMemo, useState } from 'react';
import { Button, Row, Section, SegmentedControl } from '../../components/kit';
import { CopyIcon } from '../../components/glyphs';
import { md5 } from './md5';
import styles from './Netrunner.module.css';

type Kit = 'encode' | 'hash' | 'password' | 'jwt' | 'qr' | 'subnet' | 'units';
const KITS: { id: Kit; label: string }[] = [
  { id: 'encode', label: 'Encode' },
  { id: 'hash', label: 'Hash' },
  { id: 'password', label: 'Password' },
  { id: 'jwt', label: 'JWT' },
  { id: 'qr', label: 'QR' },
  { id: 'subnet', label: 'Subnet' },
  { id: 'units', label: 'Bits' },
];

const copy = (text: string) => void navigator.clipboard?.writeText(text).catch(() => {});

/** 10. Toolbox: the small tools every hacker reaches for. All offline, all on the phone. */
export function ToolboxTool() {
  const [kit, setKit] = useState<Kit>('encode');
  return (
    <>
      <div className={styles.chips} role="tablist" aria-label="Tool">
        {KITS.map((k) => (
          <button key={k.id} type="button" role="tab" className={styles.chip} aria-pressed={kit === k.id} aria-selected={kit === k.id} onClick={() => setKit(k.id)}>
            {k.label}
          </button>
        ))}
      </div>
      {kit === 'encode' && <Encoder />}
      {kit === 'hash' && <Hasher />}
      {kit === 'password' && <Passwords />}
      {kit === 'jwt' && <Jwt />}
      {kit === 'qr' && <Qr />}
      {kit === 'subnet' && <Subnet />}
      {kit === 'units' && <Units />}
    </>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return <Row title={<span className={styles.mono}>{value || ' '}</span>} detail={label} trailing={value ? <Button icon={CopyIcon} onPress={() => copy(value)}>Copy</Button> : undefined} />;
}

// ---- Encoder / decoder ----
const bytesOf = (s: string) => new TextEncoder().encode(s);
const textOf = (b: Uint8Array) => new TextDecoder('utf-8', { fatal: false }).decode(b);
function tryOr(f: () => string): string {
  try {
    return f();
  } catch {
    return '(not valid input)';
  }
}

function Encoder() {
  const [text, setText] = useState('hello world');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const rows: [string, string][] =
    mode === 'encode'
      ? [
          ['Base64', btoa(String.fromCharCode(...bytesOf(text)))],
          ['Hex', [...bytesOf(text)].map((b) => b.toString(16).padStart(2, '0')).join('')],
          ['URL', encodeURIComponent(text)],
          ['Binary', [...bytesOf(text)].map((b) => b.toString(2).padStart(8, '0')).join(' ')],
          ['ROT13', text.replace(/[a-z]/gi, (c) => String.fromCharCode(((c.charCodeAt(0) - (c < 'a' ? 65 : 97) + 13) % 26) + (c < 'a' ? 65 : 97)))],
        ]
      : [
          ['From Base64', tryOr(() => textOf(Uint8Array.from(atob(text.trim()), (c) => c.charCodeAt(0))))],
          ['From hex', tryOr(() => textOf(Uint8Array.from((text.replace(/[^0-9a-f]/gi, '').match(/../g) ?? []).map((h) => parseInt(h, 16)))))],
          ['From URL', tryOr(() => decodeURIComponent(text))],
          ['From binary', tryOr(() => textOf(Uint8Array.from((text.match(/[01]{8}/g) ?? []).map((b) => parseInt(b, 2)))))],
          ['ROT13', text.replace(/[a-z]/gi, (c) => String.fromCharCode(((c.charCodeAt(0) - (c < 'a' ? 65 : 97) + 13) % 26) + (c < 'a' ? 65 : 97)))],
        ];
  return (
    <>
      <SegmentedControl label="Direction" value={mode} onChange={setMode} options={[{ id: 'encode', label: 'Encode' }, { id: 'decode', label: 'Decode' }]} />
      <textarea className={styles.textarea} value={text} onChange={(e) => setText(e.target.value)} aria-label="Text" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
      <Section>
        {rows.map(([label, value]) => (
          <Result key={label} label={label} value={value} />
        ))}
      </Section>
    </>
  );
}

// ---- Hashes ----
async function sha(algorithm: string, text: string): Promise<string> {
  const digest = await crypto.subtle.digest(algorithm, bytesOf(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function Hasher() {
  const [text, setText] = useState('password123');
  const [hashes, setHashes] = useState<[string, string][]>([]);
  useEffect(() => {
    let alive = true;
    void Promise.all([sha('SHA-1', text), sha('SHA-256', text), sha('SHA-512', text)])
      .then(([s1, s256, s512]) => alive && setHashes([['MD5', md5(text)], ['SHA-1', s1], ['SHA-256', s256], ['SHA-512', s512]]))
      .catch(() => alive && setHashes([['MD5', md5(text)]]));
    return () => {
      alive = false;
    };
  }, [text]);
  return (
    <>
      <textarea className={styles.textarea} value={text} onChange={(e) => setText(e.target.value)} aria-label="Text to hash" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
      <Section note="A hash is a fingerprint: the same text always gives the same hash, and you can't turn it back into the text.">
        {hashes.map(([label, value]) => (
          <Result key={label} label={label} value={value} />
        ))}
      </Section>
    </>
  );
}

// ---- Passwords ----
const SETS = { lower: 'abcdefghijkmnopqrstuvwxyz', upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ', digits: '23456789', symbols: '!@#$%^&*-_=+?' };
const WORDS = 'orbit pixel neon cipher matrix vector delta nova ember quartz falcon comet glitch lunar signal atlas raven echo prism vortex ghost kernel byte socket shadow photon rocket ninja hacker summit tiger maple cobalt zenith'.split(' ');
function random(n: number): number {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] % n;
}

/** Rough guessing difficulty in bits, from the kinds of characters and length (with a penalty for common patterns). */
export function strength(password: string): { bits: number; label: string } {
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/\d/.test(password)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(password)) pool += 33;
  let bits = password.length * Math.log2(Math.max(pool, 1));
  if (/^(password|qwerty|123456|letmein|admin|alpine|iloveyou|welcome)/i.test(password)) bits = Math.min(bits, 10);
  if (/(.)\1{2,}/.test(password)) bits *= 0.8;
  const label = bits < 28 ? 'Very weak' : bits < 36 ? 'Weak' : bits < 60 ? 'OK' : bits < 80 ? 'Strong' : 'Very strong';
  return { bits: Math.round(bits), label };
}

function Passwords() {
  const [length, setLength] = useState(18);
  const [kind, setKind] = useState<'chars' | 'words'>('chars');
  const make = () =>
    kind === 'words'
      ? Array.from({ length: Math.max(3, Math.round(length / 5)) }, () => WORDS[random(WORDS.length)]).join('-') + '-' + random(100)
      : Array.from({ length }, (_, i) => {
          const set = Object.values(SETS)[i < 4 ? i : random(4)];
          return set[random(set.length)];
        })
          .sort(() => random(3) - 1)
          .join('');
  const [password, setPassword] = useState(make);
  const [test, setTest] = useState('');
  const s = strength(test || password);
  return (
    <>
      <SegmentedControl label="Kind" value={kind} onChange={(k) => { setKind(k); }} options={[{ id: 'chars', label: 'Characters' }, { id: 'words', label: 'Words' }]} />
      <Section>
        <Result label={`${password.length} characters`} value={password} />
        <Row title="Length" value={<span className={styles.mono}>{length}</span>} trailing={<span className={styles.chips}><button type="button" className={styles.chip} onClick={() => setLength((l) => Math.max(8, l - 2))}>−</button><button type="button" className={styles.chip} onClick={() => setLength((l) => Math.min(64, l + 2))}>+</button></span>} />
      </Section>
      <Button kind="primary" wide onPress={() => setPassword(make())}>
        New password
      </Button>
      <Section label="How strong is it?" note="Typed here, it never leaves the phone.">
        <div className={styles.inputRow}>
          <input className={styles.input} value={test} onChange={(e) => setTest(e.target.value)} placeholder="Type a password to test" aria-label="Password to test" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
        </div>
      </Section>
      <div className={styles.meter} aria-label={`${s.label}, about ${s.bits} bits`}>
        <span style={{ width: `${Math.min(100, (s.bits / 100) * 100)}%` }} />
      </div>
      <p className={styles.note}>
        {s.label} · about {s.bits} bits{test ? '' : ' (the password above)'}. 60+ bits is hard to guess; 80+ is very hard.
      </p>
    </>
  );
}

// ---- JWT ----
function Jwt() {
  const [token, setToken] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlZhbnRhZ2UiLCJpYXQiOjE3MDAwMDAwMDB9.signature');
  const parts = token.trim().split('.');
  const decode = (part?: string) =>
    tryOr(() => {
      const base64 = (part ?? '').replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      const json = textOf(Uint8Array.from(atob(padded), (c) => c.charCodeAt(0)));
      return JSON.stringify(JSON.parse(json), null, 2);
    });
  const payload = tryOr(() => JSON.parse(decode(parts[1])) as never);
  const exp = typeof payload === 'object' && payload && 'exp' in payload ? Number((payload as { exp: number }).exp) : null;
  return (
    <>
      <textarea className={styles.textarea} value={token} onChange={(e) => setToken(e.target.value)} aria-label="JWT" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
      <Section label="Header">
        <pre className={styles.code}>{decode(parts[0])}</pre>
      </Section>
      <Section label="Payload" note={exp ? `Expires ${new Date(exp * 1000).toLocaleString()} (${exp * 1000 < Date.now() ? 'expired' : 'still valid'})` : 'Decoding only: the signature is not checked.'}>
        <pre className={styles.code}>{decode(parts[1])}</pre>
      </Section>
    </>
  );
}

// ---- QR ----
function Qr() {
  const [text, setText] = useState('https://vantageui.vercel.app');
  const url = useMemo(() => {
    try {
      const code = qrcode(0, 'M');
      code.addData(text || ' ');
      code.make();
      return code.createDataURL(8, 2);
    } catch {
      return '';
    }
  }, [text]);
  return (
    <>
      <textarea className={styles.textarea} value={text} onChange={(e) => setText(e.target.value)} aria-label="Text for the QR code" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
      {url ? <img className={styles.qr} src={url} alt={`QR code for ${text}`} /> : <p className={styles.note}>Too long for a QR code.</p>}
      <p className={styles.note}>Scanning QR codes: point the Camera at one (iOS 16.3's web views can't read the camera's QR codes themselves).</p>
    </>
  );
}

// ---- Subnet calculator ----
function Subnet() {
  const [input, setInput] = useState('192.168.1.238/24');
  const [ip, bitsText] = input.trim().split('/');
  const bits = Math.min(32, Math.max(0, Number(bitsText ?? 24)));
  const parts = ip.split('.').map(Number);
  const valid = parts.length === 4 && parts.every((n) => Number.isInteger(n) && n >= 0 && n <= 255) && Number.isFinite(bits);
  const num = valid ? parts.reduce((s, n) => s * 256 + n, 0) : 0;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  const network = (num & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const str = (n: number) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join('.');
  const hosts = bits >= 31 ? 2 ** (32 - bits) : 2 ** (32 - bits) - 2;
  return (
    <>
      <div className={styles.inputRow}>
        <input className={styles.input} value={input} onChange={(e) => setInput(e.target.value)} aria-label="Address and prefix" placeholder="192.168.1.10/24" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
      </div>
      {valid ? (
        <Section>
          <Row title="Network" value={<span className={styles.mono}>{`${str(network)}/${bits}`}</span>} />
          <Row title="Netmask" value={<span className={styles.mono}>{str(mask)}</span>} />
          <Row title="First host" value={<span className={styles.mono}>{str(bits >= 31 ? network : network + 1)}</span>} />
          <Row title="Last host" value={<span className={styles.mono}>{str(bits >= 31 ? broadcast : broadcast - 1)}</span>} />
          <Row title="Broadcast" value={<span className={styles.mono}>{str(broadcast)}</span>} />
          <Row title="Usable hosts" value={<span className={styles.mono}>{hosts.toLocaleString()}</span>} />
          <Row title="Private range" value={/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip) ? 'Yes' : 'No (public)'} />
        </Section>
      ) : (
        <p className={styles.note}>Type an IPv4 address with a prefix, like 10.0.0.5/16.</p>
      )}
    </>
  );
}

// ---- Bits and bytes ----
const UNITS = [
  { id: 'b', label: 'bits', bits: 1 },
  { id: 'B', label: 'bytes', bits: 8 },
  { id: 'kb', label: 'kilobits', bits: 1e3 },
  { id: 'KB', label: 'kilobytes', bits: 8e3 },
  { id: 'Mb', label: 'megabits', bits: 1e6 },
  { id: 'MB', label: 'megabytes', bits: 8e6 },
  { id: 'Gb', label: 'gigabits', bits: 1e9 },
  { id: 'GB', label: 'gigabytes', bits: 8e9 },
  { id: 'MiB', label: 'mebibytes', bits: 8 * 1024 * 1024 },
  { id: 'GiB', label: 'gibibytes', bits: 8 * 1024 ** 3 },
];

function Units() {
  const [value, setValue] = useState('100');
  const [unit, setUnit] = useState('Mb');
  const bits = Number(value) * (UNITS.find((u) => u.id === unit)?.bits ?? 1);
  return (
    <>
      <div className={styles.inputRow}>
        <input className={styles.input} value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" aria-label="Amount" />
      </div>
      <div className={styles.chips}>
        {UNITS.map((u) => (
          <button key={u.id} type="button" className={styles.chip} aria-pressed={unit === u.id} onClick={() => setUnit(u.id)}>
            {u.id}
          </button>
        ))}
      </div>
      <Section note={unit.endsWith('b') && unit !== 'b' ? `At ${value} ${unit}/s, 1 GB takes ${Number.isFinite(bits) && bits > 0 ? Math.round(8e9 / bits) : '-'} s.` : undefined}>
        {UNITS.filter((u) => u.id !== unit).map((u) => (
          <Row key={u.id} title={u.label} value={<span className={styles.mono}>{Number.isFinite(bits) ? +(bits / u.bits).toPrecision(6) : '-'}</span>} />
        ))}
      </Section>
    </>
  );
}
