import type { ComponentType } from 'react';
import { ClockApp } from '../apps/clock/ClockApp';
import { NotesApp } from '../apps/notes/NotesApp';
import { SettingsApp } from '../apps/settings/SettingsApp';
import { WeatherApp } from '../apps/weather/WeatherApp';
import {
  CalculatorIcon,
  ClockIcon,
  MapsIcon,
  MessagesIcon,
  MusicIcon,
  NotesIcon,
  PhoneIcon,
  SettingsIcon,
  WeatherIcon,
} from './appIcons';

export interface AppDefinition {
  id: string;
  name: string;
  icon: ComponentType;
  /** Extra words the search should find this app by */
  keywords?: string[];
  /** The app's own screen. Apps without one show a "coming soon" screen. */
  component?: ComponentType;
}

/**
 * Every app in the OS is listed here, in ONE place.
 * To add an app, add one entry: it then shows up on the home screen
 * (in the first free spot) and in search automatically.
 */
export const APPS: AppDefinition[] = [
  { id: 'phone', name: 'Phone', icon: PhoneIcon, keywords: ['call', 'dial'] },
  { id: 'messages', name: 'Messages', icon: MessagesIcon, keywords: ['sms', 'text', 'chat'] },
  {
    id: 'notes',
    name: 'Notes',
    icon: NotesIcon,
    keywords: ['write', 'memo', 'todo', 'checklist', 'list'],
    component: NotesApp,
  },
  {
    id: 'clock',
    name: 'Clock',
    icon: ClockIcon,
    keywords: ['timer', 'stopwatch', 'world', 'time'],
    component: ClockApp,
  },
  {
    id: 'weather',
    name: 'Weather',
    icon: WeatherIcon,
    keywords: ['forecast', 'rain', 'temperature'],
    component: WeatherApp,
  },
  { id: 'calculator', name: 'Calculator', icon: CalculatorIcon, keywords: ['math', 'sum'] },
  { id: 'music', name: 'Music', icon: MusicIcon, keywords: ['spotify', 'songs'] },
  { id: 'maps', name: 'Maps', icon: MapsIcon, keywords: ['navigation', 'directions'] },
  {
    id: 'settings',
    name: 'Settings',
    icon: SettingsIcon,
    keywords: ['preferences', 'options', 'sound', 'wallpaper', 'accent', 'color', 'mode', 'theme'],
    component: SettingsApp,
  },
];

export function getApp(id: string): AppDefinition | undefined {
  return APPS.find((app) => app.id === id);
}
