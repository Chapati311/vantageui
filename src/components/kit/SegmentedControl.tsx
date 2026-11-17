import { motion } from 'motion/react';
import { useId } from 'react';
import { SPRING } from '../../theme/tokens';
import { Pressable } from '../Pressable';
import styles from './SegmentedControl.module.css';

interface SegmentedControlProps<T extends string> {
  /** What this control chooses, for screen readers */
  label: string;
  options: { id: T; label: string; disabled?: boolean }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

/**
 * A row of options where exactly one is selected (units, views, modes).
 * The highlight springs over to the option you tap.
 */
export function SegmentedControl<T extends string>({ label, options, value, onChange, disabled }: SegmentedControlProps<T>) {
  const id = useId();
  return (
    <div className={`${styles.segmented} ${disabled ? styles.disabled : ''}`} role="tablist" aria-label={label}>
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <Pressable
            key={option.id}
            role="tab"
            aria-selected={selected}
            disabled={disabled || option.disabled}
            className={`${styles.option} ${selected ? styles.selected : ''}`}
            onClick={() => !selected && onChange(option.id)}
          >
            {selected && <motion.span layoutId={`segment-${id}`} className={styles.highlight} transition={SPRING.ui} />}
            <span className={styles.text}>{option.label}</span>
          </Pressable>
        );
      })}
    </div>
  );
}
