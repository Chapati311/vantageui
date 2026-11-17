import { useSyncExternalStore } from 'react';

/** The games in the Arcade (and their home screen widgets). */
export const GAMES = [
  { id: 'snake', name: 'Snake', hint: 'Swipe to turn' },
  { id: 'pong', name: 'Pong', hint: 'Drag the paddle' },
  { id: 'blocks', name: 'Blocks', hint: 'Swipe to move, tap to turn' },
  { id: 'breakout', name: 'Breakout', hint: 'Drag the paddle' },
  { id: 'flappy', name: 'Flap', hint: 'Tap to fly' },
  { id: '2048', name: '2048', hint: 'Swipe to slide' },
  { id: 'mines', name: 'Mines', hint: 'Tap to dig, hold to flag' },
  { id: 'pet', name: 'Vanta Pet', hint: 'Feed it, play with it' },
] as const;

export type GameId = (typeof GAMES)[number]['id'];

const STORAGE_KEY = 'vantage.arcade.v1';

interface ArcadeState {
  /** The game open in the Arcade app, or null for the list */
  open: GameId | null;
  best: Partial<Record<GameId, number>>;
}

function load(): ArcadeState {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    return { open: null, best: saved?.best && typeof saved.best === 'object' ? saved.best : {} };
  } catch {
    return { open: null, best: {} };
  }
}

let state = load();
const listeners = new Set<() => void>();

function update(patch: Partial<ArcadeState>): void {
  state = { ...state, ...patch };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ best: state.best }));
  } catch {
    // Scores kept until reload.
  }
  listeners.forEach((listener) => listener());
}

export function openGame(game: GameId | null): void {
  update({ open: game });
}

/** Saves a score if it beats the best one. Returns true for a new best. */
export function reportScore(game: GameId, score: number): boolean {
  if (score <= (state.best[game] ?? 0)) return false;
  update({ best: { ...state.best, [game]: score } });
  return true;
}

export function useArcade(): ArcadeState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
  );
}
