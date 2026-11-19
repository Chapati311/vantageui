import { SoundIcon } from '../components/glyphs';
import { lazy, Suspense, type ComponentType } from 'react';
import { EmptyState } from '../components/kit/EmptyState';
import {
  ArcadeIcon,
  BrowserIcon,
  CalculatorIcon,
  CalendarIcon,
  CameraIcon,
  ClockIcon,
  CompassIcon,
  ContactsIcon,
  CustomiseIcon,
  FilesIcon,
  KitIcon,
  LockInIcon,
  MailIcon,
  MapsIcon,
  MessagesIcon,
  MusicIcon,
  NotesIcon,
  PhoneIcon,
  PhotosIcon,
  RecorderIcon,
  RemindersIcon,
  SettingsIcon,
  WeatherIcon, VantageIcon } from './appIcons';

/**
 * Every app is its own small file that is only downloaded the first time it
 * opens (then the service worker keeps it for offline use). The phone starts
 * with just the shell, so a cold start stays fast on the A13.
 */
function lazyApp(load: () => Promise<Record<string, unknown>>, name: string): ComponentType {
  const Lazy = lazy(() => load().then((module) => ({ default: module[name] as ComponentType })));
  return function LazyApp() {
    return (
      <Suspense fallback={<EmptyState kind="loading" title="Opening" />}>
        <Lazy />
      </Suspense>
    );
  };
}

const VantageApp = lazyApp(() => import('../vantage/VantageApp'), 'VantageApp');
const EarbudsApp = lazyApp(() => import('../apps/devices/EarbudsApp'), 'EarbudsApp');
const ArcadeApp = lazyApp(() => import('../apps/arcade/ArcadeApp'), 'ArcadeApp');
const BrowserApp = lazyApp(() => import('../apps/browser/BrowserApp'), 'BrowserApp');
const CalculatorApp = lazyApp(() => import('../apps/calculator/CalculatorApp'), 'CalculatorApp');
const CalendarApp = lazyApp(() => import('../apps/calendar/CalendarApp'), 'CalendarApp');
const CameraApp = lazyApp(() => import('../apps/camera/CameraApp'), 'CameraApp');
const ClockApp = lazyApp(() => import('../apps/clock/ClockApp'), 'ClockApp');
const CompassApp = lazyApp(() => import('../apps/compass/CompassApp'), 'CompassApp');
const ContactsApp = lazyApp(() => import('../apps/contacts/ContactsApp'), 'ContactsApp');
const CustomiseApp = lazyApp(() => import('../apps/customise/CustomiseApp'), 'CustomiseApp');
const FilesApp = lazyApp(() => import('../apps/files/FilesApp'), 'FilesApp');
const KitApp = lazyApp(() => import('../apps/kit/KitApp'), 'KitApp');
const LockInApp = lazyApp(() => import('../apps/lockin/LockInApp'), 'LockInApp');
const MailApp = lazyApp(() => import('../apps/mail/MailApp'), 'MailApp');
const MessagesApp = lazyApp(() => import('../apps/messages/MessagesApp'), 'MessagesApp');
const MusicApp = lazyApp(() => import('../apps/music/MusicApp'), 'MusicApp');
const NotesApp = lazyApp(() => import('../apps/notes/NotesApp'), 'NotesApp');
const PhoneApp = lazyApp(() => import('../apps/phone/PhoneApp'), 'PhoneApp');
const PhotosApp = lazyApp(() => import('../apps/photos/PhotosApp'), 'PhotosApp');
const RecorderApp = lazyApp(() => import('../apps/recorder/RecorderApp'), 'RecorderApp');
const RemindersApp = lazyApp(() => import('../apps/reminders/RemindersApp'), 'RemindersApp');
const SettingsApp = lazyApp(() => import('../apps/settings/SettingsApp'), 'SettingsApp');
const WeatherApp = lazyApp(() => import('../apps/weather/WeatherApp'), 'WeatherApp');

// Maps carries a big map library: it is only downloaded when Maps opens.
const LazyMaps = lazy(() => import('../apps/maps/MapsApp').then((module) => ({ default: module.MapsApp })));
function MapsApp() {
  return (
    <Suspense fallback={null}>
      <LazyMaps />
    </Suspense>
  );
}

export interface AppDefinition {
  id: string;
  name: string;
  icon: ComponentType;
  /** Extra words the search should find this app by */
  keywords?: string[];
  /** The app's own screen */
  component: ComponentType;
  /** Not on the home screen, only found by search (tools for building the OS) */
  hidden?: boolean;
  /** The original iPhone app (for "App styles: Original") */
  bundleId?: string;
}

/**
 * Every app in the OS is listed here, in ONE place.
 * To add an app, add one entry: it then shows up on the home screen
 * (in the first free spot) and in search automatically.
 */
