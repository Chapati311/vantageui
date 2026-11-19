import { AppShell, Row, Section, SegmentedControl, Toggle } from '../../components/kit';
import styles from './Earbuds.module.css';

/** Line-art earbuds and their case, like a product photo drawn in thin lines. */
function EarbudsArt() {
  return (
    <svg className={styles.art} viewBox="0 0 240 150" aria-hidden="true">
      {/* Left bud */}
      <g className={styles.bud}>
        <ellipse cx="62" cy="48" rx="24" ry="20" />
        <ellipse cx="62" cy="48" rx="11" ry="9" className={styles.thin} />
        <path d="M58 66 L54 132 Q54 140 62 140 Q70 140 70 132 L72 64" />
        <path d="M58 120 H70" className={styles.thin} />
      </g>
      {/* Right bud */}
      <g className={styles.bud}>
        <ellipse cx="178" cy="48" rx="24" ry="20" />
        <ellipse cx="178" cy="48" rx="11" ry="9" className={styles.thin} />
        <path d="M182 66 L186 132 Q186 140 178 140 Q170 140 170 132 L168 64" />
        <path d="M170 120 H182" className={styles.thin} />
      </g>
      {/* Case, in the middle, a little behind */}
      <g className={styles.case}>
        <rect x="92" y="62" width="56" height="74" rx="22" />
        <path d="M92 86 H148" className={styles.thin} />
        <circle cx="120" cy="100" r="2.4" className={styles.light} />
      </g>
    </svg>
  );
}

/** One battery ring with its label; empty until the bridge can read it. */
function BatteryRing({ label }: { label: string }) {
  return (
    <div className={styles.ring}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="44" />
      </svg>
      <span className={styles.ringValue}>--</span>
      <span className="label">{label}</span>
    </div>
  );
}

/**
 * The earbuds page (opened from the AirPods widget): a big line drawing of
 * the earbuds, the battery of each bud and the case, and their settings.
 * A web app can't talk to Bluetooth audio devices, so everything waits for
 * the native bridge after the jailbreak.
 */
export function EarbudsApp() {
  return (
    <AppShell title="Earbuds">
      <div className={styles.hero}>
        <EarbudsArt />
        <span className="label">Available after unlock</span>
      </div>

      <div className={styles.rings}>
        <BatteryRing label="Left" />
        <BatteryRing label="Case" />
        <BatteryRing label="Right" />
      </div>

      <Section label="Noise control" card={false} note="Connects through the native bridge after the jailbreak.">
        <SegmentedControl
          label="Noise control"
          value="off"
          onChange={() => undefined}
          disabled
          options={[
            { id: 'off', label: 'Off' },
            { id: 'transparency', label: 'Transparency' },
            { id: 'anc', label: 'Cancelling' },
          ]}
        />
      </Section>

      <Section label="Settings">
        <Row title="In-ear detection" trailing={<Toggle label="In-ear detection" on={false} onChange={() => undefined} disabled />} />
        <Row title="Low latency mode" trailing={<Toggle label="Low latency mode" on={false} onChange={() => undefined} disabled />} />
        <Row title="Find my earbuds" value="After unlock" />
      </Section>
    </AppShell>
  );
}
