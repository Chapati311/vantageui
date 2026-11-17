import { AnimatePresence, motion } from 'motion/react';
import { useRef } from 'react';
import { SPRING } from '../../theme/tokens';
import { CloseIcon, SearchIcon } from '../glyphs';
import styles from './SearchField.module.css';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Short hint shown while empty, e.g. "Search notes" */
  placeholder: string;
  /** Called when Return is pressed */
  onSubmit?: (value: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
}

/** A pill-shaped search box with a magnifier and a clear button. */
export function SearchField({ value, onChange, placeholder, onSubmit, autoFocus, disabled }: SearchFieldProps) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <form
      className={`${styles.field} ${disabled ? styles.disabled : ''}`}
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.(value);
        input.current?.blur();
      }}
    >
      <span className={styles.icon}>
        <SearchIcon />
      </span>
      <input
        ref={input}
        className={styles.input}
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
      <AnimatePresence initial={false}>
        {value && (
          <motion.button
            type="button"
            className={styles.clear}
            aria-label="Clear"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={SPRING.ui}
            onClick={() => {
              onChange('');
              input.current?.focus();
            }}
          >
            <CloseIcon />
          </motion.button>
        )}
      </AnimatePresence>
    </form>
  );
}
