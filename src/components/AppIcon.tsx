import type { CSSProperties, ReactNode } from 'react';
import { LockIcon } from './glyphs';
import { PixelIcon } from '../shell/retro/PixelIcon';
import { useSetting } from '../system/settingsStore';
import { useTheme } from '../system/theme';
import { useBlockState } from '../apps/lockin/blocking';
import type { AppDefinition } from '../system/appRegistry';
import { getNativeApp, useNativeApps } from '../system/nativeApps';
import { vantageTwinOf } from '../system/appRegistry';
import { currentAccent, useTintedIcon } from '../system/tintIcon';
import { useSilhouette } from '../system/iconSilhouette';
import { useMemo } from 'react';
import styles from './AppIcon.module.css';

/** The color-block icon pack's colors; each app always gets the same one. */
const BLOCKS = ['#F2694A', '#F6CE46', '#F3EAD7', '#9EC9F0', '#9FE3C1'];
const blockOf = (id: string) => BLOCKS[[...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % BLOCKS.length];

/**
 * Full-color squircle icons for Vantage's own apps (look "Original"), so they
 * sit naturally next to the phone's real iOS icons: one gradient per app.
 */
const FACE: Record<string, [string, string]> = {
  phone: ['#5CE27E', '#2DBE4F'],
  messages: ['#6BEA84', '#2BC248'],
  notes: ['#FFE36E', '#F5C518'],
  clock: ['#2B2F36', '#0B0D10'],
  lockin: ['#3A3F4B', '#15181D'],
  weather: ['#5BB8FF', '#1F6FE0'],
  calendar: ['#FF6B5E', '#E5382B'],
  reminders: ['#FFA94D', '#F27A1A'],
  music: ['#FF6A88', '#F5304F'],
  camera: ['#9DA3AB', '#5E646C'],
  photos: ['#FFC36B', '#F08A3C'],
  maps: ['#7EE0A0', '#2FAE6A'],
  calculator: ['#4A4F57', '#1C1F24'],
  recorder: ['#FF5B5B', '#C9252F'],
  contacts: ['#B9BEC6', '#80868F'],
  mail: ['#62B4FF', '#1E7CF0'],
  browser: ['#5FC6FF', '#2079F2'],
  files: ['#5AA8FF', '#2269E3'],
  compass: ['#3C4048', '#121418'],
  arcade: ['#B07CFF', '#6E3BEA'],
  customise: ['#FF8A5B', '#E2457A'],
  settings: ['#A7ADB5', '#6C727B'],
  kit: ['#7C8592', '#3E4550'],
  vantage: ['#2DD4BF', '#0E8F8A'],
  earbuds: ['#E9ECF0', '#B5BBC4'],
};
const FALLBACK_FACES: [string, string][] = [['#5BB8FF', '#1F6FE0'], ['#FF8A5B', '#E2457A'], ['#7EE0A0', '#2FAE6A'], ['#B07CFF', '#6E3BEA']];
const faceOf = (id: string) => FACE[id] ?? FALLBACK_FACES[[...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % FALLBACK_FACES.length];
/** Light faces get a dark glyph (contrast) */
const LIGHT_FACES = new Set(['notes', 'earbuds', 'contacts']);

/**
 * Which picture an app gets (DEVICE_QA P0-3: one icon system, one consistent
 * result per look, the same in home, dock, folders and App Library):
 *  Original (default): every real app shows its real icon at full resolution
 *    in the iOS squircle, no tint, no filter; Vantage's own apps get
 *    full-color squircle icons in the same style.
 *  Vantage glyph: EVERY app is a glyph in a circle: hand-made glyphs where
 *    there is one, otherwise a clean silhouette made from the real icon.
 *  Tinted: every icon in the accent (real icons tinted, Vantage apps with an
 *    accent glyph), squircle.
 * Retro themes always use their pixel glyphs.
 */
function useAppPicture(app: AppDefinition) {
  const [iconPack] = useSetting('iconPack');
  const [iconLook] = useSetting('iconLook');
  const theme = useTheme();
  const retro = theme.retro !== null;
  useNativeApps(); // badges and icons update live
  const real = app.native && app.bundleId ? getNativeApp(app.bundleId) : undefined;
  const look = retro ? 'glyph' : iconLook;
  const pack = retro ? 'pixel' : iconPack;
  const twin = real ? vantageTwinOf(app.bundleId) : undefined;
  const accent = useMemo(() => currentAccent(), [theme]); // eslint-disable-line react-hooks/exhaustive-deps
  const realSrc = real?.icon ? `data:image/png;base64,${real.icon}` : '';
  const key = app.bundleId ?? app.id;
  const tinted = useTintedIcon(key, realSrc, accent, !!realSrc && look === 'tinted');
  const silhouette = useSilhouette(key, realSrc, !!realSrc && look === 'glyph' && !twin);
  const glyphFor = (def: AppDefinition) => (pack === 'pixel' ? <PixelIcon id={def.id} size={22} /> : <def.icon />);
  const Glyph = app.icon;

  let picture: ReactNode;
  let squircle = true;
  if (look === 'original') {
    picture = realSrc ? (
      <img className="native-app-icon vo-face" src={realSrc} alt="" draggable={false} decoding="async" />
    ) : (
      <span
        className={`vo-face vo-face-color ${LIGHT_FACES.has(app.id) ? 'vo-face-light' : ''}`}
        style={{ '--face-from': faceOf(app.id)[0], '--face-to': faceOf(app.id)[1] } as CSSProperties}
      >
        <Glyph />
      </span>
    );
  } else if (look === 'tinted') {
    picture = realSrc ? (
      <img className="native-app-icon vo-face" src={tinted} alt="" draggable={false} decoding="async" />
    ) : (
      <span className="vo-face vo-face-tint">
        <Glyph />
      </span>
    );
  } else {
    squircle = false;
    picture = twin ? (
      glyphFor(twin)
    ) : realSrc ? (
      silhouette ? <span className="vo-silhouette" style={{ '--mask': `url(${silhouette})` } as CSSProperties} /> : null
    ) : pack === 'pixel' ? (
      <PixelIcon id={app.id} size={22} />
    ) : (
      <Glyph />
    );
  }
  return { picture, squircle, badge: real?.badge };
}

/** Just the picture of an app (folder previews), following the icon pack. */
export function AppGlyph({ app }: { app: AppDefinition }) {
  return useAppPicture(app).picture;
}

/**
 * An app's icon (see useAppPicture for the looks). No label. It fills its grid
 * slot. Apps locked by Vantage focus blocking turn grey with a small lock.
 */
export function AppIcon({ app }: { app: AppDefinition }) {
  const { locked } = useBlockState(app.id);
  const { picture, squircle, badge } = useAppPicture(app);

  return (
    <div
      className={`${styles.icon} ${locked ? styles.locked : ''}`}
      data-icon-face={squircle ? 'squircle' : 'glyph'}
      role="img"
      aria-label={locked ? `${app.name}, locked` : app.name}
      data-app-icon={app.id}
      style={{ '--icon-block': blockOf(app.id) } as CSSProperties}
    >
      {picture}
      {badge !== undefined && badge !== '' && badge !== 0 && (
        <span className={styles.badge} aria-label={`${badge} new`}>
          {typeof badge === 'number' && badge > 99 ? '99+' : badge}
        </span>
      )}
      {locked && (
        <span className={styles.lock}>
          <LockIcon />
        </span>
      )}
    </div>
  );
}
