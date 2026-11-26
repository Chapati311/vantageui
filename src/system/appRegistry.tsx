import { SoundIcon } from '../components/glyphs';
import { FieldGuideIcon, NetrunnerIcon } from '../apps/netrunner/icons';
import { isHosted } from './nativeBridge';
import { bundleIdOf, getNativeApp, getNativeApps, isNativeAppId, nativeAppId } from './nativeApps';
import { lazy, Suspense, type ComponentType } from 'react';
import { CrashGuard, loadOrReload } from './staleBuild';
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
  // A load that fails because a new version replaced this one reloads onto it
  const Lazy = lazy(loadOrReload(() => load().then((module) => ({ default: module[name] as ComponentType }))));
  return function LazyApp() {
    return (
      // One app crashing never blanks the whole of Vantage
      <CrashGuard fallback={(retry) => <EmptyState kind="error" title="This app hit a problem" message="The rest of Vantage is fine." action={{ label: 'Try again', onPress: retry }} />}>
        <Suspense fallback={<EmptyState kind="loading" title="Opening" />}>
          <Lazy />
        </Suspense>
      </CrashGuard>
    );
  };
}

const VantageApp = lazyApp(() => import('../vantage/VantageApp'), 'VantageApp');
const EarbudsApp = lazyApp(() => import('../apps/devices/EarbudsApp'), 'EarbudsApp');
const NetrunnerApp = lazyApp(() => import('../apps/netrunner/NetrunnerApp'), 'NetrunnerApp');
const GuideApp = lazyApp(() => import('../apps/guide/GuideApp'), 'GuideApp');
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
const LazyMaps = lazy(loadOrReload(() => import('../apps/maps/MapsApp').then((module) => ({ default: module.MapsApp }))));
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
  /** A real app installed on the phone (host mode): tapping it opens the real app */
  native?: boolean;
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
  { id: 'lockin', name: 'Focus', icon: LockInIcon, keywords: ['lock in', 'focus', 'study', 'school', 'grades', 'homework', 'pomodoro', 'work'], component: LockInApp },
  { id: 'weather', name: 'Weather', icon: WeatherIcon, keywords: ['forecast', 'rain', 'temperature'], component: WeatherApp, bundleId: 'com.apple.weather' },
  { id: 'calendar', name: 'Calendar', icon: CalendarIcon, keywords: ['events', 'agenda', 'date', 'month'], component: CalendarApp, bundleId: 'com.apple.mobilecal' },
  { id: 'reminders', name: 'Reminders', icon: RemindersIcon, keywords: ['tasks', 'todo', 'list'], component: RemindersApp, bundleId: 'com.apple.reminders' },
  { id: 'music', name: 'Music', icon: MusicIcon, keywords: ['songs', 'player', 'audio'], component: MusicApp, bundleId: 'com.apple.Music' },
  { id: 'camera', name: 'Camera', icon: CameraIcon, keywords: ['photo', 'picture', 'selfie'], component: CameraApp, bundleId: 'com.apple.camera' },
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
  {
    id: 'netrunner',
    name: 'Netrunner',
    icon: NetrunnerIcon,
    keywords: ['hacker', 'hack', 'network', 'wifi', 'scan', 'nmap', 'ping', 'traceroute', 'dns', 'whois', 'speed test', 'privacy', 'trackers', 'packets', 'tcpdump', 'bluetooth', 'security', 'ports', 'terminal', 'shell', 'ssh', 'hash', 'base64', 'jwt', 'qr', 'ctf'],
    component: NetrunnerApp,
  },
  {
    id: 'guide',
    name: 'Field Guide',
    icon: FieldGuideIcon,
    keywords: ['how to', 'guide', 'tutorial', 'ssh', 'scan', 'devices', 'wifi', 'nmap', 'files', 'scp', 'tcpdump', 'wireshark', 'bluetooth', 'python', 'sileo', 'jailbreak', 'install', 'hack', 'learn'],
    component: GuideApp,
  },
  { id: 'earbuds', name: 'Earbuds', icon: SoundIcon, keywords: ['airpods', 'headphones', 'battery', 'bluetooth'], component: EarbudsApp, hidden: true },
];

/** The apps that get a place on the home screen (and in the retro menus). */
export const HOME_APPS = APPS.filter((app) => !app.hidden);

