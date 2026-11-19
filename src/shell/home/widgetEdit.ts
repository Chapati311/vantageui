import { createContext, useContext, useEffect, useRef } from 'react';

/**
 * "Edit" in a widget's long-press menu. HomeScreen bumps the item's edit
 * counter; the widget inside reacts with useWidgetEdit (choose a photo, set
 * a countdown, ...).
 */
export const WidgetEditContext = createContext(0);

export function useWidgetEdit(handler: () => void): void {
  const tick = useContext(WidgetEditContext);
  // Only react when the counter really changes. (A "skip the first run" flag
  // fired on React's second development run and opened the Photo widget's
  // picker at start-up: "File chooser dialog can only be shown with a user
  // activation".)
  const seen = useRef(tick);
  const latest = useRef(handler);
  latest.current = handler;
  useEffect(() => {
    if (tick === seen.current) return;
    seen.current = tick;
    latest.current();
  }, [tick]);
}
