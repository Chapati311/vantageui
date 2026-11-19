import { BoltIcon } from '../components/glyphs';
import { useSetting, type BatteryStyle } from '../system/settingsStore';
import { useBattery } from '../system/useBattery';
import styles from './BatteryIndicator.module.css';

/** How many blocks the "pixel" style has. */
const BLOCKS = 5;

/**
 * The battery in the status row, in the style chosen in Customise > Status
 * bar: percent (number + outline), ring, bar (outline only) or pixel blocks.
 * Hidden while the level is unknown (no "--"): on the phone the value comes
 * from the native bridge a moment after start.
 */
export function BatteryIndicator({ style }: { style?: BatteryStyle }) {
  const battery = useBattery();
  const [saved] = useSetting('batteryStyle');
  if (!battery) return null;
  const look = style ?? saved;
  const level = battery?.level ?? 0;
  const percent = battery ? Math.round(level * 100) : null;
  const label =
    percent === null
      ? 'Battery unknown'
      : `Battery ${percent}%${battery?.charging ? ', charging' : ''}`;

  return (
    <div className={styles.battery} aria-label={label}>
      {battery?.charging && (
        <span className={styles.bolt}>
          <BoltIcon />
        </span>
      )}
      {(look === 'percent' || look === 'ring') && (
        <span className={styles.label}>{percent === null ? '--' : `${percent}%`}</span>
      )}
      {look === 'ring' ? (
        <span className={styles.ring} style={{ ['--level' as string]: level }} />
      ) : look === 'pixel' ? (
        <span className={styles.blocks}>
          {Array.from({ length: BLOCKS }, (_, index) => (
            <span key={index} className={index < Math.round(level * BLOCKS) ? styles.blockOn : styles.block} />
          ))}
        </span>
      ) : (
        <span className={styles.icon}>
          <span className={styles.fill} style={{ transform: `scaleX(${level})` }} />
        </span>
      )}
    </div>
  );
}
