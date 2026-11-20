import type { CSSProperties } from 'react';
import { LockIcon } from './glyphs';
import { PixelIcon } from '../shell/retro/PixelIcon';
import { useSetting } from '../system/settingsStore';
import { useTheme } from '../system/theme';
import { useBlockState } from '../apps/lockin/blocking';
import type { AppDefinition } from '../system/appRegistry';
import { getNativeApp, useNativeApps } from '../system/nativeApps';
import { vantageTwinOf } from '../system/appRegistry';
import { currentAccent, useTintedIcon } from '../system/tintIcon';
import { useMemo } from 'react';
import styles from './AppIcon.module.css';

/**
 * A white glyph on a dark circle. No label. It fills its grid slot.
 * Apps locked by Lock In turn grey with a small lock.
 */
/** The color-block icon pack's colors; each app always gets the same one. */
const BLOCKS = ['#F2694A', '#F6CE46', '#F3EAD7', '#9EC9F0', '#9FE3C1'];
const blockOf = (id: string) => BLOCKS[[...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % BLOCKS.length];

/**
 * Which picture an app gets, following the icon pack (REAL_OS_PROMPT 1.4). For
 * the phone's real apps:
 *  Line + Outline/Filled: the original icon; Line + Tinted: tinted with the accent.
 *  Glyph / Blocks / Pixel (retro: always Pixel): Vantage's own glyph when there
 *  is one for that app, otherwise the tinted real icon.
 */
function useAppPicture(app: AppDefinition) {
  const [iconPack] = useSetting('iconPack');
  const [iconStyle] = useSetting('iconStyle');
  const theme = useTheme();
  const retro = theme.retro !== null;
  useNativeApps(); // badges and icons update live
  const real = app.native && app.bundleId ? getNativeApp(app.bundleId) : undefined;
  const pack = retro ? 'pixel' : iconPack;
  const twin = real && pack !== 'line' ? vantageTwinOf(app.bundleId) : undefined;
  const showImage = !!real && !twin;
  const accent = useMemo(() => currentAccent(), [theme]); // eslint-disable-line react-hooks/exhaustive-deps
  const realSrc = real ? `data:image/png;base64,${real.icon}` : '';
  const src = useTintedIcon(app.bundleId ?? app.id, realSrc, accent, showImage && (pack !== 'line' || iconStyle === 'tinted'));
  const Glyph = app.icon;
  const picture = showImage ? (
    <img className="native-app-icon" src={src} alt="" draggable={false} decoding="async" />
  ) : twin ? (
    pack === 'pixel' ? <PixelIcon id={twin.id} size={22} /> : <twin.icon />
  ) : iconPack === 'pixel' && !retro ? (
    // Icon pack "pixel": the same pixel glyphs as the retro menus, in a glossy circle
    <PixelIcon id={app.id} size={22} />
  ) : (
    <Glyph />
  );
  return { picture, showImage, badge: real?.badge };
}

/** Just the picture of an app (folder previews), following the icon pack. */
export function AppGlyph({ app }: { app: AppDefinition }) {
  return useAppPicture(app).picture;
}

export function AppIcon({ app }: { app: AppDefinition }) {
  const { locked } = useBlockState(app.id);
  const { picture, showImage, badge } = useAppPicture(app);

  return (
    <div
      className={`${styles.icon} ${locked ? styles.locked : ''} ${showImage ? styles.native : ''}`}
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
