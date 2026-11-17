import { AnimatePresence, motion } from 'motion/react';
import { useState, type CSSProperties } from 'react';
import { Button, EmptyState } from '../../components/kit';
import { Pressable } from '../../components/Pressable';
import { runAction } from '../../system/actions';
import { SPRING } from '../../theme/tokens';
import type { WidgetCategory, WidgetDefinition, WidgetSize } from '../widgets/types';
import { useLabWidgets } from '../widgets/lab/labStore';
import { allWidgets } from '../widgets/widgetRegistry';
import styles from './WidgetGallery.module.css';

const CATEGORIES: { id: WidgetCategory; name: string }[] = [
  { id: 'time', name: 'Time' },
  { id: 'space', name: 'Space' },
  { id: 'music', name: 'Music' },
  { id: 'games', name: 'Games' },
  { id: 'productivity', name: 'Productivity' },
  { id: 'info', name: 'Info' },
  { id: 'fun', name: 'Fun' },
  { id: 'devices', name: 'Devices' },
  { id: 'lab', name: 'My widgets' },
];

const SIZE_NAMES: Record<WidgetSize, string> = {
  '1x1': 'Small',
  '2x1': 'Wide',
  '2x2': 'Square',
  '4x1': 'Bar',
  '4x2': 'Large',
};

interface WidgetGalleryProps {
  open: boolean;
  /** The home page you are on: new widgets go here first */
  page: number;
  onClose: () => void;
}

/**
 * Every widget, grouped by category, each shown live. Pick a size to put it
 * on the home screen.
 */
export function WidgetGallery({ open, page, onClose }: WidgetGalleryProps) {
  const [category, setCategory] = useState<WidgetCategory>('time');
  const [added, setAdded] = useState<string | null>(null);
  useLabWidgets(); // re-render when you make a widget in the Lab
  const list = allWidgets().filter((widget) => widget.category === category);

  const add = (widget: WidgetDefinition, size: WidgetSize) => {
    void runAction('home.addWidget', { widgetId: widget.id, size, page });
    setAdded(`${widget.name} added`);
    window.setTimeout(() => setAdded(null), 1600);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="gallery"
          className={styles.panel}
          data-no-gesture
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={SPRING.sheet}
          role="dialog"
          aria-label="Add a widget"
        >
          <div className={styles.header}>
            <h1 className={styles.title}>Widgets</h1>
            <Button onPress={onClose}>Done</Button>
          </div>
          <div className={styles.chips} role="tablist" aria-label="Widget categories">
            {CATEGORIES.map(({ id, name }) => (
              <Pressable
                key={id}
                role="tab"
                aria-selected={id === category}
                className={`${styles.chip} ${id === category ? styles.chipOn : ''}`}
                onClick={() => setCategory(id)}
              >
                {name}
              </Pressable>
            ))}
          </div>
          <div className={styles.list}>
            {list.length === 0 && <EmptyState title="None yet" message="Build your own in Customise > Widget Lab." />}
            {list.map((widget) => (
              <GalleryCard key={widget.id} widget={widget} onAdd={add} />
            ))}
          </div>
          <AnimatePresence>
            {added && (
              <motion.div
                className={`label ${styles.toast}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={SPRING.ui}
              >
                {added}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function GalleryCard({ widget, onAdd }: { widget: WidgetDefinition; onAdd: (widget: WidgetDefinition, size: WidgetSize) => void }) {
  const [size, setSize] = useState<WidgetSize>(widget.sizes[0]);
  const [w, h] = size.split('x').map(Number);
  const Component = widget.component;

  return (
    <div className={styles.card}>
      <div className={styles.previewArea}>
        <div className={styles.preview} style={{ '--w': w, '--h': h } as CSSProperties} aria-hidden="true">
          <Component size={size} />
        </div>
      </div>
      <div className={styles.info}>
        <span className={styles.name}>{widget.name}</span>
        <span className={styles.description}>{widget.description}</span>
        <div className={styles.sizes}>
          {widget.sizes.map((option) => (
            <Pressable
              key={option}
              className={`${styles.size} ${option === size ? styles.sizeOn : ''}`}
              onClick={() => setSize(option)}
            >
              {SIZE_NAMES[option]}
            </Pressable>
          ))}
        </div>
        <Button kind="secondary" onPress={() => onAdd(widget, size)}>
          Add
        </Button>
      </div>
    </div>
  );
}
