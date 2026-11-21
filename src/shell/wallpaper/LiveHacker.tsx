import { useEffect, useRef, useState } from 'react';
import { useBleScan, distanceOf } from '../../apps/netrunner/BleTool';
import { askTool, hasRootTools, isPrivateIp } from '../../system/rootTools';
import styles from './LiveCodeRain.module.css';

/*
 * Hacker mode's other live wallpapers (HACKER_MODE.md 1), all from real data:
 *  Globe   - a turning wireframe globe with arcs from you to the servers this
 *            phone is talking to right now (its open connections, located)
 *  Radar   - real nearby Bluetooth LE devices as blips on a sweep
 *  Network - the devices on your Wi-Fi from Netrunner's last map scan
 * Canvas at about 20 frames a second; they stop when paused.
 */

const cssVar = (name: string, fallback: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

function useCanvas(paused: boolean | undefined, draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  useEffect(() => {
    const el = ref.current;
    const ctx = el?.getContext('2d');
    if (!el || !ctx) return;
    const scale = Math.min(2, window.devicePixelRatio || 1);
    el.width = el.clientWidth * scale;
    el.height = el.clientHeight * scale;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    // Paused (or a preview tile): one still frame
    if (paused) {
      drawRef.current(ctx, el.clientWidth, el.clientHeight, 4000);
      return;
    }
    let frame = 0;
    let last = 0;
    const tick = (t: number) => {
      frame = requestAnimationFrame(tick);
      if (t - last < 50) return;
      last = t;
      drawRef.current(ctx, el.clientWidth, el.clientHeight, t);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [paused]);
  return ref;
}

// ---- Globe ----

interface Place {
  lat: number;
  lon: number;
}
const LOC_KEY = 'vantage.ipLocations.v1';
let locations: Record<string, Place | null> = (() => {
  try {
    return JSON.parse(localStorage.getItem(LOC_KEY) ?? '{}') as Record<string, Place | null>;
  } catch {
    return {};
  }
})();
async function locate(ip: string): Promise<Place | null> {
  if (ip in locations) return locations[ip];
  try {
    const j = (await (await fetch(`https://ipinfo.io/${ip}/json`)).json()) as { loc?: string };
    const [lat, lon] = (j.loc ?? '').split(',').map(Number);
    locations[ip] = Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
  } catch {
    locations[ip] = null;
  }
  try {
    locations = Object.fromEntries(Object.entries(locations).slice(-300));
    localStorage.setItem(LOC_KEY, JSON.stringify(locations));
  } catch {
    // kept until reload
  }
  return locations[ip];
}

export function LiveGlobe({ paused }: { paused?: boolean }) {
  const [me, setMe] = useState<Place | null>(null);
  const [servers, setServers] = useState<Place[]>([]);
  useEffect(() => {
    if (!hasRootTools() || paused) return;
    let alive = true;
    const load = async () => {
      const pub = await askTool('run', 'publicip').catch(() => null);
      try {
        const [lat, lon] = ((JSON.parse(pub?.out.join('') ?? '{}') as { loc?: string }).loc ?? '').split(',').map(Number);
        if (alive && Number.isFinite(lat)) setMe({ lat, lon });
      } catch {
        // no location
      }
      const conns = await askTool('run', 'connections').catch(() => null);
      const ips = [...new Set((conns?.out ?? []).map((l) => l.match(/->\[?([\d.]+)\]?:\d+/)?.[1]).filter((ip): ip is string => !!ip && !isPrivateIp(ip)))].slice(0, 24);
      const found = (await Promise.all(ips.map(locate))).filter((p): p is Place => !!p);
      if (alive) setServers(found);
    };
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [paused]);

  const ref = useCanvas(paused, (ctx, w, h, t) => {
    const bg = cssVar('--color-bg', '#000');
    const accent = cssVar('--color-accent', '#33ff66');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const R = Math.min(w, h) * 0.42;
    const cx = w / 2;
    const cy = h * 0.46;
    const spin = (t / 1000) * 0.12; // radians a second
    const tilt = 0.35;
    const project = (lat: number, lon: number) => {
      const la = (lat * Math.PI) / 180;
      const lo = (lon * Math.PI) / 180 + spin;
      const x = Math.cos(la) * Math.sin(lo);
      const y = Math.sin(la);
      const z = Math.cos(la) * Math.cos(lo);
      // tilt toward the viewer
      const y2 = y * Math.cos(tilt) - z * Math.sin(tilt);
      const z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
      return { x: cx + x * R, y: cy - y2 * R, front: z2 > 0 };
    };
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = accent;
    // Wireframe: parallels and meridians, the back half fainter
    for (let lat = -60; lat <= 60; lat += 30)
      for (let lon = -180; lon < 180; lon += 6) {
        const a = project(lat, lon);
        const b = project(lat, lon + 6);
        ctx.globalAlpha = a.front ? 0.5 : 0.1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    for (let lon = -180; lon < 180; lon += 30)
      for (let lat = -90; lat < 90; lat += 6) {
        const a = project(lat, lon);
        const b = project(lat + 6, lon);
        ctx.globalAlpha = a.front ? 0.5 : 0.1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    // Arcs from you to each server, lifted off the surface
    const home = me ?? { lat: 47.37, lon: 8.54 };
    const h0 = project(home.lat, home.lon);
    ctx.lineWidth = 1.2;
    for (const s of servers) {
      ctx.beginPath();
      let started = false;
      for (let i = 0; i <= 24; i++) {
        const f = i / 24;
        const lift = 1 + Math.sin(f * Math.PI) * 0.18;
        const p = project(home.lat + (s.lat - home.lat) * f, home.lon + (s.lon - home.lon) * f);
        const x = cx + (p.x - cx) * lift;
        const y = cy + (p.y - cy) * lift;
        ctx.globalAlpha = p.front ? 0.8 : 0.15;
        if (!started) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        started = true;
      }
      ctx.stroke();
      const p = project(s.lat, s.lon);
      ctx.globalAlpha = p.front ? 1 : 0.2;
      ctx.fillStyle = accent;
      ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
    }
    ctx.globalAlpha = h0.front ? 1 : 0.3;
    ctx.beginPath();
    ctx.arc(h0.x, h0.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.globalAlpha = 1;
  });
  return <canvas ref={ref} className={styles.rain} aria-hidden="true" />;
}

// ---- Bluetooth radar ----

export function LiveRadar({ paused }: { paused?: boolean }) {
  const { devices } = useBleScan(!paused);
  const ref = useCanvas(paused, (ctx, w, h, t) => {
    const bg = cssVar('--color-bg', '#000');
    const accent = cssVar('--color-accent', '#33ff66');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h * 0.46;
    const R = Math.min(w, h) * 0.44;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 0.8;
    for (let i = 1; i <= 4; i++) {
      ctx.globalAlpha = 0.32;
      ctx.beginPath();
      ctx.arc(cx, cy, (R * i) / 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    const sweep = ((t / 2400) % 1) * Math.PI * 2 - Math.PI / 2;
    for (let i = 0; i < 18; i++) {
      ctx.globalAlpha = 0.28 * (1 - i / 18);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, sweep - (i + 1) * 0.03, sweep - i * 0.03);
      ctx.closePath();
      ctx.fillStyle = accent;
      ctx.fill();
    }
    for (const d of devices) {
      const angle = ([...d.id].reduce((s, c) => s + c.charCodeAt(0), 0) % 360) * (Math.PI / 180);
      const r = Math.min(R, R * 0.12 + distanceOf(d.rssi) * (R / 10));
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      // Blips glow right after the sweep passes them
      const since = (((sweep - angle) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      ctx.globalAlpha = 0.35 + 0.65 * Math.max(0, 1 - since / 2);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
  return <canvas ref={ref} className={styles.rain} aria-hidden="true" />;
}

// ---- Network graph ----

interface Known {
  ip: string;
  name?: string;
  vendor: string;
}

export function LiveNetGraph({ paused }: { paused?: boolean }) {
  const nodes = useRef<{ label: string; x: number; y: number; vx: number; vy: number }[]>([]);
  useEffect(() => {
    try {
      const all = JSON.parse(localStorage.getItem('netrunner.devices.v1') ?? '{}') as Record<string, Record<string, Known>>;
      const list = Object.values(all).flatMap((net) => Object.values(net)).slice(0, 40);
      nodes.current = list.map((d) => ({ label: d.name ?? d.ip.split('.').pop() ?? '?', x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.0008, vy: (Math.random() - 0.5) * 0.0008 }));
    } catch {
      nodes.current = [];
    }
    if (!nodes.current.length) nodes.current = Array.from({ length: 12 }, (_, i) => ({ label: `.${i + 2}`, x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.0008, vy: (Math.random() - 0.5) * 0.0008 }));
  }, []);
  const ref = useCanvas(paused, (ctx, w, h) => {
    const bg = cssVar('--color-bg', '#000');
    const accent = cssVar('--color-accent', '#33ff66');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const list = nodes.current;
    for (const n of list) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0.05 || n.x > 0.95) n.vx *= -1;
      if (n.y < 0.08 || n.y > 0.85) n.vy *= -1;
    }
    const hub = { x: w / 2, y: h * 0.46 };
    ctx.strokeStyle = accent;
    ctx.fillStyle = accent;
    ctx.font = '9px ui-monospace, Menlo, monospace';
    ctx.lineWidth = 0.7;
    for (const n of list) {
      const x = n.x * w;
      const y = n.y * h;
      ctx.globalAlpha = 0.32;
      ctx.beginPath();
      ctx.moveTo(hub.x, hub.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      // Close neighbours link to each other too
      for (const m of list) {
        const dx = (m.x - n.x) * w;
        const dy = (m.y - n.y) * h;
        if (m !== n && dx * dx + dy * dy < 90 * 90) {
          ctx.globalAlpha = 0.2;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(m.x * w, m.y * h);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(x, y, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.5;
      ctx.fillText(n.label.slice(0, 12), x + 5, y + 3);
    }
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(hub.x, hub.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });
  return <canvas ref={ref} className={styles.rain} aria-hidden="true" />;
}
