import { AnimatePresence, motion } from 'motion/react';
import type { ComponentType } from 'react';
import { CopyIcon, EditIcon, GridIcon, TrashIcon } from '../../components/glyphs';
import { SPRING } from '../../theme/tokens';
import type { ScreenRect } from '../AppView';
import styles from './ItemMenu.module.css';

export interface ItemMenuAction {
  label: string;
  icon?: ComponentType;
  destructive?: boolean;
  /** Choices shown as small pills under the label (widget styles) */
  choices?: { id: string; label: string; selected: boolean }[];
  onSelect: (choice?: string) => void;
}

interface ItemMenuProps {
  open: boolean;
  /** Where the held item is on screen */
  rect: ScreenRect | null;
  title: string;
  actions: ItemMenuAction[];
  onClose: () => void;
}

const MENU_WIDTH = 236;

/**
 * The menu that appears when you hold a widget or app icon: the item
 * stays in place, the rest dims, and a card of actions springs open next to it.
 */
export function ItemMenu({ open, rect, title, actions, onClose }: ItemMenuProps) {
  const screenH = window.innerHeight;
  const screenW = window.innerWidth;
  const height = actions.length * 48 + 40;
  const below = rect ? rect.top + rect.height + 12 + height < screenH - 24 : true;
  const top = rect ? (below ? rect.top + rect.height + 12 : Math.max(24, rect.top - 12 - height)) : 0;
  const left = rect ? Math.min(Math.max(16, rect.left), screenW - 16 - MENU_WIDTH) : 0;

  return (
    <AnimatePresence>
      {open && rect && (
        <motion.div key="menu" className={styles.layer} data-no-gesture initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={SPRING.ui} onClick={onClose}>
          <div className={styles.scrim} />
          {/* A ring around the held item, so you see what the menu is for */}
          <motion.span
            className={styles.halo}
            style={{ left: rect.left - 4, top: rect.top - 4, width: rect.width + 8, height: rect.height + 8, borderRadius: (rect.radius ?? 0) + 4 }}
            initial={{ scale: 0.96 }}
            animate={{ scale: 1 }}
            transition={SPRING.ui}
          />
          <motion.div
            className={styles.menu}
            role="menu"
            aria-label={title}
            style={{ left, top, width: MENU_WIDTH, transformOrigin: below ? 'top left' : 'bottom left' }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={SPRING.ui}
            onClick={(event) => event.stopPropagation()}
          >
            <span className={`label ${styles.title}`}>{title}</span>
            {actions.map((action, index) => (
              <motion.div
                key={action.label}
                className={styles.item}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING.ui, delay: 0.03 * index }}
              >
                <button
                  type="button"
                  role="menuitem"
                  className={`${styles.button} ${action.destructive ? styles.destructive : ''}`}
                  onClick={() => {
                    if (action.choices) return;
                    onClose();
                    action.onSelect();
                  }}
                >
                  <span>{action.label}</span>
                  {action.icon && <action.icon />}
                </button>
                {action.choices && (
                  <div className={styles.choices}>
                    {action.choices.map((choice) => (
                      <button key={choice.id} type="button" className={`${styles.choice} ${choice.selected ? styles.choiceOn : ''}`} onClick={() => action.onSelect(choice.id)}>
                        {choice.label}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const MENU_ICONS = { EditIcon, TrashIcon, GridIcon, CopyIcon };
