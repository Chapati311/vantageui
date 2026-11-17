import type { PetMood } from '../petStore';
import styles from '../Arcade.module.css';

/**
 * Vanta drawn on a 12x12 pixel grid. 1 = body, 2 = eye, 3 = mouth.
 * The face changes with its mood; unlit pixels show as faint ghosts.
 */
const BODY = [
  '............',
  '...1....1...',
  '..111..111..',
  '..11111111..',
  '.1111111111.',
  '.1122112211.',
  '.1111111111.',
  '.11113311111',
  '.1111111111.',
  '..11111111..',
  '..1.1..1.1..',
  '............',
];

const MOUTHS: Record<PetMood, string[]> = {
  happy: ['.1113333111.', '.1111331111.'],
  okay: ['.1111331111.', '.1111111111.'],
  hungry: ['.1111331111.', '.1113113111.'],
  sad: ['.1111111111.', '.1113333111.'],
};

export function PetSprite({ mood, size, bounce }: { mood: PetMood; size: number; bounce?: boolean }) {
  const rows = [...BODY.slice(0, 7), ...MOUTHS[mood], ...BODY.slice(9)];
  const pixel = size / 12;
  return (
    <svg className={`${styles.pet} ${bounce ? styles.petBounce : ''}`} width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Vanta looks ${mood}`}>
      {rows.flatMap((row, y) =>
        [...row].map((value, x) => (
          <rect
            key={`${x}-${y}`}
            x={x * pixel + 0.5}
            y={y * pixel + 0.5}
            width={pixel - 1}
            height={pixel - 1}
            className={value === '1' ? styles.petBody : value === '2' ? styles.petEye : value === '3' ? styles.petMouth : styles.petOff}
          />
        )),
      )}
    </svg>
  );
}
