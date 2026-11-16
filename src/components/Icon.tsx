import type { ReactNode } from 'react';

/**
 * Shared look for every glyph in the OS: a simple line drawing that takes
 * the current text color. Its size is set by the CSS of whatever holds it.
 */
export function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}
