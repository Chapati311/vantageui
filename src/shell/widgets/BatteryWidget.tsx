import { Widget } from '../../components/Widget';
import { useBattery } from '../../system/useBattery';
import styles from './BatteryWidget.module.css';

export function BatteryWidget() {
  const battery = useBattery();
  const percent = battery ? Math.round(battery.level * 100) : null;

  return (
    <Widget size="small" label="Battery">
      <div className={styles.percent}>
        {percent === null ? '--' : percent}
        <span className={styles.unit}>%</span>
      </div>
      <div className={styles.bottom}>
        <div className={styles.status}>
          {battery === null ? 'Unknown' : battery.charging ? 'Charging' : 'On battery'}
        </div>
        <div className={styles.track}>
          <div className={styles.fill} style={{ transform: `scaleX(${battery?.level ?? 0})` }} />
        </div>
      </div>
    </Widget>
  );
}
