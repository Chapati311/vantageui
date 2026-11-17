import { useState } from 'react';
import { useTheme } from '../../system/theme';
import { Wallpaper } from '../wallpaper/Wallpaper';
import { RetroDesktop } from './RetroDesktop';
import { RetroIdle } from './RetroIdle';
import { RetroMenu } from './RetroMenu';
import { SoftKeys } from './SoftKeys';
import styles from './Retro.module.css';

interface RetroHomeProps {
  onOpenApp: (appId: string) => void;
  onOpenSearch: () => void;
}

/**
 * The home screen in retro themes, laid out like an old phone: the idle
 * screen with "Menu" and "Names" soft keys. Menu shows every app; Names
 * opens the phone book (the Phone app). Classic Desktop gets a desktop
 * with a Start button instead.
 */
export function RetroHome({ onOpenApp, onOpenSearch }: RetroHomeProps) {
  const theme = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const style = theme.retro ?? 'phone';

  const open = (appId: string) => {
    setMenuOpen(false);
    onOpenApp(appId);
  };

  if (style === 'desktop') {
    return (
      <div className={styles.screen}>
        <RetroDesktop onOpenApp={open} />
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <Wallpaper place="lock" />
      {menuOpen ? (
        <RetroMenu style={style} onOpenApp={open} onBack={() => setMenuOpen(false)} />
      ) : (
        <>
          <RetroIdle style={style} locked={false} />
          <SoftKeys
            terminal={style === 'terminal'}
            left={{ label: 'Menu', onPress: () => setMenuOpen(true) }}
            right={{ label: 'Names', onPress: () => open('phone') }}
          />
          {/* Search still works: tap the middle of the screen */}
          <button type="button" className={styles.searchZone} aria-label="Search" onClick={onOpenSearch} />
        </>
      )}
    </div>
  );
}
