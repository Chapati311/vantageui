import { useRef, useState } from 'react';
import { playSound } from '../../../system/sounds';
import { reportScore, useArcade } from '../arcadeStore';
import { GameFrame } from '../GameFrame';
import { useKeys, useTouches, type Direction } from '../gameKit';
import styles from '../Arcade.module.css';

type Board = number[];
const SIZE = 4;

function addTile(board: Board): Board {
  const empty = board.flatMap((value, index) => (value ? [] : [index]));
  if (!empty.length) return board;
  const next = [...board];
  next[empty[Math.floor(Math.random() * empty.length)]] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

const fresh = () => addTile(addTile(Array<number>(SIZE * SIZE).fill(0)));

/** Slides one line towards its start, merging equal neighbours once. */
function slideLine(line: number[]): { line: number[]; gained: number } {
  const values = line.filter(Boolean);
  const out: number[] = [];
  let gained = 0;
  for (let i = 0; i < values.length; i += 1) {
    if (values[i] === values[i + 1]) {
      out.push(values[i] * 2);
      gained += values[i] * 2;
      i += 1;
    } else out.push(values[i]);
  }
  while (out.length < SIZE) out.push(0);
  return { line: out, gained };
}

function slide(board: Board, direction: Direction): { board: Board; gained: number } {
  const next = [...board];
  let gained = 0;
  for (let i = 0; i < SIZE; i += 1) {
    const indexes = Array.from({ length: SIZE }, (_, j) => {
      if (direction === 'left') return i * SIZE + j;
      if (direction === 'right') return i * SIZE + (SIZE - 1 - j);
      if (direction === 'up') return j * SIZE + i;
      return (SIZE - 1 - j) * SIZE + i;
    });
    const result = slideLine(indexes.map((index) => board[index]));
    gained += result.gained;
    indexes.forEach((index, j) => (next[index] = result.line[j]));
  }
  return { board: next, gained };
}

const canMove = (board: Board) =>
  (['left', 'right', 'up', 'down'] as Direction[]).some((direction) => slide(board, direction).board.some((value, i) => value !== board[i]));

/** 2048: swipe to slide the tiles; equal tiles merge. Reach 2048. */
export function Game2048() {
  const area = useRef<HTMLDivElement>(null);
  const { best } = useArcade();
  const [board, setBoard] = useState(fresh);
  const [score, setScore] = useState(0);
  const over = !canMove(board);

  const move = (direction: Direction) => {
    if (over) {
      setBoard(fresh());
      setScore(0);
      return;
    }
    const result = slide(board, direction);
    if (result.board.every((value, i) => value === board[i])) return;
    const next = addTile(result.board);
    const total = score + result.gained;
    setBoard(next);
    setScore(total);
    playSound(result.gained ? 'toggleOn' : 'tick');
    if (!canMove(next)) reportScore('2048', total);
  };

  useTouches(area, { onSwipe: move, onTap: () => over && move('left') });
  useKeys((key) => key !== 'action' && move(key));

  return (
    <GameFrame score={score} best={best['2048'] ?? 0} message={over ? 'No moves left' : null} detail={over ? 'Tap to play again' : null}>
      <div ref={area} className={styles.grid2048} role="grid" aria-label="2048 board">
        {board.map((value, index) => (
          <div key={index} className={`${styles.tile} ${value >= 2048 ? styles.tileTop : ''}`} style={{ opacity: value ? 1 : 0.35 }} role="gridcell">
            {value || ''}
          </div>
        ))}
      </div>
    </GameFrame>
  );
}
