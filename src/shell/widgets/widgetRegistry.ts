import { BatteryWidget } from './BatteryWidget';
import { ClockWidget } from './ClockWidget';
import { DateWidget } from './DateWidget';
import { WeatherWidget } from './WeatherWidget';
import type { WidgetDefinition } from './types';

/**
 * Every widget is listed here. To add one: create its component in this
 * folder, add an entry below, and place it in home/defaultLayout.ts.
 */
export const WIDGETS: WidgetDefinition[] = [
  { id: 'clock', name: 'Clock', component: ClockWidget, sizes: ['2x2', '2x1'] },
  { id: 'weather', name: 'Weather', component: WeatherWidget, sizes: ['2x1', '2x2', '1x1'] },
  { id: 'battery', name: 'Battery', component: BatteryWidget, sizes: ['1x1', '2x2'] },
  { id: 'date', name: 'Date', component: DateWidget, sizes: ['1x1', '2x2'] },
];

export function getWidget(id: string): WidgetDefinition | undefined {
  return WIDGETS.find((widget) => widget.id === id);
}
