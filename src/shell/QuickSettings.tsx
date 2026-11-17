import { useDrag } from '@use-gesture/react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useRef } from 'react';
import { Dial } from '../components/kit/Dial';
import { RoundToggle } from '../components/RoundToggle';
import {
  BluetoothIcon,
  FlashlightIcon,
  MoonIcon,
  SunIcon,
  WifiIcon,
} from '../components/glyphs';
import { useSetting } from '../system/settingsStore';
import { MOTION, SPRING, rubberBand } from '../theme/tokens';
import styles from './QuickSettings.module.css';
import { runAction } from '../system/actions';

interface QuickSettingsProps {
  open: boolean;
  onClose: () => void;
}

/**
 * The frosted panel that springs down from the top. Drag it up to close:
 * it follows the finger, and a flick is enough. For now the controls only
 * change their look (and are remembered); they are not connected to the phone.
 */
export function QuickSettings({ open, onClose }: QuickSettingsProps) {
  const [wifi] = useSetting('wifi');
  const [bluetooth] = useSetting('bluetooth');
  const [flashlight] = useSetting('flashlight');
  const [doNotDisturb] = useSetting('doNotDisturb');
  const [brightness] = useSetting('brightness');
  const toggle = (control: 'wifi' | 'bluetooth' | 'flashlight' | 'doNotDisturb') => (on: boolean) =>
    void runAction('controls.toggle', { control, on });
  const panel = useRef<HTMLDivElement>(null);

  // 0 = parked above the screen, 1 = fully down
  const shown = useMotionValue(open ? 1 : 0);
  const y = useTransform(shown, (value) => `${(value - 1) * 100}%`);
  const backdrop = useTransform(shown, [0, 1], [0, 0.6]);

  useEffect(() => {
    animate(shown, open ? 1 : 0, SPRING.sheet);
  }, [open, shown]);

  const bind = useDrag(
    ({ first, last, movement: [, moved], velocity: [, speed], direction: [, direction], memo }) => {
      const height = panel.current?.offsetHeight ?? 1;
      if (first) {
        shown.stop(); // catch it mid-spring
        memo = shown.get();
      }
      // Pulling it further down than fully open rubber-bands.
      const value = rubberBand((memo as number) + moved / height, 0, 1);
      if (!last) {
        shown.set(value);
        return memo;
      }
      const flick = speed > MOTION.flickVelocity;
      const stayOpen = flick ? direction > 0 : value > 0.5;
      const velocity = ((direction > 0 ? speed : -speed) * 1000) / height;
      animate(shown, stayOpen ? 1 : 0, { ...SPRING.sheet, velocity });
      if (!stayOpen) onClose();
      return memo;
    },
    { axis: 'y', filterTaps: true, enabled: open },
  );

  return (
    <div className={`${styles.layer} ${open ? styles.open : ''}`} aria-hidden={!open}>
      {/* Dark area below the panel: tap it to close */}
      <motion.div className={styles.backdrop} style={{ opacity: backdrop }} onClick={onClose} />

      <motion.div ref={panel} className={styles.panel} style={{ y }} {...(bind() as object)}>
        <div className={styles.toggles}>
          <RoundToggle label="Wi-Fi" icon={WifiIcon} on={wifi} onChange={toggle('wifi')} />
          <RoundToggle label="Bluetooth" icon={BluetoothIcon} on={bluetooth} onChange={toggle('bluetooth')} />
          <RoundToggle label="Light" icon={FlashlightIcon} on={flashlight} onChange={toggle('flashlight')} />
          <RoundToggle label="DND" icon={MoonIcon} on={doNotDisturb} onChange={toggle('doNotDisturb')} />
        </div>
        <div className={styles.dial}>
          <Dial label="Brightness" icon={SunIcon} value={brightness} onChange={(level) => void runAction('controls.setBrightness', { level })} />
        </div>
        <span className={styles.handle} />
      </motion.div>
    </div>
  );
}
