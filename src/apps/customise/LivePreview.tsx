import { useSyncExternalStore } from 'react';
import { DotNumber } from '../../components/DotNumber';
import { ScaledPreview } from '../../components/ScaledPreview';
import { useSettings } from '../../system/settingsStore';
import { useTheme } from '../../system/theme';
import { useClock } from '../../system/useClock';
import { Dock } from '../../shell/home/Dock';
import { HomeItemContent } from '../../shell/home/HomeItemView';
import { loadLayout, subscribeToLayout } from '../../shell/home/layoutStore';
import { Wallpaper } from '../../shell/wallpaper/Wallpaper';
import styles from './LivePreview.module.css';

const two = (value: number) => String(value).padStart(2, '0');

/* The home grid on a 375 x 667 screen (tokens.css): 16 px margins, 12 px gaps, 32 px from the top */
const MARGIN = 16;
const GAP = 12;
const TOP = 32;
const CELL = (375 - 2 * MARGIN - 3 * GAP) / 4;
const STEP = CELL + GAP;

let cached = loadLayout();
const subscribe = (listener: () => void) =>
  subscribeToLayout(() => {
    cached = loadLayout();
    listener();
  });

/**
 * An exact, scaled-down copy of the REAL first home page at the top of
 * Customise (DEVICE_QA P1-9): the same layout, widgets, icons, dock and
 * wallpaper, drawn at full phone size and shrunk to fill the frame. Every
 * change shows here the moment you make it. It can't be tapped.
 */
export function LivePreview() {
  const now = useClock();
  const settings = useSettings();
  const theme = useTheme();
  const layout = useSyncExternalStore(subscribe, () => cached);
  const firstPage = Math.min(...layout.map((item) => item.page).concat(0));
  const items = layout.filter((item) => item.page === firstPage);

  return (
    <div className={styles.frame}>
      <ScaledPreview>
        <div className={styles.screen}>
          {theme.retro ? (
            <div className={styles.retro}>
              <DotNumber value={`${two(now.getHours())}:${two(now.getMinutes())}`} size={64} clock />
              <span className="label">{theme.presetName}</span>
            </div>
          ) : (
            <>
              <Wallpaper place="preview" config={settings.wallpaper} />
              {items.map((item) => (
                <div
                  key={item.id}
                  className={styles.item}
                  style={{
                    left: MARGIN + item.col * STEP,
                    top: TOP + item.row * STEP,
                    width: item.w * CELL + (item.w - 1) * GAP,
                    height: item.h * CELL + (item.h - 1) * GAP,
                  }}
                >
                  <HomeItemContent item={item} />
                </div>
              ))}
              <div className={styles.dock}>
                <Dock onOpenApp={() => {}} />
              </div>
            </>
          )}
        </div>
      </ScaledPreview>
    </div>
  );
}
