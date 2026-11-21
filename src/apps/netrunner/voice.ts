/**
 * Netrunner for Vantage's voice (HACKER_MODE.md 3): each function runs the
 * real tools and answers in one or two plain sentences. Same scope rule as
 * the app: scans only of your own, confirmed network.
 */
import { askTool, cidrOf, hasRootTools, runTool } from '../../system/rootTools';
import { getControls } from '../../system/phoneControls';
import { vendorOf, normalizeMac } from './oui';

function needPhone(): void {
  if (!hasRootTools()) throw new Error('That needs the jailbroken iPhone running Vantage OS.');
}

export async function publicIp(): Promise<string> {
  needPhone();
  const answer = await askTool('run', 'publicip');
  const info = JSON.parse(answer.out.join('')) as { ip?: string; city?: string; country?: string; org?: string };
  return `Your public IP is ${info.ip ?? 'unknown'}${info.city ? `, in ${info.city}, ${info.country}` : ''}${info.org ? `, through ${info.org.replace(/^AS\d+\s*/, '')}` : ''}.`;
}

export async function devices(): Promise<string> {
  needPhone();
  const wifi = getControls().wifi;
  const ssid = wifi?.on ? wifi.network : undefined;
  if (!ssid) return "You're not on Wi-Fi, so there's no network to look at.";
  let trusted: string[] = [];
  try {
    trusted = JSON.parse(localStorage.getItem('netrunner.trusted.v1') ?? '[]') as string[];
  } catch {
    // none yet
  }
  if (!trusted.includes(ssid)) return `First confirm ${ssid} is your network: open Netrunner, Network Map, and tap "Yes, this is my network". Then ask me again.`;
  const stats = (await askTool('run', 'stats')).data as { interfaces?: Record<string, { ipv4?: string; netmask?: string }> } | null;
  const en0 = stats?.interfaces?.en0;
  const cidr = en0?.ipv4 && en0.netmask ? cidrOf(en0.ipv4, en0.netmask) : null;
  if (!cidr) return "I couldn't read your network's address range.";
  const up = new Set<string>();
  await runTool('sweep', [cidr], (line) => {
    const m = line.text.match(/^Host:\s+(\d+\.\d+\.\d+\.\d+).*Status:\s+Up/);
    if (m) up.add(m[1]);
  }).done;
  const arp = await askTool('run', 'arp');
  const makers: string[] = [];
  arp.out.forEach((line) => {
    const m = line.match(/\((\d+\.\d+\.\d+\.\d+)\) at ([0-9a-f:]+) on en0/i);
    if (m) {
      up.add(m[1]);
      makers.push(vendorOf(normalizeMac(m[2])).replace(/ \(.*\)$/, ''));
    }
  });
  const counts = makers.reduce<Record<string, number>>((acc, maker) => ({ ...acc, [maker]: (acc[maker] ?? 0) + 1 }), {});
  const summary = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([maker, n]) => `${n} ${maker}`)
    .join(', ');
  return `${up.size} devices are on ${ssid}${summary ? `: ${summary}` : ''}. Open Netrunner's Network Map to name them.`;
}

export async function topTalkers(): Promise<string> {
  needPhone();
  const answer = await askTool('run', 'connections');
  const counts: Record<string, number> = {};
  for (const line of answer.out) {
    const m = line.match(/^(\S+)\s+\d+\s+\S+.*?(?:TCP|UDP)\s+\S+->\S+/);
    if (m && !line.includes('(LISTEN)')) counts[m[1]] = (counts[m[1]] ?? 0) + 1;
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (!top.length) return 'Right now no app has an open internet connection.';
  return `Right now ${top.map(([app, n]) => `${app} has ${n} connection${n === 1 ? '' : 's'}`).join(', ')}. For a longer picture, start the Privacy Monitor in Netrunner.`;
}

export async function securityCheck(): Promise<string> {
  needPhone();
  const [passwords, listening] = await Promise.all([askTool('run', 'passwords'), askTool('run', 'listening')]);
  const pw = (passwords.data ?? {}) as Record<string, string>;
  const problems: string[] = [];
  for (const user of ['root', 'mobile']) if (pw[user] === 'default') problems.push(`the ${user} password is still "alpine" (change it in NewTerm with: passwd ${user})`);
  const open = listening.out.filter((l) => /TCP \*:(\d+) \(LISTEN\)/.test(l)).map((l) => Number(l.match(/\*:(\d+)/)![1]));
  const unexpected = [...new Set(open)].filter((p) => ![22, 2222, 62078, 5353, 7000, 49152].includes(p));
  if (unexpected.length) problems.push(`port${unexpected.length > 1 ? 's' : ''} ${unexpected.join(', ')} ${unexpected.length > 1 ? 'are' : 'is'} open to your network`);
  return problems.length ? `Two things to look at: ${problems.join('; and ')}. Netrunner's Security Check has the details.` : 'Looks good: the default passwords are changed and nothing unexpected is open. SSH is on, which is fine on your own Wi-Fi.';
}

export async function ping(host: string): Promise<string> {
  needPhone();
  const result = await runTool('ping', [host, 5]).done;
  const times = result.out.map((l) => l.match(/time[=<]([\d.]+) ?ms/)?.[1]).filter(Boolean).map(Number);
  if (!times.length) return `${host} didn't answer.`;
  return `${host} answers in about ${Math.round(times.reduce((a, b) => a + b, 0) / times.length)} milliseconds.`;
}

export async function speedTest(): Promise<string> {
  needPhone();
  const d = await askTool('run', 'download', [25_000_000]);
  const u = await askTool('run', 'upload', [10_000_000]);
  const mbps = (line?: string) => ((Number((line ?? '0').split(' ')[0]) * 8) / 1e6).toFixed(0);
  return `Download about ${mbps(d.out[0])} megabits per second, upload about ${mbps(u.out[0])}.`;
}
