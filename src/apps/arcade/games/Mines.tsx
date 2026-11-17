import { useRef, useState } from 'react';
import { playSound } from '../../../system/sounds';
import { reportScore, useArcade } from '../arcadeStore';
import { GameFrame } from '../GameFrame';
import styles from '../Arcade.module.css';

const SIZE = 9;
const MINES = 10;

interface Cell {
  mine: boolean;
  open: boolean;
  flag: boolean;
  /** Mines around it */
  near: number;
}

const neighbours = (index: number) => {
  const x = index % SIZE;
  const y = Math.floor(index / SIZE);
  const list: number[] = [];
  for (let dy = -1; dy <= 1; dy += 1)
    for (let dx = -1; dx <= 1; dx += 1) {
      const nx = x + dx;
      const ny = y + dy;
      if ((dx || dy) && nx >= 0 && ny >= 0 && nx < SIZE && ny < SIZE) list.push(ny * SIZE + nx);
    }
  return list;
};

/** Mines are placed after the first tap, so the first tap is always safe. */
function makeBoard(safe: number): Cell[] {
  const cells: Cell[] = Array.from({ length: SIZE * SIZE }, () => ({ mine: false, open: false, flag: false, near: 0 }));
  const forbidden = new Set([safe, ...neighbours(safe)]);
  let placed = 0;
  while (placed < MINES) {
    const index = Math.floor(Math.random() * cells.length);
    if (cells[index].mine || forbidden.has(index)) continue;
    cells[index].mine = true;
    placed += 1;
  }
  cells.forEach((cell, index) => (cell.near = neighbours(index).filter((n) => cells[n].mine).length));
  return cells;
}

/** Minesweeper: tap to dig, hold to flag. Clear every safe square. Score = seconds left of 999. */
export function Mines() {
  const { best } = useArcade();
  const [cells, setCells] = useState<Cell[] | null>(null);
  const [phase, setPhase] = useState<'playing' | 'lost' | 'won'>('playing');
  const [flagMode, setFlagMode] = useState(false);
  const startedAt = useRef(0);
  const holdTimer = useRef(0);
  const held = useRef(false);
  const [score, setScore] = useState(0);

  const reset = () => {
    setCells(null);
    setPhase('playing');
    setScore(0);
  };

  const open = (index: number) => {
    if (phase !== 'playing') return reset();
    let board = cells;
    if (!board) {
      board = makeBoard(index);
      startedAt.current = Date.now();
    }
    const next = board.map((cell) => ({ ...cell }));
    if (next[index].flag || next[index].open) return;
    if (next[index].mine) {
      next.forEach((cell) => cell.mine && (cell.open = true));
      setCells(next);
      setPhase('lost');
      playSound('toggleOff');
      return;
    }
    // Open the square, and spread through squares with no mines around
    const queue = [index];
    while (queue.length) {
      const current = queue.pop()!;
      if (next[current].open) continue;
      next[current].open = true;
      if (next[current].near === 0) queue.push(...neighbours(current).filter((n) => !next[n].open && !next[n].flag));
    }
    setCells(next);
    playSound('tick');
    if (next.every((cell) => cell.mine || cell.open)) {
      const points = Math.max(1, 999 - Math.round((Date.now() - startedAt.current) / 1000));
      setScore(points);
      reportScore('mines', points);
      setPhase('won');
      playSound('unlock');
    }
  };

  const flag = (index: number) => {
    if (!cells || phase !== 'playing' || cells[index].open) return;
    setCells(cells.map((cell, i) => (i === index ? { ...cell, flag: !cell.flag } : cell)));
    playSound('toggleOn');
  };

  const flags = cells?.filter((cell) => cell.flag).length ?? 0;

  return (
    <GameFrame
      score={score}
      best={best.mines ?? 0}
      message={phase === 'lost' ? 'Boom' : phase === 'won' ? 'Cleared' : null}
      detail={phase !== 'playing' ? 'Tap to play again' : null}
      controls={
        <>
          <span className="label">{MINES - flags} mines left</span>
          <button type="button" className={`${styles.modeButton} ${flagMode ? styles.modeOn : ''}`} onClick={() => setFlagMode(!flagMode)}>
            {flagMode ? 'Flagging' : 'Digging'}
          </button>
        </>
      }
    >
      <div className={styles.mines} role="grid" aria-label="Minefield">
        {(cells ?? Array.from({ length: SIZE * SIZE }, () => ({ mine: false, open: false, flag: false, near: 0 }))).map((cell, index) => (
          <button
            key={index}
            type="button"
            className={`${styles.mine} ${cell.open ? styles.mineOpen : ''} ${cell.open && cell.mine ? styles.mineBoom : ''}`}
            onPointerDown={() => {
              held.current = false;
              holdTimer.current = window.setTimeout(() => {
                held.current = true;
                flag(index);
              }, 400);
            }}
            onPointerUp={() => window.clearTimeout(holdTimer.current)}
            onPointerLeave={() => window.clearTimeout(holdTimer.current)}
            onContextMenu={(event) => event.preventDefault()}
            onClick={() => {
              if (held.current) return;
              if (flagMode) flag(index);
              else open(index);
            }}
            aria-label={cell.open ? (cell.mine ? 'Mine' : `${cell.near}`) : cell.flag ? 'Flag' : 'Hidden'}
          >
            {cell.open ? (cell.mine ? '●' : cell.near || '') : cell.flag ? '⚑' : ''}
          </button>
        ))}
      </div>
    </GameFrame>
  );
}
