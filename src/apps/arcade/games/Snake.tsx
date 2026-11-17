import { useRef, useState } from 'react';
import { playSound } from '../../../system/sounds';
import { reportScore, useArcade } from '../arcadeStore';
import { GameFrame } from '../GameFrame';
import { prepareCanvas, readInk, useFrames, useKeys, useTouches, type Direction } from '../gameKit';
import styles from '../Arcade.module.css';

const CELLS = 16;
const SIZE = 300;
const STEP_SECONDS = 0.12;

type Point = { x: number; y: number };
const MOVES: Record<Direction, Point> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };

function randomFood(snake: Point[]): Point {
  for (;;) {
    const food = { x: Math.floor(Math.random() * CELLS), y: Math.floor(Math.random() * CELLS) };
    if (!snake.some((part) => part.x === food.x && part.y === food.y)) return food;
  }
}

/** Snake: eat the dots, don't bite yourself or the walls. Swipe to turn. */
export function Snake() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { best } = useArcade();
  const [phase, setPhase] = useState<'ready' | 'playing' | 'over'>('ready');
  const [score, setScore] = useState(0);
  const game = useRef({
    snake: [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }] as Point[],
    direction: 'right' as Direction,
    queued: [] as Direction[],
    food: { x: 12, y: 8 } as Point,
    timer: 0,
  });

  const start = () => {
    const snake = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }];
    game.current = { snake, direction: 'right', queued: [], food: randomFood(snake), timer: 0 };
    setScore(0);
    setPhase('playing');
  };

  const turn = (direction: Direction) => {
    if (phase !== 'playing') return start();
    const g = game.current;
    const last = g.queued[g.queued.length - 1] ?? g.direction;
    const opposite = MOVES[direction].x === -MOVES[last].x && MOVES[direction].y === -MOVES[last].y;
    if (!opposite && direction !== last && g.queued.length < 3) g.queued.push(direction);
  };

  useTouches(canvas, { onSwipe: turn, onTap: () => phase !== 'playing' && start() });
  useKeys((key) => (key === 'action' ? phase !== 'playing' && start() : turn(key)));

  const draw = () => {
    const element = canvas.current;
    const context = element && prepareCanvas(element, SIZE, SIZE);
    if (!context) return;
    const ink = readInk();
    const cell = SIZE / CELLS;
    context.clearRect(0, 0, SIZE, SIZE);
    // Ghost pixels everywhere, like an LCD
    context.fillStyle = ink.ghost;
    for (let x = 0; x < CELLS; x += 1) for (let y = 0; y < CELLS; y += 1) context.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
    context.fillStyle = ink.accent;
    context.fillRect(game.current.food.x * cell + 1, game.current.food.y * cell + 1, cell - 2, cell - 2);
    context.fillStyle = ink.ink;
    for (const part of game.current.snake) context.fillRect(part.x * cell + 1, part.y * cell + 1, cell - 2, cell - 2);
  };

  useFrames(true, (dt) => {
    const g = game.current;
    if (phase === 'playing') {
      g.timer += dt;
      while (g.timer >= STEP_SECONDS) {
        g.timer -= STEP_SECONDS;
        g.direction = g.queued.shift() ?? g.direction;
        const head = { x: g.snake[0].x + MOVES[g.direction].x, y: g.snake[0].y + MOVES[g.direction].y };
        const hit =
          head.x < 0 || head.y < 0 || head.x >= CELLS || head.y >= CELLS || g.snake.some((part) => part.x === head.x && part.y === head.y);
        if (hit) {
          playSound('toggleOff');
          reportScore('snake', g.snake.length - 3);
          setPhase('over');
          break;
        }
        g.snake.unshift(head);
        if (head.x === g.food.x && head.y === g.food.y) {
          playSound('tick');
          g.food = randomFood(g.snake);
          setScore(g.snake.length - 3);
        } else {
          g.snake.pop();
        }
      }
    }
    draw();
  });

  return (
    <GameFrame
      score={score}
      best={best.snake ?? 0}
      message={phase === 'ready' ? 'Tap to start' : phase === 'over' ? 'Game over' : null}
      detail={phase === 'over' ? 'Tap to play again' : phase === 'ready' ? 'Swipe to turn' : null}
    >
      <canvas ref={canvas} className={styles.canvas} style={{ width: SIZE, height: SIZE }} />
    </GameFrame>
  );
}
