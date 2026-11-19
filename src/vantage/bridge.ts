import { useSyncExternalStore } from 'react';
import { listActions, runAction, type ActionId } from '../system/actions';
import { getSettings, updateSettings, type Settings } from '../system/settingsStore';
import { getThemeState, subscribeToTheme } from '../system/theme';

/**
 * The OS side of the Vantage protocol (VANTAGE.md section 2). Vantage runs
 * in an iframe on the same origin (/vantage/ through a Vercel rewrite) and
 * the two talk with postMessage. Every message is { v: 1, id, type, ... }
 * and only messages from our own origin are accepted.
 *
 *   OS -> Vantage: hello, context, theme, summon, dismiss, actionResult
 *   Vantage -> OS: ready, action, state, close
 *
 * Every OS action (system/actions.ts) is offered to Vantage as a tool named
 * "os.<action id>". Risky ones (sending, calling, deleting, clearing) wait
 * for the user to confirm on an action card; the rest run at once and can
 * be undone when they changed settings.
 */

/** Where Vantage lives. Set VITE_VANTAGE_URL (e.g. "/vantage/") once the rewrite is in place. */
export const VANTAGE_URL: string = import.meta.env.VITE_VANTAGE_URL ?? '';
/** Without a real Vantage, a labelled test page speaks the same protocol. */
export const FRAME_URL = VANTAGE_URL || `${import.meta.env.BASE_URL}vantage-mock/index.html`;
export const IS_MOCK = !VANTAGE_URL;

type Mode = 'app' | 'overlay';
export type VantageState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface ActionCard {
  /** The message id of Vantage's request */
  id: string;
  name: string;
  params: Record<string, unknown>;
  status: 'confirm' | 'done' | 'failed' | 'undone' | 'cancelled';
  /** Plain words: what will happen / what happened */
  text: string;
  undo?: () => void;
  error?: string;
}

interface BridgeState {
  /** A real Vantage (not the test page) answered at least once */
  connected: boolean;
  /** The test page or Vantage said "ready" (per frame) */
  ready: Record<Mode, boolean>;
  vantageState: VantageState;
  /** Voice level 0-1 while listening (drives the orb) */
  level: number;
  cards: ActionCard[];
}

const CONNECTED_KEY = 'vantage.connected.v1';
let state: BridgeState = {
  connected: (() => {
    try {
      return localStorage.getItem(CONNECTED_KEY) === '1' && !IS_MOCK;
    } catch {
      return false;
    }
  })(),
  ready: { app: false, overlay: false },
  vantageState: 'idle',
  level: 0,
  cards: [],
};
const listeners = new Set<() => void>();
const update = (patch: Partial<BridgeState>) => {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
};

export function useVantage(): BridgeState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
  );
}

export const isVantageConnected = (): boolean => state.connected;

// ---- Frames ------------------------------------------------------------------

const frames: Partial<Record<Mode, Window>> = {};
let counter = 0;
const nextId = () => `os-${Date.now().toString(36)}-${(counter += 1)}`;

/** The full-screen app frame and the summon overlay frame register here. */
export function attachFrame(mode: Mode, target: Window | null): void {
  if (target) frames[mode] = target;
  else delete frames[mode];
}

function send(mode: Mode, type: string, payload: Record<string, unknown> = {}): void {
  frames[mode]?.postMessage({ v: 1, id: nextId(), type, ...payload }, window.location.origin);
}
const sendAll = (type: string, payload: Record<string, unknown> = {}) =>
  (['app', 'overlay'] as Mode[]).forEach((mode) => send(mode, type, payload));

// ---- What the OS tells Vantage --------------------------------------------------

/** Actions Vantage can't call: they take a function or a file, which can't cross postMessage. */
const NOT_TOOLS = new Set<string>(['notes.create', 'setups.import', 'wallpaper.setPhoto']);

export function tools() {
  return listActions()
    .filter((action) => !NOT_TOOLS.has(action.id))
    .map((action) => ({
      name: `os.${action.id}`,
      description: action.description,
      parameters: { type: 'object', additionalProperties: true },
      confirm: needsConfirm(action.id),
    }));
}

/** The theme as CSS variables, so Vantage can paint itself to match. */
function themeTokens(): Record<string, string> {
  const style = getComputedStyle(document.documentElement);
  const names = [
    '--color-bg',
    '--color-surface',
    '--text-primary',
    '--text-secondary',
    '--color-accent',
    '--color-on-accent',
    '--radius-widget',
    '--font-body',
    '--font-serif',
    '--color-hairline',
  ];
  const theme = getThemeState();
  return {
    ...Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name).trim()])),
    dark: String(theme.dark),
    preset: theme.presetId,
  };
}

/** What is going on right now: filled in by the shell (open app, battery...). */
let contextProvider: () => Record<string, unknown> = () => ({});
export function provideContext(provider: () => Record<string, unknown>): void {
  contextProvider = provider;
}
const context = () => ({ time: new Date().toISOString(), city: 'Zurich', mode: getSettings().mode, ...contextProvider() });

function hello(mode: Mode): void {
  const settings = getSettings();
  send(mode, 'hello', { tools: tools(), theme: themeTokens(), mode: settings.mode, userName: settings.userName });
  send(mode, 'context', { context: context() });
}

// Theme changes go to Vantage as they happen
subscribeToTheme(() => sendAll('theme', { theme: themeTokens() }));

