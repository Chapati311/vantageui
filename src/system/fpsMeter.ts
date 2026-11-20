/**
 * Hidden FPS meter (REAL_OS_PROMPT Part 0). While on, it measures every frame
 * and every 2 seconds writes one line to the console, which reaches the
 * phone's log (vantage-tweak: `make weblog`):
 *   [fps] 58.9 fps, p95 18.1 ms, worst 41.0 ms, 3 dropped (of 118)
 * Lines are only written while something moves (or a frame was slow), so a
 * still screen stays quiet.
 * On: `make fps` on the phone, `?fps=1` in the address, or window.vantageFps(true).
 * It is remembered (localStorage) until switched off.
 */
const KEY = 'vantage.fpsMeter';
const REPORT_MS = 2000;
/** A frame is "dropped" when it takes more than 1.5 frames at 60 Hz. */
const DROPPED_MS = 25;

let running = false;
let frame = 0;
let last = 0;
let windowStart = 0;
let times: number[] = [];

function tick(now: number) {
  if (!running) return;
  if (last) times.push(now - last);
  last = now;
  if (now - windowStart >= REPORT_MS && times.length) {
    report();
    windowStart = now;
    times = [];
  }
  frame = requestAnimationFrame(tick);
}

function report() {
  const sorted = [...times].sort((a, b) => a - b);
  const total = times.reduce((sum, t) => sum + t, 0);
  const fps = (times.length / total) * 1000;
  const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
  const worst = sorted[sorted.length - 1];
  const dropped = times.filter((t) => t > DROPPED_MS).length;
  // Idle screens (no motion) still tick at 60 fps: only report useful windows.
  if (dropped === 0 && worst < 20 && fps > 58) return;
  console.warn(
    `[fps] ${fps.toFixed(1)} fps, p95 ${p95.toFixed(1)} ms, worst ${worst.toFixed(1)} ms, ${dropped} dropped (of ${times.length})`,
  );
}

/** Switches the meter on or off (no argument = toggle). Returns the new state. */
export function setFpsMeter(on?: boolean): boolean {
  const next = on ?? !running;
  try {
    if (next) localStorage.setItem(KEY, '1');
    else localStorage.removeItem(KEY);
  } catch {
    // storage blocked: on for this session only
  }
  if (next && !running) {
    running = true;
    last = 0;
    windowStart = performance.now();
    times = [];
    frame = requestAnimationFrame(tick);
    console.warn('[fps] meter on');
  } else if (!next && running) {
    running = false;
    cancelAnimationFrame(frame);
    console.warn('[fps] meter off');
  }
  return running;
}

declare global {
  interface Window {
    vantageFps?: (on?: boolean) => boolean;
  }
}

export function installFpsMeter(): void {
  window.vantageFps = setFpsMeter;
  let saved = false;
  try {
    saved = localStorage.getItem(KEY) === '1';
  } catch {
    // ignore
  }
  if (saved || new URLSearchParams(window.location.search).get('fps') === '1') setFpsMeter(true);
}
