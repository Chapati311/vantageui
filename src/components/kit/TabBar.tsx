import { motion } from 'motion/react';
import { useId, type ComponentType } from 'react';
import { SPRING } from '../../theme/tokens';
import { Pressable } from '../Pressable';
import styles from './TabBar.module.css';

interface Tab<T extends string> {
  id: T;
  label: string;
  icon: ComponentType;
  /** A small dot on the icon, e.g. something new or running */
  badge?: boolean;
}

interface TabBarProps<T extends string> {
  tabs: Tab<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * The floating pill at the bottom of an app with tabs. Put it in
 * AppShell's `tabBar`. The selected tab gets a highlight that springs over.
 */
export function TabBar<T extends string>({ tabs, value, onChange }: TabBarProps<T>) {
  const id = useId();
  return (
    <nav className={styles.bar} role="tablist">
      {tabs.map(({ id: tabId, label, icon: Glyph, badge }) => {
        const selected = tabId === value;
        return (
          <Pressable
            key={tabId}
            role="tab"
            aria-selected={selected}
            aria-label={label}
            className={`${styles.tab} ${selected ? styles.selected : ''}`}
            onClick={() => !selected && onChange(tabId)}
          >
            {selected && <motion.span layoutId={`tab-${id}`} className={styles.highlight} transition={SPRING.ui} />}
            <span className={styles.icon}>
              <Glyph />
              {badge && <span className={styles.badge} />}
            </span>
            <span className={styles.label}>{label}</span>
          </Pressable>
        );
      })}
    </nav>
  );
}
