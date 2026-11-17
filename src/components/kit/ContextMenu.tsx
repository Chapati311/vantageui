import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState, type ComponentType, type PointerEvent, type ReactNode } from 'react';
import { playSound } from '../../system/sounds';
import { SPRING } from '../../theme/tokens';
import { Overlay, useOverlayHost } from './OverlayLayer';
import styles from './ContextMenu.module.css';

export interface MenuItem {
  label: string;
  icon?: ComponentType;
  /** Red, for things like Delete */
  destructive?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

interface ContextMenuProps {
  items: MenuItem[];
  children: ReactNode;
  disabled?: boolean;
}

/** Hold this long (ms) to open the menu. */
const HOLD_MS = 450;
/** Moving the finger further than this (px) cancels the hold: it was a scroll. */
const MOVE_LIMIT = 8;
/** The menu's width: 2.5 grid cells plus gaps. */
const MENU_WIDTH = 224;

interface Place {
  /** Where the held item is, relative to the overlay layer */
  item: { left: number; top: number; width: number; height: number };
  menuLeft: number;
  menuTop: number;
  /** The menu opens above the item when there is no room below */
  above: boolean;
}

/**
 * Long-press anything wrapped in this to lift it and show a menu of actions
 * next to it. Tap outside (or pick an action) to close.
 */
export function ContextMenu({ items, children, disabled }: ContextMenuProps) {
  const target = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const start = useRef({ x: 0, y: 0 });
  const justOpened = useRef(false);
  const host = useOverlayHost();
  const [place, setPlace] = useState<Place | null>(null);

  const cancelHold = () => window.clearTimeout(timer.current);
  useEffect(() => cancelHold, []);

  const open = () => {
    const element = target.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const frame = (host ?? document.body).getBoundingClientRect();
    const item = { left: rect.left - frame.left, top: rect.top - frame.top, width: rect.width, height: rect.height };
    const menuHeight = items.length * 48;
    const above = item.top + item.height + 12 + menuHeight > frame.height - 24;
    setPlace({
      item,
      above,
      menuLeft: Math.min(Math.max(16, item.left), frame.width - 16 - MENU_WIDTH),
      menuTop: above ? Math.max(16, item.top - 12 - menuHeight) : item.top + item.height + 12,
    });
    justOpened.current = true;
    playSound('tick');
    navigator.vibrate?.(10);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (disabled) return;
    start.current = { x: event.clientX, y: event.clientY };
    cancelHold();
    timer.current = window.setTimeout(open, HOLD_MS);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (Math.hypot(event.clientX - start.current.x, event.clientY - start.current.y) > MOVE_LIMIT) cancelHold();
  };

  const close = () => setPlace(null);

  return (
    <>
      <div
        ref={target}
        className={styles.target}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={cancelHold}
        onPointerCancel={cancelHold}
        onContextMenu={(event) => event.preventDefault()}
        // The click that ends a long press must not also tap the item
        onClickCapture={(event) => {
          if (justOpened.current) {
            event.stopPropagation();
            event.preventDefault();
            justOpened.current = false;
          }
        }}
        style={{ visibility: place ? 'hidden' : undefined }}
      >
        {children}
      </div>
      <Overlay>
        <AnimatePresence onExitComplete={() => (justOpened.current = false)}>
          {place && (
            <motion.div
              key="menu"
              className={styles.layer}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={SPRING.ui}
              onClick={close}
            >
              <div className={styles.backdrop} />
              {/* The held item, lifted a little above everything else */}
              <motion.div
                className={styles.lifted}
                style={place.item}
                initial={{ scale: 1 }}
                animate={{ scale: 1.03 }}
                exit={{ scale: 1 }}
                transition={SPRING.ui}
                aria-hidden="true"
              >
                {children}
              </motion.div>
              <motion.div
                className={styles.menu}
                role="menu"
                style={{ left: place.menuLeft, top: place.menuTop, transformOrigin: place.above ? 'bottom left' : 'top left' }}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={SPRING.ui}
                onClick={(event) => event.stopPropagation()}
              >
                {items.map(({ label, icon: Glyph, destructive, disabled: off, onSelect }) => (
                  <button
                    key={label}
                    type="button"
                    role="menuitem"
                    disabled={off}
                    className={`${styles.item} ${destructive ? styles.destructive : ''}`}
                    onClick={() => {
                      close();
                      onSelect();
                    }}
                  >
                    <span>{label}</span>
                    {Glyph && <Glyph />}
                  </button>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Overlay>
    </>
  );
}
