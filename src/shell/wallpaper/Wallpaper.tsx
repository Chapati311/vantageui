import { motion, useMotionValue, useTransform, type MotionValue } from 'motion/react';
import type { CSSProperties } from 'react';
import { useSetting } from '../../system/settingsStore';
import { useTheme } from '../../system/theme';
import { useWallpaperPhoto } from '../../system/wallpaperPhoto';
import { gradientCss, gradientStops, type WallpaperConfig, imageUrl } from '../../theme/wallpapers';
import { LockOrbit } from '../LockOrbit';
import { homePageProgress } from '../home/homeMotion';
import { LiveAurora } from './LiveAurora';
import { LivePixel } from './LivePixel';
import { LiveStarfield } from './LiveStarfield';
import { LiveSundown } from './LiveSundown';
import { LiveCodeRain } from './LiveCodeRain';
import { LiveGlobe, LiveNetGraph, LiveRadar } from './LiveHacker';
import { LiveWaves } from './LiveWaves';
import { WeatherLayer } from './WeatherLayer';
import styles from './Wallpaper.module.css';

interface WallpaperProps {
  /**
   * lock    = full strength, reacts to the unlock swipe
   * home    = darkened (and blurred, if set) behind the home screen
   * preview = a still copy, for Settings
   */
  place: 'lock' | 'home' | 'preview';
  /** Show this wallpaper instead of the current one (Settings previews) */
  config?: WallpaperConfig;
  /** Stop all movement (when it can't be seen) to save battery */
  paused?: boolean;
  /** Lock screen: how far it has been swiped away, 0 to 1 */
  progress?: MotionValue<number>;
}

/** The background of the lock and home screens, whatever kind it is. */
export function Wallpaper({ place, config, paused = false, progress }: WallpaperProps) {
  const theme = useTheme();
  const photo = useWallpaperPhoto();
  const [parallax] = useSetting('parallax');
  const fallback = useMotionValue(0);
  const swipe = progress ?? fallback;

  // While the lock screen is swiped away, its wallpaper lags behind (parallax),
  // grows a little and fades.
  const y = useTransform(swipe, (value) => `${value * 12}vh`);
  const scale = useTransform(swipe, [0, 1], [1, 1.15]);
  const opacity = useTransform(swipe, [0, 1], [1, 0.4]);
  // Home: the wallpaper moves a little slower than the pages (depth)
  const homeX = useTransform(homePageProgress, (page) => -page * 10);

  const wallpaper = config?.kind === 'theme' || !config ? theme.wallpaper : config;
  const blurred = place === 'home';

  let layer: React.ReactNode = null;
  switch (wallpaper.kind) {
    case 'solid':
      layer = (
        <div
          className={styles.fill}
          style={{ background: wallpaper.color === 'bg' ? 'var(--color-bg)' : wallpaper.color }}
        />
      );
      break;
    case 'gradient':
      layer = <div className={styles.fill} style={{ background: gradientCss(gradientStops(wallpaper.id, theme.dark, theme.themeStops)) }} />;
      break;
    case 'image':
      layer = <div className={styles.fill} style={{ backgroundImage: `url(${imageUrl(wallpaper.id)})` }} />;
      break;
    case 'photo':
      layer = photo ? (
        <div className={styles.fill} style={{ backgroundImage: `url(${photo.dataUrl})` } as CSSProperties} />
      ) : null;
      break;
    case 'live':
      switch (wallpaper.id) {
        case 'orbit':
          layer = <LockOrbit paused={paused} progress={swipe} quiet={place !== 'lock'} />;
          break;
        case 'starfield':
          layer = <LiveStarfield />;
          break;
        case 'sundown':
          layer = <LiveSundown />;
          break;
        case 'coderain':
          layer = <LiveCodeRain paused={paused || place === 'preview'} />;
          break;
        case 'globe':
          layer = <LiveGlobe paused={paused || place === 'preview'} />;
          break;
        case 'radar':
          layer = <LiveRadar paused={paused || place === 'preview'} />;
          break;
        case 'netgraph':
          layer = <LiveNetGraph paused={paused || place === 'preview'} />;
          break;
        case 'pixel':
          layer = <LivePixel />;
          break;
        case 'waves':
          layer = <LiveWaves />;
          break;
        case 'aurora':
          layer = <LiveAurora />;
          break;
      }
      break;
  }

  // Orbit moves on its own when swiped; everything else uses the shared parallax.
  const ownSwipe = wallpaper.kind === 'live' && wallpaper.id === 'orbit';
  const photoLike = wallpaper.kind === 'photo' || wallpaper.kind === 'gradient' || wallpaper.kind === 'image';

  return (
    <div
      className={`${styles.wallpaper} ${paused ? styles.paused : ''} ${styles[place]}`}
      aria-hidden="true"
    >
      <motion.div
        className={`${styles.layer} ${blurred ? styles.blurred : ''}`}
        style={place === 'lock' && !ownSwipe ? (parallax ? { y, scale, opacity } : { opacity }) : place === 'home' && parallax ? { x: homeX, scale: 1.06 } : undefined}
      >
        {layer}
      </motion.div>
      {place !== 'preview' && <WeatherLayer paused={paused} />}
      {/* Home: darken it so widgets stand out. Lock: a soft shade behind the clock on photos. */}
      {place === 'home' && <div className={styles.dim} />}
      {place === 'lock' && photoLike && <div className={styles.scrim} />}
    </div>
  );
}