// ---- Summon and dismiss ---------------------------------------------------------------

export function summonFrame(trigger: string, text?: string): void {
  send('overlay', 'context', { context: context() });
  send('overlay', 'summon', { trigger, text });
}

export function dismissFrame(): void {
  send('overlay', 'dismiss');
  update({ vantageState: 'idle', level: 0 });
}

// ---- Running actions for Vantage ----------------------------------------------------------

/** Anything that sends, calls, deletes, clears or posts waits for a confirm on its card. */
export function needsConfirm(actionId: string): boolean {
  return /(delete|clear|remove|send|call|message|email|post|passcode|import)/i.test(actionId);
}

/** "notes.delete" { id: "x" } -> "Delete a note." plus the exact details */
function describe(name: string, params: Record<string, unknown>): string {
  const action = listActions().find((item) => item.id === name);
  const details = Object.entries(params)
    .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(', ');
  return `${action?.description ?? name}${details ? ` (${details})` : ''}`;
}

function setCard(id: string, patch: Partial<ActionCard>): void {
  update({ cards: state.cards.map((card) => (card.id === id ? { ...card, ...patch } : card)) });
}

async function execute(card: ActionCard, mode: Mode): Promise<void> {
  // Undo for anything that only changes settings: put the old ones back
  const before: Settings = JSON.parse(JSON.stringify(getSettings()));
  try {
    await runAction(card.name as ActionId, card.params as never);
    const changed = JSON.stringify(getSettings()) !== JSON.stringify(before);
    const undo = changed ? () => updateSettings(before) : undefined;
    setCard(card.id, { status: 'done', undo });
    send(mode, 'actionResult', { requestId: card.id, ok: true, receipt: card.text, undoToken: undo ? card.id : undefined });
  } catch (error) {
    setCard(card.id, { status: 'failed', error: (error as Error).message });
    send(mode, 'actionResult', { requestId: card.id, ok: false, error: (error as Error).message });
  }
}

/** Where each pending confirm came from, to answer the right frame. */
const pendingFrom = new Map<string, Mode>();

function onAction(mode: Mode, id: string, rawName: string, params: Record<string, unknown> = {}): void {
  const name = rawName.replace(/^os\./, '');
  if (!listActions().some((action) => action.id === name) || NOT_TOOLS.has(name)) {
    send(mode, 'actionResult', { requestId: id, ok: false, error: `Unknown action ${rawName}` });
    return;
  }
  const card: ActionCard = { id, name, params, status: needsConfirm(name) ? 'confirm' : 'done', text: describe(name, params) };
  update({ cards: [card, ...state.cards].slice(0, 6) });
  if (card.status === 'confirm') pendingFrom.set(id, mode);
  else void execute(card, mode);
}

/** The user tapped Confirm (or Send) on a card. */
export function confirmCard(id: string): void {
  const card = state.cards.find((item) => item.id === id);
  if (!card || card.status !== 'confirm') return;
  void execute(card, pendingFrom.get(id) ?? 'overlay');
  pendingFrom.delete(id);
}

/** Cancel, or Edit (Vantage gets the action back to change it). */
export function cancelCard(id: string, edit = false): void {
  setCard(id, { status: 'cancelled' });
  send(pendingFrom.get(id) ?? 'overlay', 'actionResult', { requestId: id, ok: false, error: edit ? 'edit' : 'cancelled' });
  pendingFrom.delete(id);
}

export function undoCard(id: string): void {
  const card = state.cards.find((item) => item.id === id);
  card?.undo?.();
  setCard(id, { status: 'undone', undo: undefined });
}

export function clearCards(): void {
  update({ cards: [] });
}

// ---- Listening ------------------------------------------------------------------------

let onClose: (mode: Mode) => void = () => {};
export function onVantageClose(handler: (mode: Mode) => void): void {
  onClose = handler;
}

window.addEventListener('message', (event: MessageEvent) => {
  // Only our own origin, only the protocol's shape
  if (event.origin !== window.location.origin) return;
  const data = event.data as { v?: number; id?: string; type?: string; [key: string]: unknown };
  if (!data || data.v !== 1 || typeof data.type !== 'string') return;
  const mode = (Object.keys(frames) as Mode[]).find((key) => frames[key] === event.source);
  if (!mode) return;

  switch (data.type) {
    case 'ready':
      update({ ready: { ...state.ready, [mode]: true } });
      if (!IS_MOCK && !state.connected) {
        update({ connected: true });
        try {
          localStorage.setItem(CONNECTED_KEY, '1');
        } catch {
          // Only a convenience: it connects again next time
        }
      }
      hello(mode);
      break;
    case 'action':
      onAction(mode, String(data.id), String(data.name), (data.params as Record<string, unknown>) ?? {});
      break;
    case 'state':
      update({ vantageState: (data.state as VantageState) ?? 'idle', level: Math.max(0, Math.min(1, Number(data.level) || 0)) });
      break;
    case 'close':
      onClose(mode);
      break;
  }
});

// ---- Moving data over ------------------------------------------------------------------

/**
 * Offers local data to Vantage (e.g. everything from Lock In), which saves
 * it to the user's account once they are signed in (VANTAGE.md section 5).
 */
export function offerImport(source: string, data: unknown): void {
  sendAll('importData', { source, data });
}
