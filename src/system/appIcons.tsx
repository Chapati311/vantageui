import { Icon } from '../components/Icon';

// One glyph per app. All drawn on a 24x24 grid.

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

export function WeatherIcon() {
  return (
    <Icon>
      <path d="M7 18a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17.2 9.1 4.5 4.5 0 0 1 17 18H7z" />
    </Icon>
  );
}

export function CalculatorIcon() {
  return (
    <Icon>
      <rect x="5" y="3" width="14" height="18" rx="2.5" />
      <path d="M8.5 7.5h7" />
      <path d="M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01" strokeWidth="2.2" />
    </Icon>
  );
}

export function MusicIcon() {
  return (
    <Icon>
      <path d="M9 17.5V6l10-2v11.5" />
      <circle cx="6.5" cy="17.5" r="2.5" />
      <circle cx="16.5" cy="15.5" r="2.5" />
    </Icon>
  );
}

export function MapsIcon() {
  return (
    <Icon>
      <path d="M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z" />
      <circle cx="12" cy="10.5" r="2.3" />
    </Icon>
  );
}

export function SettingsIcon() {
  return (
    <Icon>
      <path d="M4 8h9M17 8h3M4 16h3M11 16h9" />
      <circle cx="15" cy="8" r="2" />
      <circle cx="9" cy="16" r="2" />
    </Icon>
  );
}
