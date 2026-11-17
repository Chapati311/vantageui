import { useRef, useState } from 'react';
import { playSound } from '../../../system/sounds';
import { reportScore, useArcade } from '../arcadeStore';
import { GameFrame } from '../GameFrame';
import { prepareCanvas, readInk, useFrames, useKeys, useTouches } from '../gameKit';
import styles from '../Arcade.module.css';

const W = 300;
const H = 360;
const COLS = 8;
const ROWS = 5;
const BRICK_H = 12;
const PADDLE_W = 60;
const BALL = 7;

const freshBricks = () => Array.from({ length: COLS * ROWS }, () => true);

/** Breakout: bounce the ball off your paddle and clear every brick. 3 lives. */
export function Breakout() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { best } = useArcade();
  const [phase, setPhase] = useState<'ready' | 'playing' | 'over' | 'won'>('ready');
  const [score, setScore] = useState(0);
  const g = useRef({ paddle: W / 2, x: W / 2, y: H - 40, vx: 120, vy: -220, bricks: freshBricks(), lives: 3, score: 0 });

  const start = () => {
    g.current = { paddle: W / 2, x: W / 2, y: H - 40, vx: 120, vy: -220, bricks: freshBricks(), lives: 3, score: 0 };
    setScore(0);
    setPhase('playing');
  };

  useTouches(canvas, { onMove: (x) => (g.current.paddle = x * W), onTap: () => phase !== 'playing' && start() });
  useKeys((key) => {
    if (key === 'action' && phase !== 'playing') start();
    if (key === 'left') g.current.paddle -= 30;
    if (key === 'right') g.current.paddle += 30;
  });

  const brickW = (W - 8) / COLS;

  useFrames(true, (dt) => {
    const s = g.current;
    s.paddle = Math.min(W - PADDLE_W / 2, Math.max(PADDLE_W / 2, s.paddle));
    if (phase === 'playing') {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.x < BALL / 2 || s.x > W - BALL / 2) s.vx = -s.vx;
      if (s.y < BALL / 2) s.vy = Math.abs(s.vy);
      if (s.vy > 0 && s.y > H - 22 && s.y < H - 10 && Math.abs(s.x - s.paddle) < PADDLE_W / 2 + BALL / 2) {
        s.vy = -Math.abs(s.vy);
        s.vx = (s.x - s.paddle) * 6;
        playSound('tick');
      }
      // Bricks
      const col = Math.floor((s.x - 4) / brickW);
      const row = Math.floor((s.y - 30) / (BRICK_H + 4));
      const index = row * COLS + col;
      if (row >= 0 && row < ROWS && col >= 0 && col < COLS && s.bricks[index]) {
        s.bricks[index] = false;
        s.vy = -s.vy;
        s.score += (ROWS - row) * 10;
        setScore(s.score);
        playSound('toggleOn');
        if (s.bricks.every((brick) => !brick)) {
          reportScore('breakout', s.score);
          setPhase('won');
        }
      }
      if (s.y > H) {
        s.lives -= 1;
        playSound('toggleOff');
        if (s.lives <= 0) {
          reportScore('breakout', s.score);
          setPhase('over');
        } else {
          s.x = W / 2;
          s.y = H - 40;
          s.vx = 120;
          s.vy = -220;
        }
      }
    }
    const context = canvas.current && prepareCanvas(canvas.current, W, H);
    if (!context) return;
    const ink = readInk();
    context.clearRect(0, 0, W, H);
    s.bricks.forEach((alive, i) => {
      context.fillStyle = alive ? (Math.floor(i / COLS) === 0 ? ink.accent : ink.ink) : ink.ghost;
      context.fillRect(4 + (i % COLS) * brickW + 1, 30 + Math.floor(i / COLS) * (BRICK_H + 4), brickW - 2, BRICK_H);
    });
    context.fillStyle = ink.ink;
    context.fillRect(s.paddle - PADDLE_W / 2, H - 16, PADDLE_W, 6);
    context.fillRect(s.x - BALL / 2, s.y - BALL / 2, BALL, BALL);
    context.fillStyle = ink.dim;
    for (let life = 0; life < s.lives; life += 1) context.fillRect(W - 14 - life * 10, 10, 6, 6);
  });

  return (
    <GameFrame
      score={score}
      best={best.breakout ?? 0}
      message={phase === 'ready' ? 'Tap to start' : phase === 'over' ? 'Game over' : phase === 'won' ? 'Cleared' : null}
      detail={phase === 'over' || phase === 'won' ? 'Tap to play again' : phase === 'ready' ? 'Drag the paddle' : null}
    >
      <canvas ref={canvas} className={styles.canvas} style={{ width: W, height: H }} />
    </GameFrame>
  );
}
