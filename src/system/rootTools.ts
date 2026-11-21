/**
 * Netrunner's real tools (HACKER_MODE.md): runs allowed tools on the
 * jailbroken iPhone through the Vantage root helper (vantagehelperd) and
 * streams their output here, line by line. Off the phone (a normal browser)
 * there is no helper: hasRootTools() is false and the tools say so (a few,
 * like DNS, have a web fallback).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { isHosted } from './nativeBridge';

export interface ToolLine {
  kind: 'out' | 'err';
  text: string;
}

export interface ToolAnswer {
  code: number;
  out: string[];
  err: string[];
  data: unknown;
}

interface ToolBridge {
  runTool?: (tool: string, args: string[]) => Promise<string>;
  cancelTool?: (id: string) => Promise<void>;
  askTool?: (op: string, tool?: string, args?: string[]) => Promise<ToolAnswer>;
}

interface ToolMessage {
  t: 'o' | 'e' | 'j' | 'x';
  d?: unknown;
  c?: number;
}

const bridge = () => window.vantageNative as ToolBridge | undefined;

/** True on the jailbroken iPhone with the root helper's bridge. */
export function hasRootTools(): boolean {
  return isHosted() && !!bridge()?.runTool;
}

// ---- Streams: 'vantage:tool' events, routed to the run they belong to ----
type Listener = (message: ToolMessage) => void;
const listeners = new Map<string, Listener>();
const early = new Map<string, ToolMessage[]>(); // arrived before we knew the run id
let installed = false;

function install(): void {
  if (installed) return;
  installed = true;
  window.addEventListener('vantage:tool', (event) => {
    const detail = (event as CustomEvent<{ id: string; message: ToolMessage }>).detail;
    if (!detail?.id) return;
    const listener = listeners.get(detail.id);
    if (listener) listener(detail.message);
    else early.set(detail.id, [...(early.get(detail.id) ?? []), detail.message]);
  });
}

export interface RunHandle {
  /** Resolves when the tool ends: exit code (0 = fine), all lines, structured result */
  done: Promise<ToolAnswer>;
  cancel: () => void;
}

/** Runs a tool; onLine gets every output line as it arrives. */
export function runTool(tool: string, args: (string | number)[] = [], onLine?: (line: ToolLine) => void): RunHandle {
  install();
  const out: string[] = [];
  const err: string[] = [];
  let data: unknown = null;
  let runId: string | null = null;
  let cancelled = false;
  const done = new Promise<ToolAnswer>((resolve) => {
    const native = bridge();
    if (!native?.runTool) {
      resolve({ code: -1, out, err: ['Netrunner tools run on the jailbroken iPhone (Vantage OS host).'], data });
      return;
    }
    const handle: Listener = (message) => {
      if (message.t === 'o' || message.t === 'e') {
        const text = String(message.d ?? '');
        (message.t === 'o' ? out : err).push(text);
        onLine?.({ kind: message.t === 'o' ? 'out' : 'err', text });
      } else if (message.t === 'j') data = message.d;
      else if (message.t === 'x') {
        if (runId) listeners.delete(runId);
        resolve({ code: typeof message.c === 'number' ? message.c : -1, out, err, data });
      }
    };
    native
      .runTool(tool, args.map(String))
      .then((id) => {
        runId = id;
        listeners.set(id, handle);
        (early.get(id) ?? []).forEach(handle);
        early.delete(id);
        if (cancelled) void native.cancelTool?.(id);
      })
      .catch((error: Error) => resolve({ code: -1, out, err: [error.message], data }));
  });
  return {
    done,
    cancel: () => {
      cancelled = true;
      if (runId) void bridge()?.cancelTool?.(runId);
    },
  };
}

/** One answer (no streaming): askTool('tools') = what the helper can do; askTool('run', 'stats'). */
export async function askTool(op: string, tool = '', args: (string | number)[] = []): Promise<ToolAnswer> {
  const native = bridge();
  if (!native?.askTool) throw new Error('Netrunner tools run on the jailbroken iPhone (Vantage OS host).');
  return native.askTool(op, tool, args.map(String));
}

/** A tool run as React state: lines so far, running, exit code; start / stop. */
export function useToolRun(maxLines = 2000) {
  const [lines, setLines] = useState<ToolLine[]>([]);
  const [running, setRunning] = useState(false);
  const [code, setCode] = useState<number | null>(null);
  const [data, setData] = useState<unknown>(null);
  const handle = useRef<RunHandle | null>(null);
  const pending = useRef<ToolLine[]>([]);
  const frame = useRef(0);

  const flush = useCallback(() => {
    frame.current = 0;
    const next = pending.current;
    pending.current = [];
    setLines((list) => {
      const merged = list.concat(next);
      return merged.length > maxLines ? merged.slice(merged.length - maxLines) : merged;
    });
  }, [maxLines]);

  const start = useCallback(
    (tool: string, args: (string | number)[] = []) => {
      handle.current?.cancel();
      setLines([]);
      setCode(null);
      setData(null);
      setRunning(true);
      const run = runTool(tool, args, (line) => {
        // Many lines per second: one render per frame
        pending.current.push(line);
        if (!frame.current) frame.current = requestAnimationFrame(flush);
      });
      handle.current = run;
      return run.done.then((answer) => {
        if (handle.current !== run) return answer;
        if (frame.current) cancelAnimationFrame(frame.current);
        flush();
        setCode(answer.code);
        setData(answer.data);
        setRunning(false);
        return answer;
      });
    },
    [flush],
  );

  const stop = useCallback(() => handle.current?.cancel(), []);
  useEffect(() => () => handle.current?.cancel(), []);
  return { lines, running, code, data, start, stop };
}

// ---- Small parsers shared by the tools ----

/** "192.168.1.238" + "255.255.255.0" -> "192.168.1.0/24" */
export function cidrOf(ip: string, mask: string): string | null {
  const a = ip.split('.').map(Number);
  const m = mask.split('.').map(Number);
  if (a.length !== 4 || m.length !== 4 || [...a, ...m].some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  const bits = m.reduce((sum, n) => sum + n.toString(2).replace(/0/g, '').length, 0);
  const base = a.map((n, i) => n & m[i]);
  return `${base.join('.')}/${Math.max(24, bits)}`;
}

export function isPrivateIp(ip: string): boolean {
  const [a, b] = ip.split('.').map(Number);
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254);
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value >= 100 || unit === 0 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}
