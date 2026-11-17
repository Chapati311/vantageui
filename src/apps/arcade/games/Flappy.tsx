import { useRef, useState } from 'react';
import { playSound } from '../../../system/sounds';
import { reportScore, useArcade } from '../arcadeStore';
import { GameFrame } from '../GameFrame';
import { prepareCanvas, readInk, useFrames, useKeys, useTouches } from '../gameKit';
import styles from '../Arcade.module.css';

const W = 300;
const H = 380;
const GAP = 110;
const PIPE_W = 40;
const BIRD = 14;
const GRAVITY = 900;
const FLAP = -300;
const SPEED = 110;

interface Pipe {
  x: number;
  gapY: number;
  passed: boolean;
}

/** Flap: tap to fly up through the gaps. One point per gap. */
export function Flappy() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { best } = useArcade();
  const [phase, setPhase] = useState<'ready' | 'playing' | 'over'>('ready');
  const [score, setScore] = useState(0);
  const g = useRef({ y: H / 2, vy: 0, pipes: [] as Pipe[], score: 0, t: 0 });

  const flap = () => {
    if (phase === 'over') {
      g.current = { y: H / 2, vy: FLAP, pipes: [], score: 0, t: 0 };
      setScore(0);
      setPhase('playing');
      return;
    }
    if (phase === 'ready') setPhase('playing');
    g.current.vy = FLAP;
    playSound('tick');
  };

  useTouches(canvas, { onTap: flap, onSwipe: flap });
  useKeys((key) => (key === 'action' || key === 'up') && flap());

  useFrames(true, (dt) => {
    const s = g.current;
    if (phase === 'playing') {
      s.t += dt;
      s.vy += GRAVITY * dt;
      s.y += s.vy * dt;
      if (!s.pipes.length || s.pipes[s.pipes.length - 1].x < W - 170) {
        s.pipes.push({ x: W + PIPE_W, gapY: 70 + Math.random() * (H - 140 - GAP), passed: false });
      }
      for (const pipe of s.pipes) {
        pipe.x -= SPEED * dt;
        if (!pipe.passed && pipe.x + PIPE_W < 60) {
          pipe.passed = true;
          s.score += 1;
          setScore(s.score);
          playSound('toggleOn');
        }
      }
      s.pipes = s.pipes.filter((pipe) => pipe.x > -PIPE_W);
      const hit =
        s.y < 0 ||
        s.y > H - BIRD ||
        s.pipes.some((pipe) => 60 + BIRD > pipe.x && 60 < pipe.x + PIPE_W && (s.y < pipe.gapY || s.y + BIRD > pipe.gapY + GAP));
      if (hit) {
        playSound('toggleOff');
        reportScore('flappy', s.score);
        setPhase('over');
      }
    }
    const context = canvas.current && prepareCanvas(canvas.current, W, H);
    if (!context) return;
    const ink = readInk();
    context.clearRect(0, 0, W, H);
    context.fillStyle = ink.ghost;
    context.fillRect(0, H - 2, W, 2);
    context.fillStyle = ink.dim;
    for (const pipe of s.pipes) {
      context.fillRect(pipe.x, 0, PIPE_W, pipe.gapY);
      context.fillRect(pipe.x, pipe.gapY + GAP, PIPE_W, H - pipe.gapY - GAP);
    }
    context.fillStyle = ink.accent;
    context.fillRect(60, s.y, BIRD, BIRD);
  });

  return (
    <GameFrame
      score={score}
      best={best.flappy ?? 0}
      message={phase === 'ready' ? 'Tap to fly' : phase === 'over' ? 'Game over' : null}
      detail={phase === 'over' ? 'Tap to play again' : null}
    >
      <canvas ref={canvas} className={styles.canvas} style={{ width: W, height: H }} />
    </GameFrame>
  );
}
