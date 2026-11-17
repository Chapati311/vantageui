import { useEffect, useRef, type RefObject } from 'react';

/**
 * Small helpers every Arcade game shares: the theme's colors for drawing on
 * a canvas, swipe/tap detection, and a frame loop that stops when hidden.
 */

export interface Ink {
  bg: string;
  ink: string;
  dim: string;
  ghost: string;
  accent: string;
}

let cached: { ink: Ink; at: number } | null = null;

/** The current theme's colors (read from the CSS variables, at most twice a second). */
export function readInk(): Ink {
  if (cached && performance.now() - cached.at < 500) return cached.ink;
  cached = { ink: readNow(), at: performance.now() };
  return cached.ink;
}

function readNow(): Ink {
  const css = getComputedStyle(document.documentElement);
  const value = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  const ink = value('--text-primary', '#ffffff');
  return {
    bg: value('--color-bg', '#06090d'),
    ink,
    dim: value('--text-secondary', '#8a939c'),
    ghost: value('--color-hairline', 'rgba(255,255,255,0.12)'),
    accent: value('--color-accent', '#2dd4bf'),
  };
}

export type Direction = 'up' | 'down' | 'left' | 'right';

/**
 * Calls onSwipe with the direction of a swipe, or onTap for a tap, on the
 * element. Optionally reports the finger's x (0-1) while it moves.
 */
export function useTouches(
  target: RefObject<HTMLElement | null>,
  handlers: { onSwipe?: (direction: Direction) => void; onTap?: () => void; onMove?: (x: number) => void; onHold?: () => void },
): void {
  const latest = useRef(handlers);
  latest.current = handlers;

  useEffect(() => {
    const element = target.current;
    if (!element) return;
    let startX = 0;
    let startY = 0;
    let holdTimer = 0;
    let held = false;

    const down = (event: PointerEvent) => {
      startX = event.clientX;
      startY = event.clientY;
      held = false;
      element.setPointerCapture(event.pointerId);
      window.clearTimeout(holdTimer);
      if (latest.current.onHold) {
        holdTimer = window.setTimeout(() => {
          held = true;
          latest.current.onHold?.();
        }, 450);
      }
      move(event);
    };
    const move = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      latest.current.onMove?.(Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)));
      if (Math.hypot(event.clientX - startX, event.clientY - startY) > 10) window.clearTimeout(holdTimer);
    };
    const up = (event: PointerEvent) => {
      window.clearTimeout(holdTimer);
      if (held) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) {
        latest.current.onTap?.();
        return;
      }
      if (Math.abs(dx) > Math.abs(dy)) latest.current.onSwipe?.(dx > 0 ? 'right' : 'left');
      else latest.current.onSwipe?.(dy > 0 ? 'down' : 'up');
    };

    const drag = (event: PointerEvent) => {
      if (event.buttons) move(event);
    };

    element.addEventListener('pointerdown', down);
    element.addEventListener('pointermove', drag);
    element.addEventListener('pointerup', up);
    return () => {
      element.removeEventListener('pointerdown', down);
      element.removeEventListener('pointermove', drag);
      element.removeEventListener('pointerup', up);
      window.clearTimeout(holdTimer);
    };
  }, [target]);
}

/** Arrow keys and space, for playing on a computer. */
export function useKeys(onKey: (key: Direction | 'action') => void): void {
  const latest = useRef(onKey);
  latest.current = onKey;
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      const map: Record<string, Direction | 'action'> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        ' ': 'action',
      };
      const key = map[event.key];
      if (!key) return;
      event.preventDefault();
      latest.current(key);
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);
}

/** Runs `step(seconds since last frame)` every frame while `running`; pauses when the page is hidden. */
export function useFrames(running: boolean, step: (dt: number) => void): void {
  const latest = useRef(step);
  latest.current = step;
  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (document.visibilityState === 'visible') latest.current(dt);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [running]);
}

/** Sets a canvas up for sharp drawing at the screen's pixel density. Returns the 2D context. */
export function prepareCanvas(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D | null {
  const ratio = window.devicePixelRatio || 1;
  if (canvas.width !== width * ratio) {
    canvas.width = width * ratio;
    canvas.height = height * ratio;
  }
  const context = canvas.getContext('2d');
  context?.setTransform(ratio, 0, 0, ratio, 0, 0);
  return context;
}
