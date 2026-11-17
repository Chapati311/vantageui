import { CheckIcon } from './glyphs';
import { Pressable } from './Pressable';
import styles from './ChoiceList.module.css';

interface ChoiceListProps<T extends string> {
  label: string;
  options: { id: T; name: string; detail?: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** A list of rows where exactly one is chosen (shown with a check). */
export function ChoiceList<T extends string>({ label, options, value, onChange }: ChoiceListProps<T>) {
  return (
    <div className={styles.list} role="radiogroup" aria-label={label}>
      {options.map((option) => {
        const chosen = option.id === value;
        return (
          <Pressable
            key={option.id}
            role="radio"
            aria-checked={chosen}
            className={styles.row}
            onClick={() => onChange(option.id)}
          >
            <span className={styles.text}>
              <span className={styles.name}>{option.name}</span>
              {option.detail && <span className={styles.detail}>{option.detail}</span>}
            </span>
            <span className={`${styles.check} ${chosen ? styles.chosen : ''}`}>{chosen && <CheckIcon />}</span>
          </Pressable>
        );
      })}
    </div>
  );
}
