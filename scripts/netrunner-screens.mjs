// Screenshots of every Netrunner tool in host mode with a FAKE root helper
// (realistic sample output), for checking the screens without the phone.
//   BROWSER=webkit node scripts/netrunner-screens.mjs  -> screenshots/netrunner/<engine>/sheet.png
import { mkdirSync, readFileSync } from 'node:fs';
import { browserType, ENGINE } from './_browser.mjs';
const URL = process.env.APP_URL ?? 'http://localhost:5173';
const OUT = `screenshots/netrunner/${ENGINE}/`;
mkdirSync(OUT, { recursive: true });
const apps = JSON.parse(readFileSync(new globalThis.URL('./fixtures/phone-apps.json', import.meta.url), 'utf8'));
const browser = await browserType.launch();
const context = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_3 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 VantageOSHost/0.3.0' });
await context.addInitScript(({ list, settings }) => {
  if (!sessionStorage.getItem('seeded')) {
    localStorage.clear();
    localStorage.setItem('vantage.settings.v1', JSON.stringify({ setupDone: true, bootAnimation: false, ...settings }));
    localStorage.setItem('netrunner.trusted.v1', JSON.stringify(['HomeNet']));
    sessionStorage.setItem('seeded', '1');
  }
  const OUT = {
    ping: Array.from({ length: 12 }, (_, i) => `64 bytes from 1.1.1.1: icmp_seq=${i} ttl=56 time=${(9 + Math.sin(i) * 3 + (i === 7 ? 30 : 0)).toFixed(3)} ms`).concat(['', '--- 1.1.1.1 ping statistics ---', '12 packets transmitted, 12 packets received, 0.0% packet loss']),
    traceroute: ['traceroute to 1.1.1.1 (1.1.1.1), 24 hops max', '  1   192.168.1.1  4.8ms', '  2   10.160.192.1  10.0ms', '  3   *', '  4   62.2.14.33  9.3ms', '  5   1.1.1.1  10.1ms'],
    whois: ['Domain Name: APPLE.COM', 'Registrar: CSC Corporate Domains, Inc.', 'Creation Date: 1987-02-19T05:00:00Z', 'Registry Expiry Date: 2027-02-20T05:00:00Z', 'Registrant Organization: Apple Inc.'],
    cert: ['*  subject: CN=apple.com; O=Apple Inc.', '*  start date: Sep  9 18:12:55 2026 GMT', '*  expire date: Dec  8 18:12:54 2026 GMT', '*  issuer: C=US; O=Apple Inc.; CN=Apple Public EV Server RSA CA 2 - G1'],
    sweep: ['Host: 192.168.1.1 ()\tStatus: Up', 'Host: 192.168.1.8 ()\tStatus: Up', 'Host: 192.168.1.18 ()\tStatus: Up', 'Host: 192.168.1.27 ()\tStatus: Up', 'Host: 192.168.1.76 ()\tStatus: Up', 'Host: 192.168.1.238 ()\tStatus: Up'],
    ports: ['Host: 192.168.1.18 ()\tPorts: 22/open/tcp//ssh///, 445/open/tcp//microsoft-ds///, 5000/open/tcp//upnp///'],
    capture: Array.from({ length: 30 }, (_, i) => `2026-11-21 18:0${i % 10}:1${i % 10}.12345 IP 192.168.1.238.5${2300 + i} > 17.57.146.${20 + (i % 5)}.443: tcp ${i * 40}`),
    shell: ['uid=501(mobile) gid=501(mobile)', 'Darwin iPhone 22.3.0 Darwin Kernel Version 22.3.0 iPhone12,8'],
  };
  const ASK = {
    tools: { data: { version: '1.0', terminal: true, tools: { nmap: true, ping: true, traceroute: true, whois: true, curl: true, tcpdump: true, lsof: true, arp: true, ifconfig: true, netstat: true, dpkg: true, ps: true, sh: true } } },
    stats: { data: { cpu: { user: 1200, system: 600, idle: 9000, nice: 0 }, memory: { total: 3e9, free: 4e8, active: 1e9, wired: 6e8, compressed: 3e8 }, bootTime: Date.now() / 1000 - 86400 * 2, now: Date.now() / 1000, interfaces: { en0: { ipv4: '192.168.1.238', netmask: '255.255.255.0', ipv6: '2401:4900:40e8:1::5', rx: 812345678, tx: 91234567 }, pdp_ip0: { ipv4: '10.71.2.9', rx: 1234, tx: 321 } } } },
    routes: { out: ['Routing tables', 'Internet:', 'Destination        Gateway            Flags        Netif Expire', 'default            192.168.1.1        UGScg          en0'] },
    dns: { data: { name: 'apple.com', servers: ['192.168.1.1'], records: [{ type: 'A', ttl: 3600, text: 'apple.com.  3600  IN  A  17.253.144.10' }, { type: 'MX', ttl: 3600, text: 'apple.com.  3600  IN  MX  10 mx-in.g.apple.com.' }, { type: 'NS', ttl: 86400, text: 'apple.com.  86400  IN  NS  a.ns.apple.com.' }, { type: 'TXT', ttl: 3600, text: 'apple.com.  3600  IN  TXT  "v=spf1 include:_spf.apple.com ~all"' }] } },
    publicip: { out: ['{"ip":"85.3.12.45","city":"Zurich","region":"Zurich","country":"CH","org":"AS3303 Swisscom (Schweiz) AG"}'] },
    arp: { out: ['? (192.168.1.1) at 6c:99:61:16:a:57 on en0 ifscope [ethernet]', '? (192.168.1.8) at 90:dd:5d:e2:91:2a on en0 ifscope [ethernet]', '? (192.168.1.18) at 2:13:35:ee:e9:9 on en0 ifscope [ethernet]', '? (192.168.1.27) at b0:fc:d:74:70:32 on en0 ifscope [ethernet]', '? (192.168.1.76) at f4:6d:4:e:b9:c8 on en0 ifscope [ethernet]'] },
    connections: { out: ['COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME', 'Instagram 901 mobile 14u IPv4 0x1 0t0 TCP 192.168.1.238:49207->157.240.17.174:443 (ESTABLISHED)', 'Instagram 901 mobile 15u IPv4 0x1 0t0 TCP 192.168.1.238:49208->31.13.92.52:443 (ESTABLISHED)', 'apsd 86 mobile 14u IPv4 0x1 0t0 TCP 192.168.1.238:49100->17.57.146.146:5223 (ESTABLISHED)', 'Spotify 702 mobile 20u IPv4 0x1 0t0 TCP 192.168.1.238:50201->35.186.224.25:443 (ESTABLISHED)'] },
    listening: { out: ['COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME', 'sshd 1 root 4u IPv4 0x1 0t0 TCP *:22 (LISTEN)', 'sshd 1 root 5u IPv4 0x1 0t0 TCP *:2222 (LISTEN)', 'vantagehe 70 root 3u IPv4 0x1 0t0 TCP 127.0.0.1:47811 (LISTEN)', 'lockdownd 60 root 6u IPv6 0x1 0t0 TCP *:62078 (LISTEN)'] },
    passwords: { data: { root: 'changed', mobile: 'default' } },
    packages: { out: ['com.vantageos.tweak\t0.3.0\tTweaks\tVantage OS', 'nmap\t7.92\tNetworking\tNmap', 'openssh\t9.2\tNetworking\tOpenSSH', 'com.opa334.dopamine\t2.0\tSystem\tDopamine'] },
    swvers: { out: ['ProductName:\tiPhone OS', 'ProductVersion:\t16.3', 'BuildVersion:\t20D47'] },
    latency: { out: ['0.012 0.031 0.032'] },
    download: { out: ['11875000 2.1 0.04 25000000'] },
    upload: { out: ['3125000 3.2 10000000'] },
  };
  let n = 0;
  window.vantageNative = {
    listApps: () => Promise.resolve(list), getBadges: () => Promise.resolve({}), getBattery: () => Promise.resolve({ level: 0.8, charging: false }), onVolumeChord: () => Promise.resolve(() => {}),
    getControls: () => Promise.resolve({ brightness: 0.5, volume: 0.5, wifi: { on: true, network: 'HomeNet', bars: 3 } }), getNotifications: () => Promise.resolve([]),
    runTool: (tool) => {
      const id = `run${++n}`;
      const lines = OUT[tool] ?? [];
      lines.forEach((d, i) => setTimeout(() => window.dispatchEvent(new CustomEvent('vantage:tool', { detail: { id, message: { t: 'o', d } } })), 20 + i * 15));
      setTimeout(() => window.dispatchEvent(new CustomEvent('vantage:tool', { detail: { id, message: { t: 'x', c: 0 } } })), 40 + lines.length * 15);
      return Promise.resolve(id);
    },
    cancelTool: () => Promise.resolve(),
    askTool: (op, tool) => Promise.resolve({ code: 0, out: [], err: [], data: null, ...(op === 'tools' ? ASK.tools : ASK[tool] ?? {}) }),
    bleScan: () => {
      setTimeout(() => window.dispatchEvent(new CustomEvent('vantage:ble', { detail: [{ id: 'a1', name: 'AirPods Pro', rssi: -48, seen: Date.now(), maker: 'Apple' }, { id: 'b2', rssi: -71, seen: Date.now(), maker: 'Samsung' }, { id: 'c3', name: 'Mi Band 7', rssi: -80, seen: Date.now(), maker: 'Huami (Amazfit)' }] })), 200);
      return Promise.resolve('scanning');
    },
  };
}, { list: apps, settings: JSON.parse(process.env.SETTINGS ?? '{}') });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.route('https://ipinfo.io/**', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ city: 'Menlo Park', country: 'US', org: 'AS32934 Facebook, Inc.' }) }));
await page.goto(URL); await page.waitForTimeout(2500); await page.reload(); await page.waitForTimeout(2500);
const shots = [];
const process_routes = !!process.env.ROUTES;
const tools = (process.env.ROUTES ?? process.env.TOOLS ?? 'home connection map ping dns speed privacy packets ble security toolbox terminal learn').split(/\s+/);
const press = async (text) => { const b = page.getByRole('button', { name: text }).first(); if (await b.count()) await b.click().catch(() => {}); };
for (const tool of tools) {
  // ROUTES=... : any screens (e.g. home/1 controls) instead of Netrunner's tools
  const route = process_routes ? tool : tool === 'home' ? 'app/netrunner' : `app/netrunner/${tool}`;
  await page.evaluate((r) => window.vantageGo(r), route);
  await page.waitForTimeout(1200);
  if (tool === 'map') { await press('Scan my network'); await page.waitForTimeout(800); }
  if (tool === 'ping') { await press('Ping'); await page.waitForTimeout(600); }
  if (tool === 'dns' && !process.env.NOPRESS) { await press('Records'); await press('Certificate'); await page.waitForTimeout(600); }
  if (tool === 'speed') { await press('Test my internet'); await page.waitForTimeout(800); }
  if (tool === 'privacy') { await press('Start watching'); await page.waitForTimeout(900); }
  if (tool === 'packets') { await press('Capture'); await page.waitForTimeout(900); }
  if (tool === 'terminal') { await press('Who am I'); await page.waitForTimeout(600); }
  if (tool === 'ble') await page.waitForTimeout(600);
  const f = `${OUT}${tool.replace(/\//g, '-')}.png`;
  await page.screenshot({ path: f });
  shots.push([tool, f]);
}
const sheet = await browser.newPage({ viewport: { width: 5 * 200 + 16, height: 400 } });
await sheet.setContent(`<style>body{margin:0;padding:8px;display:flex;flex-wrap:wrap;gap:8px;background:#20262d;font:11px sans-serif;color:#ccc}figure{margin:0;width:192px}img{width:192px;border-radius:8px}</style>` + shots.map(([r, f]) => `<figure><img src="data:image/png;base64,${readFileSync(f).toString('base64')}"><figcaption>${r}</figcaption></figure>`).join(''));
await sheet.screenshot({ path: `${OUT}sheet.png`, fullPage: true });
console.log('saved', `${OUT}sheet.png`, errors.length ? `errors: ${errors.join(' | ')}` : 'no errors');
await browser.close();
