import type { ReactNode } from 'react';

/** Shared look for all app icons: simple white line drawings. */
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
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

export function PhoneIcon() {
  return (
    <Icon>
      <path d="M6.5 3h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 4.5 5a2 2 0 0 1 2-2z" />
    </Icon>
  );
}

export function MessagesIcon() {
  return (
    <Icon>
      <path d="M6 5h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7l-4 3.5V16H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
    </Icon>
  );
}

export function NotesIcon() {
  return (
    <Icon>
      <rect x="5" y="3" width="14" height="18" rx="2.5" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </Icon>
  );
}

export function ClockIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Icon>
  );
}
