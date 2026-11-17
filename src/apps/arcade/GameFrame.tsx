import type { ReactNode } from 'react';
import { DotNumber } from '../../components/DotNumber';
import styles from './Arcade.module.css';

interface GameFrameProps {
  score: number;
  best: number;
  /** Shown over the board: "Tap to start", "Game over", ... (nothing while playing) */
  message?: string | null;
  /** A smaller second line under the message */
  detail?: string | null;
  children: ReactNode;
  /** Buttons under the board */
  controls?: ReactNode;
}

/** The board of every game: score and best at the top, the game, a message over it. */
export function GameFrame({ score, best, message, detail, children, controls }: GameFrameProps) {
  return (
    <div className={styles.game}>
      <div className={styles.scores}>
        <div className={styles.score}>
          <span className="label">Score</span>
          <DotNumber value={String(score)} size={28} />
        </div>
        <div className={styles.score}>
          <span className="label">Best</span>
          <DotNumber value={String(best)} size={28} muted />
        </div>
      </div>
      <div className={styles.board}>
        {children}
        {message && (
          <div className={styles.message}>
            <span className={styles.messageText}>{message}</span>
            {detail && <span className="label">{detail}</span>}
          </div>
        )}
      </div>
      {controls && <div className={styles.controls}>{controls}</div>}
    </div>
  );
}
