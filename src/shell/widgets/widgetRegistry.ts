import { runAction } from '../../system/actions';
import { getSettings } from '../../system/settingsStore';
import { playSound } from '../../system/sounds';
import { AskWidget } from './AskWidget';
import { BatteryWidget } from './BatteryWidget';
import { CalendarWidget } from './CalendarWidget';
import { ClockWidget } from './ClockWidget';
import { DateWidget } from './DateWidget';
import { FlashlightWidget } from './FlashlightWidget';
import { MusicWidget } from './MusicWidget';
import { NotesWidget } from './NotesWidget';
import { PhotoWidget } from './PhotoWidget';
import { VoiceNoteWidget } from './VoiceNoteWidget';
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
  {
    id: 'ask',
    name: 'Ask Vantage',
    component: AskWidget,
    sizes: ['4x1'],
    // Until the Assistant app exists, the bar opens search.
    onTap: ({ openSearch }) => openSearch(),
  },
  { id: 'music', name: 'Now playing', component: MusicWidget, sizes: ['2x2'] },
  { id: 'voice', name: 'Voice note', component: VoiceNoteWidget, sizes: ['1x1'] },
  {
    id: 'flashlight',
    name: 'Flashlight',
    component: FlashlightWidget,
    sizes: ['1x1'],
    // Same switch as in quick settings. For now it only changes its look.
    onTap: () => {
      const on = !getSettings().flashlight;
      void runAction('controls.toggle', { control: 'flashlight', on });
      playSound(on ? 'toggleOn' : 'toggleOff');
    },
  },
  { id: 'calendar', name: 'Calendar', component: CalendarWidget, sizes: ['2x2'] },
  { id: 'photo', name: 'Photo', component: PhotoWidget, sizes: ['2x2', '2x1'] },
  {
    id: 'notes',
    name: 'Notes',
    component: NotesWidget,
    sizes: ['2x1', '2x2'],
    onTap: ({ openApp }) => openApp('notes'),
  },
];

export function getWidget(id: string): WidgetDefinition | undefined {
  return WIDGETS.find((widget) => widget.id === id);
}
