import { useTheme } from '../system/theme';
import type { DotSize } from '../theme/tokens';
import styles from './DotNumber.module.css';

/**
 * THE one style for dot-matrix numbers in the OS. Each character is drawn
 * on a grid of round dots, 7 dots tall, like an LED panel: lit dots in full
 * color, unlit dots faintly visible ("ghost" dots, about 7%). Because we draw
 * the dots ourselves (instead of using a font), a changing number lights its
 * dots up and down one by one instead of jumping.
 *
 * In retro themes the same numbers are drawn with SQUARE pixels on a hard
 * grid (and unlit pixels at 10%), like an old LCD. PixelNumber is that look,
 * always.
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
  // The decimal point: one dot on the bottom row
  '.': ['0', '0', '0', '0', '0', '0', '1'],
  ' ': ['000', '000', '000', '000', '000', '000', '000'],
};

/** A "1" without its empty side columns, for tight places (see `narrowOne`). */
const NARROW_ONE = ['010', '110', '010', '010', '010', '010', '111'];

/** The unlit column between two characters, so the ghost grid has no gaps. */
const SPACER = ['0', '0', '0', '0', '0', '0', '0'];

/** Milliseconds between one dot changing and the next, so digits change dot by dot. */
const DOT_STAGGER_MS = 6;

type Tone = 'primary' | 'secondary' | 'accent';

interface DotNumberProps {
  /** Digits, and optionally ":" "-" "." or spaces. E.g. "21:05" */
  value: string;
  /** Height of the digits in px: one of the design system sizes */
  size: DotSize;
  /** Draw in the secondary (grey) text color */
  muted?: boolean;
  /**
   * A clock: hours in the text color, minutes in the secondary color, and
   * the colon in the accent (or secondary, with `quietColon`).
   */
  clock?: boolean;
  /** For lists of clocks: the colon stays grey, so the page keeps one accent */
  quietColon?: boolean;
  /** The colon softly blinks once per second */
  blinkColon?: boolean;
  /**
   * For tight places (a one-cell circle): "1" is drawn narrower and the digits
   * sit closer together, so "100" fits. Digits are then not all the same width.
   */
  narrowOne?: boolean;
  /** Switch dots at once, with no fade. For numbers that change many times a second. */
  instant?: boolean;
  /** Square pixels instead of round dots (retro themes do this automatically) */
  pixels?: boolean;
}

/** One character (or spacer) as a small grid of dots. */
function DotCell({
  rows,
  pitch,
  size,
  tone,
  blink,
  pixels,
}: {
  rows: string[];
  pitch: number;
  size: number;
  tone: Tone;
  blink: boolean;
  pixels: boolean;
}) {
  const columns = rows[0].length;
  return (
    <svg
      className={`${styles[tone]} ${blink ? styles.blink : ''}`}
      width={columns * pitch}
      height={size}
      viewBox={`0 0 ${columns} ${ROWS}`}
      aria-hidden="true"
    >
      {rows.flatMap((row, y) =>
        [...row].map((cell, x) =>
          pixels ? (
            // A square pixel with a thin gap around it
            <rect
              key={`${x}-${y}`}
              className={cell === '1' ? styles.on : styles.off}
              x={x + 0.08}
              y={y + 0.08}
              width={0.84}
              height={0.84}
            />
          ) : (
            <circle
              key={`${x}-${y}`}
              className={cell === '1' ? styles.on : styles.off}
              style={{ transitionDelay: `${(y * columns + x) * DOT_STAGGER_MS}ms` }}
              cx={x + 0.5}
              cy={y + 0.5}
              r={0.42}
            />
          ),
        ),
      )}
    </svg>
  );
}

export function DotNumber({
  value,
  size,
  muted,
  clock,
  quietColon,
  blinkColon,
  narrowOne,
  instant,
  pixels,
}: DotNumberProps) {
  const theme = useTheme();
  const retro = theme.retro !== null;
  const square = pixels ?? retro;
  const pitch = size / ROWS; // distance between dot centres, in px
  const characters = [...value];
  const colonAt = characters.indexOf(':');

  const toneOf = (index: number): Tone => {
    if (muted) return 'secondary';
    if (!clock || colonAt < 0) return 'primary';
    if (index < colonAt) return 'primary';
    if (index === colonAt) return quietColon ? 'secondary' : 'accent';
    return 'secondary';
  };

  // Signature packs can draw numbers as serif numerals or segmented mono
  // instead of dots (same sizes, same colors per character)
  if (!pixels && theme.numerals !== 'dot') {
    return (
      <span
        className={`${styles.type} ${theme.numerals === 'serif' ? styles.typeSerif : styles.typeSegment}`}
        style={{ fontSize: size * (theme.numerals === 'serif' ? 1.32 : 1.12), height: size }}
        role="img"
        aria-label={value}
      >
        {characters.map((character, index) => (
          <span key={index} className={`${styles[toneOf(index)]} ${character === ':' && blinkColon ? styles.blink : ''}`}>
            {character}
          </span>
        ))}
      </span>
    );
  }

  return (
    <span
      className={`${styles.number} ${instant ? styles.instant : ''}`}
      // narrowOne packs the digits tighter, without the ghost spacer columns
      style={{ height: size, gap: narrowOne ? pitch / 2 : 0 }}
      role="img"
      aria-label={value}
    >
      {characters.flatMap((character, index) => {
        const rows =
          character === '1' && narrowOne ? NARROW_ONE : (GLYPHS[character] ?? GLYPHS[' ']);
        const tone = toneOf(index);
        // The position is the key: when the value changes, the SAME dots stay
        // on the page and only switch on or off (which CSS then fades).
        const cell = (
          <DotCell
            key={`c${index}`}
            rows={rows}
            pitch={pitch}
            size={size}
            tone={tone}
            blink={character === ':' && !!blinkColon}
            pixels={square}
          />
        );
        if (narrowOne || index === characters.length - 1) return [cell];
        return [cell, <DotCell key={`s${index}`} rows={SPACER} pitch={pitch} size={size} tone={tone} blink={false} pixels={square} />];
      })}
    </span>
  );
}

/** Dot-matrix numbers drawn with square LCD pixels, in any theme. */
export function PixelNumber(props: Omit<DotNumberProps, 'pixels'>) {
  return <DotNumber {...props} pixels />;
}
