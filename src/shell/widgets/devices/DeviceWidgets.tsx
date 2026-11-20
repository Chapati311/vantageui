import { useEffect, useState } from 'react';
import { Widget } from '../../../components/Widget';
import { BluetoothIcon } from '../../../components/glyphs';
import { Icon } from '../../../components/Icon';
import { hasBridge } from '../../../system/nativeBridge';
import { hasRealControls, useControls } from '../../../system/phoneControls';
import styles from './DeviceWidgets.module.css';

function AirPodsGlyph() {
  return (
    <Icon>
      <path d="M7 5.500a2.500 2.500 0 0 1 2.500 2.500v3a2.500 2.500 0 0 1-2 2.450V18.500a1 1 0 0 1-2 0V8a2.500 2.500 0 0 1 1.500-2.500zM17 5.500A2.500 2.500 0 0 0 14.500 8v3a2.500 2.500 0 0 0 2 2.450V18.500a1 1 0 0 0 2 0V8A2.500 2.500 0 0 0 17 5.500z" />
    </Icon>
  );
}

/** A ring that stays empty: there is no number to show yet. */
function EmptyRing({ label }: { label: string }) {
  return (
    <div className={styles.ringItem}>
      <span className={styles.ring} />
      <span className={styles.ringLabel}>{label}</span>
    </div>
  );
}

/** A ring filled to the real battery level, the percent inside. */
function LevelRing({ label, level, charging }: { label: string; level: number; charging: boolean }) {
  const percent = Math.round(Math.max(0, Math.min(1, level)) * 100);
  return (
    <div className={styles.ringItem}>
      <span
        className={`${styles.ring} ${styles.ringFilled}`}
        style={{ background: `conic-gradient(var(--color-accent) ${percent}%, var(--color-hairline) 0)` }}
        aria-label={`${label} ${percent}%${charging ? ', charging' : ''}`}
      >
        <span className={styles.ringValue}>{percent}</span>
      </span>
      <span className={styles.ringLabel}>{label}</span>
    </div>
  );
}

/** "Aaryan's AirPods Pro - Left" -> "Left" (short names under the rings). */
const shortName = (name: string) => {
  const part = name.match(/\b(left|right|case)\b/i)?.[1];
  return part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : name.split(/\s+/).slice(-1)[0];
};

/**
 * AirPods battery (left, right, case). On the phone the numbers come from
 * iOS (Part 2, BatteryCenter); before that the widget says so instead of
 * guessing numbers.
 */
export function AirPodsWidget() {
  const controls = useControls();
  if (hasRealControls()) {
    const parts = (controls.accessories ?? []).slice(0, 3);
    return (
      <Widget shape="rounded">
        <div className={styles.device}>
          <div className={styles.head}>
            <AirPodsGlyph />
            <span className={styles.title}>AirPods</span>
          </div>
          {parts.length ? (
            <div className={styles.rings}>
              {parts.map((part) => (
                <LevelRing key={part.name} label={shortName(part.name)} level={part.level} charging={part.charging} />
              ))}
            </div>
          ) : (
            <span className={styles.note}>Not connected</span>
          )}
        </div>
      </Widget>
    );
  }
  return (
    <Widget shape="rounded">
      <div className={styles.device}>
        <div className={styles.head}>
          <AirPodsGlyph />
          <span className={styles.title}>AirPods</span>
        </div>
        <div className={styles.rings}>
          <EmptyRing label="L" />
          <EmptyRing label="R" />
          <EmptyRing label="Case" />
        </div>
        <span className={styles.note}>{hasBridge() ? 'Not connected' : 'Available after unlock'}</span>
      </div>
    </Widget>
  );
}

/** Bluetooth devices that are connected. Needs the native bridge. */
export function ConnectedDevicesWidget() {
  const controls = useControls();
  if (hasRealControls()) {
    const devices = controls.bluetooth?.devices ?? [];
    return (
      <Widget shape="rounded">
        <div className={styles.device}>
          <div className={styles.head}>
            <BluetoothIcon />
            <span className={styles.title}>Devices</span>
          </div>
          {controls.bluetooth && !controls.bluetooth.on ? (
            <span className={styles.note}>Bluetooth off</span>
          ) : devices.length ? (
            <ul className={styles.list}>
              {devices.slice(0, 3).map((device) => (
                <li key={device.name} className={styles.listRow}>
                  <span className={styles.listName}>{device.name}</span>
                  {device.battery !== undefined && <span className={styles.listValue}>{Math.round(device.battery * 100)}%</span>}
                </li>
              ))}
            </ul>
          ) : (
            <span className={styles.note}>Nothing connected</span>
          )}
        </div>
      </Widget>
    );
  }
  return (
    <Widget shape="rounded">
      <div className={styles.device}>
        <div className={styles.head}>
          <BluetoothIcon />
          <span className={styles.title}>Devices</span>
        </div>
        <span className={styles.note}>{hasBridge() ? 'Nothing connected' : 'Available after unlock'}</span>
      </div>
    </Widget>
  );
}

const megabytes = (bytes: number) =>
  bytes >= 1e9 ? `${(bytes / 1e9).toFixed(1)} GB` : `${Math.max(0.1, bytes / 1e6).toFixed(1)} MB`;

/**
 * Storage. A web app can only see its own share: how much Vantage stores
 * (notes, photos, recordings) out of what the browser allows it. The whole
 * phone's storage needs the bridge.
 */
export function StorageWidget() {
  const [usage, setUsage] = useState<{ used: number; quota: number } | null>(null);

  useEffect(() => {
    void navigator.storage
      ?.estimate?.()
      .then(({ usage: used = 0, quota = 0 }) => setUsage({ used, quota }))
      .catch(() => setUsage(null));
  }, []);

  const fraction = usage && usage.quota ? Math.min(1, usage.used / usage.quota) : 0;
  return (
    <Widget shape="rounded">
      <div className={styles.device}>
        <span className="label">Vantage storage</span>
        <span className={styles.big}>{usage ? megabytes(usage.used) : '--'}</span>
        <span className={styles.bar}>
          <span className={styles.barFill} style={{ transform: `scaleX(${Math.max(0.02, fraction)})` }} />
        </span>
        <span className={styles.note}>Whole phone: available after unlock</span>
      </div>
    </Widget>
  );
}
