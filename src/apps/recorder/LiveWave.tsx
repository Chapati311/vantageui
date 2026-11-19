import { useEffect, useRef } from 'react';
import { micLevel } from '../../system/recordings';
import styles from './Recorder.module.css';

const COLUMNS = 28;
const ROWS = 9;

/**
 * The live waveform while recording: a dot grid where each column is a
 * moment of sound, scrolling left, lit from the middle out by how loud it
 * was. Drawn straight onto the dots (no React re-render per frame).
 */
export function LiveWave({ active }: { active: boolean }) {
  const grid = useRef<HTMLDivElement>(null);
  const history = useRef<number[]>(Array(COLUMNS).fill(0));

  useEffect(() => {
    const dots = grid.current ? ([...grid.current.children] as HTMLElement[]) : [];
    let frame = 0;
    let last = 0;
    const draw = (time: number) => {
      frame = requestAnimationFrame(draw);
      if (time - last < 66) return; // about 15 columns a second
      last = time;
      history.current = [...history.current.slice(1), active ? micLevel() : 0];
      history.current.forEach((level, column) => {
        const reach = Math.round(level * (ROWS / 2));
        for (let row = 0; row < ROWS; row += 1) {
          const distance = Math.abs(row - (ROWS - 1) / 2);
          // Silence: only a soft line through the middle
          dots[row * COLUMNS + column].dataset.on = level < 0.03 ? (distance === 0 ? 'soft' : '') : distance <= reach ? '1' : '';
        }
      });
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  return (
    <div ref={grid} className={styles.wave} aria-hidden="true" style={{ gridTemplateColumns: `repeat(${COLUMNS}, 1fr)` }}>
      {Array.from({ length: COLUMNS * ROWS }, (_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}
