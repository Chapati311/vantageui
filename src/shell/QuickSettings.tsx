import { useRef } from 'react';
import { RoundToggle } from '../components/RoundToggle';
import { Slider } from '../components/Slider';
import {
  BluetoothIcon,
  FlashlightIcon,
  MoonIcon,
  SunIcon,
  WifiIcon,
} from '../components/glyphs';
import { useSetting } from '../system/settingsStore';
import styles from './QuickSettings.module.css';

interface QuickSettingsProps {
  open: boolean;
  onClose: () => void;
}

/** Swipe up further than this (px) on the panel to close it. */
const CLOSE_SWIPE = 40;

/**
 * The panel that slides down from the top. For now the toggles only change
 * their look (and are remembered); they are not connected to the phone yet.
 */
export function QuickSettings({ open, onClose }: QuickSettingsProps) {
  const [wifi, setWifi] = useSetting('wifi');
  const [bluetooth, setBluetooth] = useSetting('bluetooth');
  const [flashlight, setFlashlight] = useSetting('flashlight');
  const [doNotDisturb, setDoNotDisturb] = useSetting('doNotDisturb');
  const [brightness, setBrightness] = useSetting('brightness');
  const swipeStartY = useRef<number | null>(null);

  return (
    <div className={`${styles.layer} ${open ? styles.open : ''}`} aria-hidden={!open}>
      {/* Dark area below the panel: tap it to close */}
      <div className={styles.backdrop} onClick={onClose} />

      <div
        className={styles.panel}
        onPointerDown={(event) => {
          swipeStartY.current = event.clientY;
        }}
        onPointerUp={(event) => {
          const start = swipeStartY.current;
          swipeStartY.current = null;
          if (start !== null && start - event.clientY > CLOSE_SWIPE) onClose();
        }}
      >
        <div className={styles.toggles}>
          <RoundToggle label="Wi-Fi" icon={WifiIcon} on={wifi} onChange={setWifi} />
          <RoundToggle label="Bluetooth" icon={BluetoothIcon} on={bluetooth} onChange={setBluetooth} />
          <RoundToggle label="Flashlight" icon={FlashlightIcon} on={flashlight} onChange={setFlashlight} />
          <RoundToggle label="DND" icon={MoonIcon} on={doNotDisturb} onChange={setDoNotDisturb} />
        </div>
        <Slider label="Brightness" icon={SunIcon} value={brightness} onChange={setBrightness} />
        <span className={styles.handle} />
      </div>
    </div>
  );
}
