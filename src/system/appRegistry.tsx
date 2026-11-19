import { EarbudsApp } from '../apps/devices/EarbudsApp';
import { SoundIcon } from '../components/glyphs';
import { lazy, Suspense, type ComponentType } from 'react';
import { ArcadeApp } from '../apps/arcade/ArcadeApp';
import { BrowserApp } from '../apps/browser/BrowserApp';
import { CalculatorApp } from '../apps/calculator/CalculatorApp';
import { CalendarApp } from '../apps/calendar/CalendarApp';
import { CameraApp } from '../apps/camera/CameraApp';
import { ClockApp } from '../apps/clock/ClockApp';
import { CompassApp } from '../apps/compass/CompassApp';
import { ContactsApp } from '../apps/contacts/ContactsApp';
import { CustomiseApp } from '../apps/customise/CustomiseApp';
import { FilesApp } from '../apps/files/FilesApp';
import { KitApp } from '../apps/kit/KitApp';
import { LockInApp } from '../apps/lockin/LockInApp';
import { MailApp } from '../apps/mail/MailApp';
import { MessagesApp } from '../apps/messages/MessagesApp';
import { MusicApp } from '../apps/music/MusicApp';
import { NotesApp } from '../apps/notes/NotesApp';
import { PhoneApp } from '../apps/phone/PhoneApp';
import { PhotosApp } from '../apps/photos/PhotosApp';
import { RecorderApp } from '../apps/recorder/RecorderApp';
import { RemindersApp } from '../apps/reminders/RemindersApp';
import { SettingsApp } from '../apps/settings/SettingsApp';
import { WeatherApp } from '../apps/weather/WeatherApp';
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
  WeatherIcon,
} from './appIcons';

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
  { id: 'earbuds', name: 'Earbuds', icon: SoundIcon, keywords: ['airpods', 'headphones', 'battery', 'bluetooth'], component: EarbudsApp, hidden: true },
];

/** The apps that get a place on the home screen (and in the retro menus). */
export const HOME_APPS = APPS.filter((app) => !app.hidden);

/** The 4 apps that sit in the dock at the bottom of every home page, left to right. */
export const DOCK_APP_IDS = ['phone', 'messages', 'notes', 'clock'];

export function getApp(id: string): AppDefinition | undefined {
  return APPS.find((app) => app.id === id);
}
