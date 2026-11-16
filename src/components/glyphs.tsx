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

export function PlayIcon() {
  return (
    <Icon>
      <path d="M8.5 5.5v13l10.5-6.5z" />
    </Icon>
  );
}

export function PauseIcon() {
  return (
    <Icon>
      <path d="M8.5 5.5v13M15.5 5.5v13" />
    </Icon>
  );
}

export function ResetIcon() {
  return (
    <Icon>
      <path d="M5 12a7 7 0 1 0 2.2-5.1" />
      <path d="M5 4.5v4h4" />
    </Icon>
  );
}

export function FlagIcon() {
  return (
    <Icon>
      <path d="M6 20.5v-16M6 5h11l-2.5 4 2.5 4H6" />
    </Icon>
  );
}

export function PlusIcon() {
  return (
    <Icon>
      <path d="M12 5.5v13M5.5 12h13" />
    </Icon>
  );
}

export function MinusIcon() {
  return (
    <Icon>
      <path d="M5.5 12h13" />
    </Icon>
  );
}

export function BackIcon() {
  return (
    <Icon>
      <path d="M14.5 5.5L8 12l6.5 6.5" />
    </Icon>
  );
}

export function TrashIcon() {
  return (
    <Icon>
      <path d="M5 7h14M10 7V4.5h4V7M7 7l.8 12.5h8.400L17 7" />
    </Icon>
  );
}

export function ChecklistIcon() {
  return (
    <Icon>
      <path d="M4.5 7l1.800 1.800L9.500 5.500M4.500 16l1.800 1.800 3.200-3.300M13 7.500h6.500M13 16.500h6.500" />
    </Icon>
  );
}

export function TextIcon() {
  return (
    <Icon>
      <path d="M5 6.500h14M5 12h14M5 17.500h9" />
    </Icon>
  );
}

export function CheckIcon() {
  return (
    <Icon>
      <path d="M5.500 12.500l4.200 4.200 8.800-9.200" />
    </Icon>
  );
}

export function MicIcon() {
  return (
    <Icon>
      <rect x="9.500" y="4" width="5" height="10" rx="2.500" />
      <path d="M6.500 11.500a5.500 5.500 0 0 0 11 0M12 17v3" />
    </Icon>
  );
}

export function SkipNextIcon() {
  return (
    <Icon>
      <path d="M6.500 6v12l8.500-6zM17.500 6v12" />
    </Icon>
  );
}

export function SkipPreviousIcon() {
  return (
    <Icon>
      <path d="M17.500 6v12L9 12zM6.500 6v12" />
    </Icon>
  );
}
