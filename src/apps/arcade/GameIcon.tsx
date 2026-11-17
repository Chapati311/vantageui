import type { GameId } from './arcadeStore';
import styles from './Arcade.module.css';

/** A tiny 7x7 pixel picture of each game. 1 = lit pixel. */
const ICONS: Record<GameId, string[]> = {
  snake: ['.......', '.111...', '...1...', '...111.', '.....1.', '.1...1.', '.......'],
  pong: ['..111..', '.......', '...1...', '.......', '.......', '..111..', '.......'],
  blocks: ['.......', '..1....', '..11...', '..1....', '.......', '111.111', '1111111'],
  breakout: ['1111111', '1111111', '.......', '...1...', '.......', '..111..', '.......'],
  flappy: ['11...11', '11...11', '.......', '.1.....', '11...11', '11...11', '11...11'],
  '2048': ['11.11..', '11.11..', '.......', '11.1111', '11.1111', '...1111', '...1111'],
  mines: ['.......', '.1.1.1.', '..111..', '.11111.', '..111..', '.1.1.1.', '.......'],
  pet: ['.1...1.', '.11111.', '1111111', '1.111.1', '1111111', '.11111.', '.1...1.'],
};

export function GameIcon({ game, size = 28 }: { game: GameId; size?: number }) {
  const pixel = size / 7;
  return (
    <svg className={styles.gameIcon} width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {ICONS[game].flatMap((row, y) =>
        [...row].map((value, x) => (
          <rect key={`${x}-${y}`} x={x * pixel + 0.5} y={y * pixel + 0.5} width={pixel - 1} height={pixel - 1} className={value === '1' ? styles.iconOn : styles.iconOff} />
        )),
      )}
    </svg>
  );
}