export const APPS: AppDefinition[] = [
  { id: 'phone', name: 'Phone', icon: PhoneIcon, keywords: ['call', 'dial', 'keypad'], component: PhoneApp, bundleId: 'com.apple.mobilephone' },
  { id: 'messages', name: 'Messages', icon: MessagesIcon, keywords: ['sms', 'text', 'chat'], component: MessagesApp, bundleId: 'com.apple.MobileSMS' },
  { id: 'notes', name: 'Notes', icon: NotesIcon, keywords: ['write', 'memo', 'todo', 'checklist', 'list'], component: NotesApp, bundleId: 'com.apple.mobilenotes' },
  { id: 'clock', name: 'Clock', icon: ClockIcon, keywords: ['alarm', 'timer', 'stopwatch', 'world', 'time'], component: ClockApp },
  { id: 'lockin', name: 'Lock In', icon: LockInIcon, keywords: ['focus', 'study', 'school', 'grades', 'homework', 'pomodoro', 'work'], component: LockInApp },
  { id: 'weather', name: 'Weather', icon: WeatherIcon, keywords: ['forecast', 'rain', 'temperature'], component: WeatherApp, bundleId: 'com.apple.weather' },
  { id: 'calendar', name: 'Calendar', icon: CalendarIcon, keywords: ['events', 'agenda', 'date', 'month'], component: CalendarApp, bundleId: 'com.apple.mobilecal' },
  { id: 'reminders', name: 'Reminders', icon: RemindersIcon, keywords: ['tasks', 'todo', 'list'], component: RemindersApp, bundleId: 'com.apple.reminders' },
  { id: 'music', name: 'Music', icon: MusicIcon, keywords: ['songs', 'player', 'audio'], component: MusicApp, bundleId: 'com.apple.Music' },
  { id: 'camera', name: 'Camera', icon: CameraIcon, keywords: ['photo', 'picture', 'selfie'], component: CameraApp },
  { id: 'photos', name: 'Photos', icon: PhotosIcon, keywords: ['pictures', 'gallery', 'images'], component: PhotosApp, bundleId: 'com.apple.mobileslideshow' },
  { id: 'maps', name: 'Maps', icon: MapsIcon, keywords: ['navigation', 'directions', 'places'], component: MapsApp, bundleId: 'com.apple.Maps' },
  { id: 'calculator', name: 'Calculator', icon: CalculatorIcon, keywords: ['math', 'sum'], component: CalculatorApp },
  { id: 'recorder', name: 'Recorder', icon: RecorderIcon, keywords: ['voice', 'memo', 'record', 'audio'], component: RecorderApp, bundleId: 'com.apple.VoiceMemos' },
  { id: 'contacts', name: 'Contacts', icon: ContactsIcon, keywords: ['people', 'address book'], component: ContactsApp, bundleId: 'com.apple.MobileAddressBook' },
  { id: 'mail', name: 'Mail', icon: MailIcon, keywords: ['email', 'inbox'], component: MailApp, bundleId: 'com.apple.mobilemail' },
  { id: 'browser', name: 'Browser', icon: BrowserIcon, keywords: ['web', 'internet', 'safari', 'search'], component: BrowserApp, bundleId: 'com.apple.mobilesafari' },
  { id: 'files', name: 'Files', icon: FilesIcon, keywords: ['documents', 'pdf', 'import'], component: FilesApp, bundleId: 'com.apple.DocumentsApp' },
  { id: 'compass', name: 'Compass', icon: CompassIcon, keywords: ['north', 'direction', 'location'], component: CompassApp },
  { id: 'arcade', name: 'Arcade', icon: ArcadeIcon, keywords: ['games', 'snake', 'pong', 'tetris', 'blocks', '2048', 'minesweeper', 'pet', 'play'], component: ArcadeApp },
  {
    id: 'customise',
    name: 'Customise',
    icon: CustomiseIcon,
    keywords: ['theme', 'wallpaper', 'look', 'style', 'accent', 'color', 'design', 'setup', 'surprise', 'widgets'],
    component: CustomiseApp,
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: SettingsIcon,
    keywords: ['preferences', 'options', 'passcode', 'storage', 'about', 'reset', 'app styles'],
    component: SettingsApp,
    bundleId: 'com.apple.Preferences',
  },
  { id: 'kit', name: 'Kit', icon: KitIcon, keywords: ['components', 'design', 'test', 'ui'], component: KitApp, hidden: true },
  {
    id: 'vantage',
    name: 'Vantage',
    icon: VantageIcon,
    keywords: ['assistant', 'ai', 'ask', 'chat', 'focus', 'grades', 'study', 'school', 'lock in'],
    component: VantageApp,
  },
  { id: 'earbuds', name: 'Earbuds', icon: SoundIcon, keywords: ['airpods', 'headphones', 'battery', 'bluetooth'], component: EarbudsApp, hidden: true },
];

/** The apps that get a place on the home screen (and in the retro menus). */
export const HOME_APPS = APPS.filter((app) => !app.hidden);

/** The 4 apps that sit in the dock at the bottom of every home page, left to right. */
export const DOCK_APP_IDS = ['vantage', 'phone', 'messages', 'clock'];

export function getApp(id: string): AppDefinition | undefined {
  return APPS.find((app) => app.id === id);
}
