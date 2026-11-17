import { useRef, useState } from 'react';
import { playSound } from '../../../system/sounds';
import { reportScore, useArcade } from '../arcadeStore';
import { GameFrame } from '../GameFrame';
import { prepareCanvas, readInk, useFrames, useKeys, useTouches } from '../gameKit';
import styles from '../Arcade.module.css';

const COLS = 10;
const ROWS = 18;
const CELL = 18;
const W = COLS * CELL;
const H = ROWS * CELL;

/** The seven pieces, each as a list of filled cells. */
const PIECES = [
  [[0, 0], [1, 0], [2, 0], [3, 0]],
  [[0, 0], [1, 0], [0, 1], [1, 1]],
  [[0, 0], [1, 0], [2, 0], [1, 1]],
  [[0, 0], [1, 0], [2, 0], [0, 1]],
  [[0, 0], [1, 0], [2, 0], [2, 1]],
  [[1, 0], [2, 0], [0, 1], [1, 1]],
  [[0, 0], [1, 0], [1, 1], [2, 1]],
];

type Cells = number[][];
interface Piece {
  cells: Cells;
  x: number;
  y: number;
}

const emptyBoard = () => Array.from({ length: ROWS }, () => Array<number>(COLS).fill(0));
const newPiece = (): Piece => ({ cells: PIECES[Math.floor(Math.random() * PIECES.length)].map(([x, y]) => [x, y]), x: 3, y: 0 });
const rotate = (cells: Cells): Cells => cells.map(([x, y]) => [1 - y + 1, x]);

/** Blocks: fit the falling pieces into full lines. Swipe to move, tap to turn, swipe down to drop. */
export function Blocks() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { best } = useArcade();
  const [phase, setPhase] = useState<'ready' | 'playing' | 'over'>('ready');
  const [score, setScore] = useState(0);
  const g = useRef({ board: emptyBoard(), piece: newPiece(), timer: 0, score: 0, lines: 0 });

  const fits = (piece: Piece) =>
    piece.cells.every(([cx, cy]) => {
      const x = piece.x + cx;
      const y = piece.y + cy;
      return x >= 0 && x < COLS && y < ROWS && (y < 0 || !g.current.board[y][x]);
    });

  const start = () => {
    g.current = { board: emptyBoard(), piece: newPiece(), timer: 0, score: 0, lines: 0 };
    setScore(0);
    setPhase('playing');
  };

  const lock = () => {
    const s = g.current;
    for (const [cx, cy] of s.piece.cells) if (s.piece.y + cy >= 0) s.board[s.piece.y + cy][s.piece.x + cx] = 1;
    const kept = s.board.filter((row) => row.some((cell) => !cell));
    const cleared = ROWS - kept.length;
    if (cleared) {
      s.board = [...Array.from({ length: cleared }, () => Array<number>(COLS).fill(0)), ...kept];
      s.lines += cleared;
      s.score += [0, 100, 300, 500, 800][cleared];
      setScore(s.score);
      playSound('unlock');
    } else playSound('tick');
    s.piece = newPiece();
    if (!fits(s.piece)) {
      reportScore('blocks', s.score);
      playSound('toggleOff');
      setPhase('over');
    }
  };

  const move = (dx: number, dy: number) => {
    const s = g.current;
    const moved = { ...s.piece, x: s.piece.x + dx, y: s.piece.y + dy };
    if (fits(moved)) {
      s.piece = moved;
      return true;
    }
    if (dy > 0) lock();
    return false;
  };

  const act = (action: 'left' | 'right' | 'down' | 'turn' | 'drop') => {
    if (phase !== 'playing') return start();
    const s = g.current;
    if (action === 'left') move(-1, 0);
    if (action === 'right') move(1, 0);
    if (action === 'down') move(0, 1);
    if (action === 'drop') while (move(0, 1));
    if (action === 'turn') {
      const turned = { ...s.piece, cells: rotate(s.piece.cells) };
      for (const kick of [0, -1, 1, -2, 2]) {
        const candidate = { ...turned, x: turned.x + kick };
        if (fits(candidate)) {
          s.piece = candidate;
          break;
        }
      }
    }
  };

  useTouches(canvas, {
    onTap: () => act('turn'),
    onSwipe: (direction) => act(direction === 'left' ? 'left' : direction === 'right' ? 'right' : direction === 'down' ? 'drop' : 'turn'),
  });
  useKeys((key) => act(key === 'action' ? 'drop' : key === 'up' ? 'turn' : key));

  useFrames(true, (dt) => {
    const s = g.current;
    if (phase === 'playing') {
      s.timer += dt;
      const speed = Math.max(0.12, 0.6 - s.lines * 0.02);
      if (s.timer > speed) {
        s.timer = 0;
        move(0, 1);
      }
    }
    const context = canvas.current && prepareCanvas(canvas.current, W, H);
    if (!context) return;
    const ink = readInk();
    context.clearRect(0, 0, W, H);
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        context.fillStyle = s.board[y][x] ? ink.ink : ink.ghost;
        context.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
      }
    }
    context.fillStyle = ink.accent;
    for (const [cx, cy] of s.piece.cells) {
      if (s.piece.y + cy >= 0) context.fillRect((s.piece.x + cx) * CELL + 1, (s.piece.y + cy) * CELL + 1, CELL - 2, CELL - 2);
    }
  });

  return (
    <GameFrame
      score={score}
      best={best.blocks ?? 0}
      message={phase === 'ready' ? 'Tap to start' : phase === 'over' ? 'Game over' : null}
      detail={phase === 'ready' ? 'Swipe to move, tap to turn' : phase === 'over' ? 'Tap to play again' : null}
    >
      <canvas ref={canvas} className={styles.canvas} style={{ width: W, height: H }} />
    </GameFrame>
  );
}
