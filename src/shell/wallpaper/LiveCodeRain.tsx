import { useEffect, useRef } from 'react';
import { hostInfo } from '../../system/nativeBridge';
import { askTool, hasRootTools } from '../../system/rootTools';
import styles from './LiveCodeRain.module.css';

/** Text the rain is made of: this phone's real numbers when they're known, hex otherwise. */
async function realWords(): Promise<string[]> {
  const words = ['0x00', 'ff', 'root', 'vantage', '127.0.0.1', '::1'];
  try {
    const info = await hostInfo();
    if (info) words.push(info.model ?? '', `iOS ${info.iosVersion ?? ''}`);
    if (hasRootTools()) {
      const stats = (await askTool('run', 'stats')).data as { interfaces?: Record<string, { ipv4?: string; ipv6?: string }> } | null;
      Object.entries(stats?.interfaces ?? {}).forEach(([name, i]) => {
        if (i.ipv4) words.push(i.ipv4, name);
        if (i.ipv6) words.push(i.ipv6.split(':').slice(0, 3).join(':'));
      });
    }
    const battery = await (navigator as Navigator & { getBattery?: () => Promise<{ level: number }> }).getBattery?.();
    if (battery) words.push(`${Math.round(battery.level * 100)}%`);
  } catch {
    // hex only
  }
  return words.filter(Boolean);
}

/**
 * Hacker mode's live wallpaper (HACKER_MODE.md 1): columns of falling
 * characters in the accent colour, made from the phone's own data (its IP
 * addresses, model, battery). Drawn on a canvas at about 20 frames a second
 * (enough for rain, kind to the battery); stops when paused.
 */
export function LiveCodeRain({ paused }: { paused?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const words = useRef<string>('0123456789abcdef');

  useEffect(() => {
    let alive = true;
    void realWords().then((list) => {
      if (alive) words.current = `${list.join(' ')} 0123456789abcdef`;
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext('2d');
    if (!el || !ctx || paused) return;
    const scale = Math.min(2, window.devicePixelRatio || 1);
    const size = 14;
    const resize = () => {
      el.width = el.clientWidth * scale;
      el.height = el.clientHeight * scale;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
    };
    resize();
    const columns = Math.ceil(el.clientWidth / size);
    const drops = Array.from({ length: columns }, () => Math.random() * -40);
    const speeds = Array.from({ length: columns }, () => 0.35 + Math.random() * 0.65);
    const offsets = Array.from({ length: columns }, () => Math.floor(Math.random() * 1000));
    const style = getComputedStyle(document.documentElement);
    const bg = style.getPropertyValue('--color-bg').trim() || '#000';
    const accent = style.getPropertyValue('--color-accent').trim() || '#33ff66';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, el.clientWidth, el.clientHeight);
    ctx.font = `${size - 2}px ui-monospace, Menlo, monospace`;
    let last = 0;
    let frame = 0;
    const draw = (t: number) => {
      frame = requestAnimationFrame(draw);
      if (t - last < 50) return; // ~20 fps
      last = t;
      // Fade the old characters into the background (the trail)
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, el.clientWidth, el.clientHeight);
      ctx.globalAlpha = 1;
      const text = words.current;
      for (let i = 0; i < columns; i++) {
        const y = drops[i] * size;
        if (y > 0) {
          const char = text[(offsets[i] + Math.floor(drops[i])) % text.length];
          // The head of each column is brighter
          ctx.fillStyle = accent;
          ctx.globalAlpha = 0.85;
          ctx.fillText(char === ' ' ? '·' : char, i * size, y);
          ctx.globalAlpha = 1;
        }
        drops[i] += speeds[i];
        if (y > el.clientHeight && Math.random() > 0.975) {
          drops[i] = Math.random() * -20;
          offsets[i] = Math.floor(Math.random() * 1000);
        }
      }
    };
    frame = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, [paused]);

  return <canvas ref={canvas} className={styles.rain} aria-hidden="true" />;
}
