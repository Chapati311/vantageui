import { createContext, useContext, useEffect, useRef } from 'react';

/**
 * "Edit" in a widget's long-press menu. HomeScreen bumps the item's edit
 * counter; the widget inside reacts with useWidgetEdit (choose a photo, set
 * a countdown, ...).
 */
export const WidgetEditContext = createContext(0);

export function useWidgetEdit(handler: () => void): void {
  const tick = useContext(WidgetEditContext);
  const first = useRef(true);
  const latest = useRef(handler);
  latest.current = handler;
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    latest.current();
  }, [tick]);
}
