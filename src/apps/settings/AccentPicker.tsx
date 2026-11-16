import type { AccentId } from '../../system/settingsStore';
import styles from './AccentPicker.module.css';

interface AccentPickerProps {
  accents: { id: AccentId; name: string }[];
  value: AccentId;
  onChange: (accent: AccentId) => void;
}

/** A row of round color swatches. The colors themselves live in theme.css. */
export function AccentPicker({ accents, value, onChange }: AccentPickerProps) {
  return (
    <div className={styles.picker} role="radiogroup" aria-label="Accent color">
      {accents.map((accent) => (
        <button
          key={accent.id}
          type="button"
          role="radio"
          aria-checked={accent.id === value}
          aria-label={accent.name}
          // data-accent gives this one button that accent's colors
          data-accent={accent.id}
          className={`${styles.swatch} ${accent.id === value ? styles.selected : ''}`}
          onClick={() => onChange(accent.id)}
        >
          <span className={styles.color} />
        </button>
      ))}
    </div>
  );
}
