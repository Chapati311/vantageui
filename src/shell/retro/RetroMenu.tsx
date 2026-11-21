import { useState, type ComponentType } from 'react';
import { GameIcon } from '../../apps/arcade/GameIcon';
import { openGame } from '../../apps/arcade/arcadeStore';
import { Pressable } from '../../components/Pressable';
import { homeApps } from '../../system/appRegistry';
import { useNativeApps } from '../../system/nativeApps';
import type { RetroStyle } from '../../theme/presets';
import { PixelIcon } from './PixelIcon';
import { SoftKeys } from './SoftKeys';
import styles from './Retro.module.css';

interface RetroMenuProps {
  style: RetroStyle;
  onOpenApp: (appId: string) => void;
  onBack: () => void;
}

interface MenuEntry {
  id: string;
  name: string;
  icon: ComponentType;
  open: () => void;
}

const SnakeGlyph = () => <GameIcon game="snake" size={24} />;

/**
 * The old-phone menu: Snake first (like it should be), then every app, in
 * pages of a 3x3 grid of pixel icons (phone style) or as a numbered list
 * (terminal style). "More" turns the page.
 */
export function RetroMenu({ style, onOpenApp, onBack }: RetroMenuProps) {
  const terminal = style === 'terminal';
  const [page, setPage] = useState(0);
  useNativeApps(); // on the phone: its real apps arrive from SpringBoard
  const entries: MenuEntry[] = [
    {
      id: 'snake',
      name: 'Snake',
      icon: SnakeGlyph,
      open: () => {
        openGame('snake');
        onOpenApp('arcade');
      },
    },
    // Every app: Vantage's and, on the phone, all the real iOS apps (A to Z after Vantage's)
    ...homeApps().map((app) => ({ id: app.id, name: app.name, icon: app.icon, open: () => onOpenApp(app.id) })),
  ];
  const pages = Math.ceil(entries.length / 9);
  const shown = entries.slice(page * 9, page * 9 + 9);

  return (
    <div className={styles.menuScreen}>
      <p className={styles.menuTitle}>{terminal ? '> apps' : `Menu ${page + 1}/${pages}`}</p>
      {terminal ? (
        <div className={styles.menuList}>
          {entries.map((entry, index) => (
            <Pressable key={entry.id} className={styles.menuLine} onClick={entry.open}>
              {index + 1} {entry.name.toUpperCase()}
            </Pressable>
          ))}
        </div>
      ) : (
        <div className={styles.menuGrid}>
          {shown.map((entry) => {
            return (
              <Pressable key={entry.id} className={styles.menuItem} onClick={entry.open}>
                <span className={styles.menuIcon}>
                  <PixelIcon id={entry.id} />
                </span>
                <span className={styles.menuName}>{entry.name}</span>
              </Pressable>
            );
          })}
        </div>
      )}
      <SoftKeys
        terminal={terminal}
        left={terminal ? undefined : { label: 'More', onPress: () => setPage((page + 1) % pages) }}
        right={{ label: 'Back', onPress: onBack }}
      />
    </div>
  );
}
