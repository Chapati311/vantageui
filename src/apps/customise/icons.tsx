import { Icon } from '../../components/Icon';

// Glyphs for the Customise sections. 24x24 grid, like every other icon.

export function PaletteIcon() {
  return (
    <Icon>
      <rect x="4.500" y="4.500" width="6.500" height="15" rx="3.250" />
      <path d="M11 9.500l4-3.800 3.300 3.400-7.300 7.400M11 19.500h8.500v-6.500H15" />
      <circle cx="7.750" cy="16" r="1" />
    </Icon>
  );
}

export function PictureIcon() {
  return (
    <Icon>
      <rect x="4" y="5" width="16" height="14" rx="2.500" />
      <path d="M4.500 16.500l4.500-4.500 3.500 3.500 2.500-2.500 4.500 4.500" />
      <circle cx="15.500" cy="9.500" r="1.500" />
    </Icon>
  );
}

export function SparkIcon() {
  return (
    <Icon>
      <path d="M12 4l1.800 5.200L19 11l-5.200 1.800L12 18l-1.800-5.200L5 11l5.200-1.800L12 4zM18.500 16v4M16.500 18h4" />
    </Icon>
  );
}

export function LayersIcon() {
  return (
    <Icon>
      <path d="M12 4.500l8 4-8 4-8-4 8-4zM4 12.500l8 4 8-4M4 16.500l8 4 8-4" />
    </Icon>
  );
}

export function CircleIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="7.500" />
      <circle cx="12" cy="12" r="2.500" />
    </Icon>
  );
}
