import { Icon } from './Icon';

// System glyphs (not apps). All drawn on a 24x24 grid.

export function WifiIcon() {
  return (
    <Icon>
      <path d="M3.5 9.5a12 12 0 0 1 17 0M6.8 13a7.4 7.4 0 0 1 10.4 0" />
      <path d="M12 17.5h.01" strokeWidth="2.6" />
    </Icon>
  );
}

export function BluetoothIcon() {
  return (
    <Icon>
      <path d="M7 7.5l10 9-5 4.5V3l5 4.5-10 9" />
    </Icon>
  );
}

export function FlashlightIcon() {
  return (
    <Icon>
      <path d="M8 3h8v3l-2 3.5V20a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V9.500L8 6V3z" />
      <path d="M12 12.500v2" />
    </Icon>
  );
}

export function MoonIcon() {
  return (
    <Icon>
      <path d="M19.5 14.500A8 8 0 0 1 9.500 4.500a8 8 0 1 0 10 10z" />
    </Icon>
  );
}

export function SunIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="3.500" />
      <path d="M12 3.500v2M12 18.500v2M3.500 12h2M18.500 12h2M6 6l1.400 1.400M16.600 16.600L18 18M6 18l1.400-1.400M16.600 7.400L18 6" />
    </Icon>
  );
}

export function LockIcon() {
  return (
    <Icon>
      <rect x="5" y="10.500" width="14" height="10" rx="2.500" />
      <path d="M8 10.500V7.500a4 4 0 0 1 8 0v3" />
    </Icon>
  );
}

export function SoundIcon() {
  return (
    <Icon>
      <path d="M4 9.500v5h3.500L12 18.500v-13L7.500 9.500H4z" />
      <path d="M15.500 9a4.500 4.500 0 0 1 0 6" />
    </Icon>
  );
}
