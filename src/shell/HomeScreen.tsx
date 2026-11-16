import type { ComponentType } from 'react';
import { Dock } from './Dock';
import { BatteryWidget } from './widgets/BatteryWidget';
import { ClockWidget } from './widgets/ClockWidget';
import { WeatherWidget } from './widgets/WeatherWidget';
import styles from './HomeScreen.module.css';

/**
 * The widgets on the home screen, in order.
 * To add one: create it in shell/widgets and add it to this list.
 */
const WIDGETS: ComponentType[] = [ClockWidget, WeatherWidget, BatteryWidget];

export function HomeScreen() {
  return (
    <div className={styles.home}>
      <div className={styles.grid}>
        {WIDGETS.map((WidgetComponent, index) => (
          <WidgetComponent key={index} />
        ))}
      </div>
      <Dock />
    </div>
  );
}