/** The 4 apps that sit in the dock at the bottom of every home page, left to right. */
export const DOCK_APP_IDS = ['vantage', 'phone', 'messages', 'clock'];

export function getApp(id: string): AppDefinition | undefined {
  if (isNativeAppId(id)) return nativeDefinition(bundleIdOf(id));
  return APPS.find((app) => app.id === id);
}

// ---- Host mode: the phone's real apps (REAL_OS_PROMPT Part 1) ---------------------------

/**
 * Vantage's own apps that stay in host mode: they use real data and are as
 * good as the originals. Every other Vantage app (Phone, Messages, Mail,
 * Browser, Camera, Photos, Settings, Maps, Music, Calendar, Contacts, ...)
 * gives way to the REAL iPhone app.
 */
export const HOST_VANTAGE_APPS = ['vantage', 'customise', 'clock', 'weather', 'calculator', 'compass', 'recorder', 'notes', 'arcade'];

/** Real apps that a kept Vantage app already covers: in the App Library, not on the home pages. */
const COVERED_BY_VANTAGE = ['com.apple.mobiletimer', 'com.apple.weather', 'com.apple.calculator', 'com.apple.compass', 'com.apple.VoiceMemos'];

/** One definition per real app, made once and reused (stable icons, no re-renders). */
const nativeDefs = new Map<string, { icon: string; badge: unknown; def: AppDefinition }>();

function nativeDefinition(bundleId: string): AppDefinition | undefined {
  const app = getNativeApp(bundleId);
  if (!app) return undefined;
  const cached = nativeDefs.get(bundleId);
  if (cached && cached.icon === app.icon && cached.badge === app.badge && cached.def.name === app.name) return cached.def;
  const src = `data:image/png;base64,${app.icon}`;
  function NativeIcon() {
    return <img className="native-app-icon" src={src} alt="" draggable={false} decoding="async" />;
  }
  const def: AppDefinition = {
    id: nativeAppId(bundleId),
    name: app.name,
    icon: NativeIcon,
    keywords: [app.category ?? '', app.source === 'jailbreak' ? 'jailbreak tweak' : ''].filter(Boolean),
    component: () => null,
    bundleId,
    native: true,
  };
  nativeDefs.set(bundleId, { icon: app.icon, badge: app.badge, def });
  return def;
}

const keptVantageApps = () => HOST_VANTAGE_APPS.map((id) => APPS.find((app) => app.id === id)).filter((app): app is AppDefinition => !!app);
const realApps = () => getNativeApps().map((app) => nativeDefinition(app.bundleId)).filter((app): app is AppDefinition => !!app);

/** Vantage apps that are an option next to the real one: App Library and search only. */
const OPTION_ONLY = ['notes'];

/** Real apps that Vantage has its own glyph for (glyph, block and pixel icon packs). */
const EXTRA_TWINS: Record<string, string> = {
  'com.apple.mobiletimer': 'clock',
  'com.apple.calculator': 'calculator',
  'com.apple.compass': 'compass',
};
export function vantageTwinOf(bundleId: string | undefined): AppDefinition | undefined {
  if (!bundleId) return undefined;
  const id = EXTRA_TWINS[bundleId];
  return id ? APPS.find((app) => app.id === id) : APPS.find((app) => app.bundleId === bundleId);
}

/** Apps that get a place on the home pages. */
export function homeApps(): AppDefinition[] {
  if (!isHosted()) return HOME_APPS;
  return [
    ...keptVantageApps().filter((app) => !OPTION_ONLY.includes(app.id)),
    ...realApps().filter((app) => !COVERED_BY_VANTAGE.includes(app.bundleId ?? '')),
  ];
}

/** Every app (search, App Library): in host mode the kept Vantage apps plus every real app. */
export function allApps(): AppDefinition[] {
  if (!isHosted()) return HOME_APPS;
  return [...keptVantageApps(), ...realApps()];
}

/** The 4 dock apps, left to right. Host mode: Vantage, Phone, WhatsApp (or Messages), Camera. */
export function dockAppIds(): string[] {
  if (!isHosted()) return DOCK_APP_IDS;
  const has = (bundleId: string) => !!getNativeApp(bundleId);
  const messenger = has('net.whatsapp.WhatsApp') ? 'net.whatsapp.WhatsApp' : 'com.apple.MobileSMS';
  return ['vantage', ...['com.apple.mobilephone', messenger, 'com.apple.camera'].filter(has).map(nativeAppId)];
}
