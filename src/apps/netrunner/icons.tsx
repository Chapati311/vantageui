import { Icon } from '../../components/Icon';

// Netrunner's tool glyphs (24x24 grid, like every Vantage glyph).

export function NetrunnerIcon() {
  return (
    <Icon>
      <path d="M4 6l5 5-5 5" />
      <path d="M11 17h9" />
      <circle cx="18" cy="6" r="1.2" />
    </Icon>
  );
}

export function ConnectionIcon() {
  return (
    <Icon>
      <path d="M3.5 9.5a12 12 0 0 1 17 0M6.8 13a7.4 7.4 0 0 1 10.4 0M10 16.4a3 3 0 0 1 4 0" />
      <path d="M12 19.5h.01" strokeWidth="2.6" />
    </Icon>
  );
}

export function MapIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="2.2" />
      <circle cx="5" cy="5" r="1.6" />
      <circle cx="19" cy="6" r="1.6" />
      <circle cx="5" cy="18" r="1.6" />
      <circle cx="18.5" cy="18.5" r="1.6" />
      <path d="M6.2 6.2l4.2 4.2M17.7 7l-4.1 3.6M6.3 16.8l4.1-3.3M17.3 17.3l-3.7-3.7" />
    </Icon>
  );
}

export function PingIcon() {
  return (
    <Icon>
      <path d="M3 13h3l2-6 4 12 3-9 2 3h4" />
    </Icon>
  );
}

export function DnsIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.4 3.5 5.3 3.5 8.5s-1 6.1-3.5 8.5c-2.5-2.4-3.5-5.3-3.5-8.5s1-6.1 3.5-8.5z" />
    </Icon>
  );
}

export function SpeedIcon() {
  return (
    <Icon>
      <path d="M4.5 17a8.5 8.5 0 1 1 15 0" />
      <path d="M12 13l4-5" />
      <circle cx="12" cy="13.5" r="1.2" />
    </Icon>
  );
}

export function PrivacyIcon() {
  return (
    <Icon>
      <path d="M12 3l7 3v5.5c0 4.5-3 8-7 9.5-4-1.5-7-5-7-9.5V6l7-3z" />
      <circle cx="12" cy="11" r="2.4" />
      <path d="M8.5 16c1-1.5 2.2-2.2 3.5-2.2s2.5.7 3.5 2.2" />
    </Icon>
  );
}

export function PacketIcon() {
  return (
    <Icon>
      <rect x="3.5" y="5" width="7" height="5" rx="1" />
      <rect x="13.5" y="14" width="7" height="5" rx="1" />
      <path d="M10.5 7.5H17a2 2 0 0 1 2 2V14M13.5 16.5H7a2 2 0 0 1-2-2V10" />
    </Icon>
  );
}

export function BluetoothRadarIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 12l6-6" />
      <circle cx="15.5" cy="15" r="1" />
    </Icon>
  );
}

export function ShieldIcon() {
  return (
    <Icon>
      <path d="M12 3l7 3v5.5c0 4.5-3 8-7 9.5-4-1.5-7-5-7-9.5V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </Icon>
  );
}

export function ToolboxIcon() {
  return (
    <Icon>
      <rect x="3.5" y="8" width="17" height="11" rx="2" />
      <path d="M9 8V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v2M3.5 13h17M10.5 13v2M13.5 13v2" />
    </Icon>
  );
}

export function TerminalIcon() {
  return (
    <Icon>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <path d="M7 9.5l3 2.5-3 2.5M12 15h5" />
    </Icon>
  );
}

export function LearnIcon() {
  return (
    <Icon>
      <path d="M3 9l9-4.5L21 9l-9 4.5L3 9z" />
      <path d="M7 11v4.5c1.5 1.3 3 2 5 2s3.5-.7 5-2V11M21 9v5" />
    </Icon>
  );
}

export function ProcessIcon() {
  return (
    <Icon>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="M8 15v-3M12 15V9M16 15v-5" />
    </Icon>
  );
}

export function FieldGuideIcon() {
  return (
    <Icon>
      <path d="M5 4.5h9.5a2 2 0 0 1 2 2v13H7a2 2 0 0 1-2-2v-13z" />
      <path d="M5 17.5a2 2 0 0 1 2-2h9.5M9 8.5h4.5M9 11.5h3" />
      <path d="M19 7v12.5" />
    </Icon>
  );
}
