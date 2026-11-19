import type { CSSProperties } from 'react';
import { LockIcon } from './glyphs';
import { PixelIcon } from '../shell/retro/PixelIcon';
import { useSetting } from '../system/settingsStore';
import { useTheme } from '../system/theme';
import { useBlockState } from '../apps/lockin/blocking';
import type { AppDefinition } from '../system/appRegistry';
import styles from './AppIcon.module.css';

/**
 * A white glyph on a dark circle. No label. It fills its grid slot.
 * Apps locked by Lock In turn grey with a small lock.
 */
/** The color-block icon pack's colors; each app always gets the same one. */
const BLOCKS = ['#F2694A', '#F6CE46', '#F3EAD7', '#9EC9F0', '#9FE3C1'];
const blockOf = (id: string) => BLOCKS[[...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % BLOCKS.length];

export function AppIcon({ app }: { app: AppDefinition }) {
  const Glyph = app.icon;
  const { locked } = useBlockState(app.id);
  const [iconPack] = useSetting('iconPack');
  const retro = useTheme().retro !== null;

  return (
    <div
      className={`${styles.icon} ${locked ? styles.locked : ''}`}
      role="img"
      aria-label={locked ? `${app.name}, locked` : app.name}
      data-app-icon={app.id}
      style={{ '--icon-block': blockOf(app.id) } as CSSProperties}
    >
      {/* Icon pack "pixel": the same pixel glyphs as the retro menus, in a glossy circle */}
      {iconPack === 'pixel' && !retro ? <PixelIcon id={app.id} size={22} /> : <Glyph />}
      {locked && (
        <span className={styles.lock}>
          <LockIcon />
        </span>
      )}
    </div>
  );
}
