import { useRef, useState } from 'react';
import { playSound } from '../../../system/sounds';
import { reportScore, useArcade } from '../arcadeStore';
import { GameFrame } from '../GameFrame';
import { prepareCanvas, readInk, useFrames, useKeys, useTouches } from '../gameKit';
import styles from '../Arcade.module.css';

const W = 300;
const H = 360;
const PADDLE_W = 56;
const PADDLE_H = 6;
const BALL = 7;
const WIN = 7;

/** Pong against the phone. Drag your paddle (bottom); first to 7 wins. Score = your points. */
export function Pong() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { best } = useArcade();
  const [phase, setPhase] = useState<'ready' | 'playing' | 'over'>('ready');
  const [points, setPoints] = useState({ you: 0, cpu: 0 });
  const g = useRef({ you: W / 2, cpu: W / 2, x: W / 2, y: H / 2, vx: 120, vy: 180, you_pts: 0, cpu_pts: 0 });

  const serve = (towardsYou: boolean) => {
    const s = g.current;
    s.x = W / 2;
    s.y = H / 2;
    s.vx = (Math.random() < 0.5 ? -1 : 1) * (90 + Math.random() * 60);
    s.vy = towardsYou ? 190 : -190;
  };

  const start = () => {
    g.current = { you: W / 2, cpu: W / 2, x: W / 2, y: H / 2, vx: 120, vy: 180, you_pts: 0, cpu_pts: 0 };
    serve(true);
    setPoints({ you: 0, cpu: 0 });
    setPhase('playing');
  };

  useTouches(canvas, {
    onMove: (x) => (g.current.you = x * W),
    onTap: () => phase !== 'playing' && start(),
  });
  useKeys((key) => {
    if (key === 'action' && phase !== 'playing') start();
    if (key === 'left') g.current.you -= 30;
    if (key === 'right') g.current.you += 30;
  });

  useFrames(true, (dt) => {
    const s = g.current;
    if (phase === 'playing') {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      // The phone follows the ball, a little slower than it could
      s.cpu += Math.max(-170 * dt, Math.min(170 * dt, s.x - s.cpu));
      if (s.x < BALL / 2 || s.x > W - BALL / 2) {
        s.vx = -s.vx;
        s.x = Math.min(W - BALL / 2, Math.max(BALL / 2, s.x));
      }
      const hitPaddle = (paddleX: number) => Math.abs(s.x - paddleX) < PADDLE_W / 2 + BALL / 2;
      if (s.vy > 0 && s.y > H - 20 && s.y < H - 8 && hitPaddle(s.you)) {
        s.vy = -Math.abs(s.vy) * 1.04;
        s.vx += (s.x - s.you) * 4;
        playSound('tick');
      }
      if (s.vy < 0 && s.y < 20 && s.y > 8 && hitPaddle(s.cpu)) {
        s.vy = Math.abs(s.vy) * 1.04;
        s.vx += (s.x - s.cpu) * 3;
        playSound('tick');
      }
      if (s.y < 0 || s.y > H) {
        if (s.y < 0) s.you_pts += 1;
        else s.cpu_pts += 1;
        setPoints({ you: s.you_pts, cpu: s.cpu_pts });
        if (s.you_pts >= WIN || s.cpu_pts >= WIN) {
          reportScore('pong', s.you_pts);
          playSound(s.you_pts >= WIN ? 'unlock' : 'toggleOff');
          setPhase('over');
        } else serve(s.y > H);
      }
    }
    s.you = Math.min(W - PADDLE_W / 2, Math.max(PADDLE_W / 2, s.you));
    const context = canvas.current && prepareCanvas(canvas.current, W, H);
    if (!context) return;
    const ink = readInk();
    context.clearRect(0, 0, W, H);
    context.fillStyle = ink.ghost;
    for (let x = 4; x < W; x += 16) context.fillRect(x, H / 2 - 1, 8, 2);
    context.fillStyle = ink.dim;
    context.fillRect(s.cpu - PADDLE_W / 2, 8, PADDLE_W, PADDLE_H);
    context.fillStyle = ink.ink;
    context.fillRect(s.you - PADDLE_W / 2, H - 8 - PADDLE_H, PADDLE_W, PADDLE_H);
    context.fillStyle = ink.accent;
    context.fillRect(s.x - BALL / 2, s.y - BALL / 2, BALL, BALL);
  });

  return (
    <GameFrame
      score={points.you}
      best={best.pong ?? 0}
      message={phase === 'ready' ? 'Tap to start' : phase === 'over' ? (points.you >= WIN ? 'You win' : 'Phone wins') : null}
      detail={phase === 'over' ? `${points.you} : ${points.cpu} · tap to play again` : phase === 'ready' ? 'First to 7' : null}
    >
      <canvas ref={canvas} className={styles.canvas} style={{ width: W, height: H }} />
    </GameFrame>
  );
}
