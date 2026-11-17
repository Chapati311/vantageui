import { useSyncExternalStore } from 'react';
import type { WidgetSize } from '../types';

/**
 * Widget Lab: widgets you build yourself from blocks, each block bound to a
 * piece of live data. Saved on the phone; can be exported / imported.
 */

export type BlockKind = 'text' | 'number' | 'ring' | 'bar' | 'dots' | 'image';

/** Live data a block can show. Numbers that fill (ring, bar, dots) use the 0-1 "fraction". */
export type Binding =
  | 'time'
  | 'date'
  | 'weekday'
  | 'battery'
  | 'temperature'
  | 'condition'
  | 'rain'
  | 'dayProgress'
  | 'monthProgress'
  | 'yearProgress'
  | 'focusToday'
  | 'nowPlaying'
  | 'custom';

export interface LabBlock {
  id: string;
  kind: BlockKind;
  binding: Binding;
  /** For "custom" text, or a label shown above the value */
  text: string;
  /** For image blocks: a small picture (data URL) */
  image?: string;
}

export interface LabWidget {
  id: string;
  name: string;
  size: WidgetSize;
  blocks: LabBlock[];
}

const STORAGE_KEY = 'vantage.widgetLab.v1';

function load(): LabWidget[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(saved) ? saved.filter((item) => item && typeof item.id === 'string' && Array.isArray(item.blocks)) : [];
  } catch {
    return [];
  }
}

let widgets = load();
const listeners = new Set<() => void>();

function store(next: LabWidget[]): void {
  widgets = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
  } catch {
    // Too big (images) or blocked: kept until reload.
  }
  listeners.forEach((listener) => listener());
}

export function getLabWidgets(): LabWidget[] {
  return widgets;
}

export function getLabWidget(id: string): LabWidget | undefined {
  return widgets.find((widget) => widget.id === id);
}

export function saveLabWidget(widget: LabWidget): void {
  store(widgets.some((item) => item.id === widget.id) ? widgets.map((item) => (item.id === widget.id ? widget : item)) : [...widgets, widget]);
}

export function deleteLabWidget(id: string): void {
  store(widgets.filter((item) => item.id !== id));
}

export function newLabWidget(): LabWidget {
  return {
    id: `lab-${Date.now().toString(36)}`,
    name: 'My widget',
    size: '2x2',
    blocks: [
      { id: 'b1', kind: 'text', binding: 'weekday', text: '' },
      { id: 'b2', kind: 'number', binding: 'time', text: '' },
    ],
  };
}

export function useLabWidgets(): LabWidget[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => widgets,
  );
}

/** Downloads a widget as a .json file. */
export function exportLabWidget(widget: LabWidget): void {
  const blob = new Blob([JSON.stringify({ app: 'vantage-os', kind: 'widget', version: 1, widget }, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${widget.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'widget'}.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

/** Reads an exported widget file and adds it (with a new id). */
export async function importLabWidget(file: Blob): Promise<LabWidget> {
  let parsed: { app?: string; kind?: string; widget?: LabWidget };
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error("This file isn't a Vantage widget.");
  }
  if (parsed.app !== 'vantage-os' || parsed.kind !== 'widget' || !parsed.widget || !Array.isArray(parsed.widget.blocks)) {
    throw new Error("This file isn't a Vantage widget.");
  }
  const widget = { ...parsed.widget, id: `lab-${Date.now().toString(36)}` };
  saveLabWidget(widget);
  return widget;
}
