import type { DotSize } from '../theme/tokens';
import styles from './DotNumber.module.css';

/**
 * THE one style for dot-matrix numbers in the OS. Each character is drawn
 * on a grid of round dots, 7 dots tall. Because we draw the dots ourselves
 * (instead of using a font), a changing number can light its dots up and
 * down one by one instead of jumping.
 */

const ROWS = 7;

/** 1 = lit dot. Digits are 5 dots wide. */
const GLYPHS: Record<string, string[]> = {
  '0': ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
  // The colon is only 1 dot wide: two single round dots
  ':': ['0', '0', '1', '0', '1', '0', '0'],
  ' ': ['000', '000', '000', '000', '000', '000', '000'],
};

/** A "1" without its empty side columns, for tight places (see `narrowOne`). */
const NARROW_ONE = ['010', '110', '010', '010', '010', '010', '111'];

/** Milliseconds between one dot changing and the next, so digits change dot by dot. */
const DOT_STAGGER_MS = 6;

interface DotNumberProps {
  /** Digits, and optionally ":" "-" or spaces. E.g. "21:05" */
  value: string;
  /** Height of the digits in px: one of the design system sizes */
  size: DotSize;
  /** Draw in the secondary (grey) text color */
  muted?: boolean;
  /** The colon softly blinks once per second */
  blinkColon?: boolean;
  /**
   * For tight places (a one-cell circle): "1" is drawn narrower and the digits
   * sit closer together, so "100" fits. Digits are then not all the same width.
   */
  narrowOne?: boolean;
}

export function DotNumber({ value, size, muted, blinkColon, narrowOne }: DotNumberProps) {
  const pitch = size / ROWS; // distance between dot centres, in px

  return (
    <span
      className={`${styles.number} ${muted ? styles.muted : ''}`}
      style={{ height: size, gap: narrowOne ? pitch / 2 : pitch }}
      role="img"
      aria-label={value}
    >
      {[...value].map((character, index) => {
        const rows =
          character === '1' && narrowOne ? NARROW_ONE : (GLYPHS[character] ?? GLYPHS[' ']);
        const columns = rows[0].length;
        return (
          <svg
            // The position is the key: when the value changes, the SAME dots stay
            // on the page and only switch on or off (which CSS then fades).
            key={index}
            className={character === ':' && blinkColon ? styles.blink : undefined}
            width={columns * pitch}
            height={size}
            viewBox={`0 0 ${columns} ${ROWS}`}
            aria-hidden="true"
          >
            {rows.flatMap((row, y) =>
              [...row].map((cell, x) => (
                <circle
                  key={`${x}-${y}`}
                  className={cell === '1' ? styles.on : styles.off}
                  style={{ transitionDelay: `${(y * columns + x) * DOT_STAGGER_MS}ms` }}
                  cx={x + 0.5}
                  cy={y + 0.5}
                  r={0.42}
                />
              )),
            )}
          </svg>
        );
      })}
    </span>
  );
}
