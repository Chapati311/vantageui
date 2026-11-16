import { useLayoutEffect, useState, type RefObject } from 'react';
import { COLS, type Slot } from './layout';

/** The measured size of the grid, in pixels. */
export interface GridMetrics {
  /** Width and height of one cell */
  cell: number;
  /** Space between cells */
  gap: number;
  /** Distance from one page to the next (the screen width) */
  pitch: number;
  /** Where the grid starts inside the home screen */
  originX: number;
  originY: number;
}

/** Measures the grid and re-measures when the screen size changes. */
export function useGridMetrics(
  surfaceRef: RefObject<HTMLElement | null>,
  gridRef: RefObject<HTMLElement | null>,
): GridMetrics | null {
  const [metrics, setMetrics] = useState<GridMetrics | null>(null);

  useLayoutEffect(() => {
    const surface = surfaceRef.current;
    const grid = gridRef.current;
    if (!surface || !grid) return;

    const measure = () => {
      const s = surface.getBoundingClientRect();
      const g = grid.getBoundingClientRect();
      const gap = parseFloat(getComputedStyle(grid).getPropertyValue('--space-grid')) || 12;
      setMetrics({
        cell: (g.width - gap * (COLS - 1)) / COLS,
        gap,
        pitch: s.width,
        originX: g.left - s.left,
        originY: g.top - s.top,
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(surface);
    return () => observer.disconnect();
  }, [surfaceRef, gridRef]);

  return metrics;
}

/** Pixel position and size of a slot, measured from the start of page 0. */
export function slotRect(slot: Slot, m: GridMetrics) {
  const step = m.cell + m.gap;
  return {
    x: slot.page * m.pitch + slot.col * step,
    y: slot.row * step,
    width: slot.w * m.cell + (slot.w - 1) * m.gap,
    height: slot.h * m.cell + (slot.h - 1) * m.gap,
  };
}

/** How far the row of pages is shifted to show `page`. */
export function trackTransform(page: number, pitch: number, extra = 0): string {
  return `translate3d(${-page * pitch + extra}px, 0, 0)`;
}
