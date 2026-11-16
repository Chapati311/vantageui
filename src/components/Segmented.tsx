import styles from './Segmented.module.css';

interface SegmentedProps<T extends string> {
  /** What this control chooses, for screen readers */
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** A row of options where exactly one is selected (tabs, modes, ...). */
export function Segmented<T extends string>({ label, options, value, onChange }: SegmentedProps<T>) {
  return (
    <div className={styles.segmented} role="tablist" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={option.id === value}
          className={`${styles.option} ${option.id === value ? styles.selected : ''}`}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
