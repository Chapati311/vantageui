import { openGame, type GameId } from '../../apps/arcade/arcadeStore';
import { isHosted } from '../../system/nativeBridge';
import { runAction } from '../../system/actions';
import { getSettings } from '../../system/settingsStore';
import { playSound } from '../../system/sounds';
import { AskWidget } from './AskWidget';
import { BatteryWidget } from './BatteryWidget';
import { CalendarWidget } from './CalendarWidget';
import { ClockWidget } from './ClockWidget';
import { DateWidget } from './DateWidget';
import { AirPodsWidget, ConnectedDevicesWidget, StorageWidget } from './devices/DeviceWidgets';
import { FlashlightWidget } from './FlashlightWidget';
import { CoinWidget, DiceWidget, TallyWidget } from './fun/FunWidgets';
import { makeGameWidget, PetWidget } from './games/GameWidgets';
import { AirWidget, CompassWidget, FavoritesWidget, QuoteWidget, RainDotsWidget } from './info/InfoWidgets';
import { AppleMusicWidget, SpotifyWidget, VinylWidget, VisualizerWidget } from './music/MusicWidgets';
import { MusicWidget } from './MusicWidget';
import { NotesWidget } from './NotesWidget';
import { PhotoWidget } from './PhotoWidget';
import { GradeAverageWidget, HomeworkWidget, LockInRingWidget, NextLessonWidget, PlantWidget, RemindersWidget } from './productivity/LockInWidgets';
import { CountdownWidget, DotCalendarWidget } from './productivity/ProductivityWidgets';
import { SolarSystemWidget } from './space/SolarSystemWidget';
import { VoiceNoteWidget } from './VoiceNoteWidget';
import { WeatherWidget } from './WeatherWidget';
import { summon } from '../../vantage/summon';
import { HumidityWidget, SerifDateWidget, TickDialWidget, WindConeWidget } from './PackWidgets';
import { SmartStackWidget, smartStackApp } from './productivity/SmartStack';
import {
  AuroraWidget,
  BreathingWidget,
  LavaLampWidget,
  OrbitWidget,
  RainOnGlassWidget,
  StarfieldWidget,
  WavesWidget,
} from './space/SpaceWidgets';
import { MoonWidget } from './time/MoonWidget';
import { SunArcWidget } from './time/SunArcWidget';
import {
  AnalogClockWidget,
  BinaryClockWidget,
  FlipClockWidget,
  VerticalClockWidget,
  WordClockWidget,
} from './time/TimeWidgets';
import { WorldClocksWidget } from './time/WorldClocksWidget';
import { getLabWidget, getLabWidgets, useLabWidgets } from './lab/labStore';
import { LabWidgetView } from './lab/LabWidget';
import type { WidgetDefinition, WidgetProps, WidgetTapContext } from './types';
import { DevicesWidget, NetStatusWidget, PortsWidget, RadarWidget, SystemWidget, TrafficWidget } from './hacker/HackerWidgets';
import { setNetrunnerTool } from '../../apps/netrunner/netrunnerNav';

const openArcade = (game: GameId) => ({ openApp }: WidgetTapContext) => {
  openGame(game);
  openApp('arcade');
};

const game = (id: GameId, name: string, description: string): WidgetDefinition => ({
  id: `game-${id}`,
  appId: 'arcade',
  name,
  category: 'games',
  description,
  component: makeGameWidget(id),
  sizes: ['1x1', '2x2'],
  onTap: openArcade(id),
});

/**
 * Every widget is listed here. To add one: create its component in this
 * folder, add an entry below (category, sizes, a one-line description).
 * It then shows up in the widget gallery (edit mode > Add widget).
 */
/** Opens Netrunner on one tool. */
const netrunner = (tool: string) => ({ openApp }: WidgetTapContext) => {
  setNetrunnerTool(tool);
  openApp('netrunner');
};

export const WIDGETS: WidgetDefinition[] = [
  // ---- Hacker (live numbers from the phone, through Netrunner's root helper)
  { id: 'hk-net', appId: 'netrunner', name: 'Network status', category: 'hacker', description: 'Wi-Fi, local and public IP, ping.', component: NetStatusWidget, sizes: ['2x2', '2x1'], onTap: netrunner('connection') },
  { id: 'hk-traffic', appId: 'netrunner', name: 'Live traffic', category: 'hacker', description: 'Down and up speed, last two minutes.', component: TrafficWidget, sizes: ['2x2', '2x1'], onTap: netrunner('connection') },
  { id: 'hk-system', appId: 'netrunner', name: 'System', category: 'hacker', description: 'CPU, RAM, battery bars and uptime.', component: SystemWidget, sizes: ['2x2'], onTap: netrunner('terminal') },
  { id: 'hk-ports', appId: 'netrunner', name: 'Open ports', category: 'hacker', description: 'What this phone listens on.', component: PortsWidget, sizes: ['2x2'], onTap: netrunner('security') },
  { id: 'hk-devices', appId: 'netrunner', name: 'Devices on my Wi-Fi', category: 'hacker', description: 'From the last network map scan.', component: DevicesWidget, sizes: ['2x2', '2x1'], onTap: netrunner('map') },
  { id: 'hk-radar', appId: 'netrunner', name: 'Bluetooth radar', category: 'hacker', description: 'Nearby Bluetooth devices as blips.', component: RadarWidget, sizes: ['2x2', '1x1'], onTap: netrunner('ble') },

  // ---- Time
  { id: 'clock', appId: 'clock', name: 'Dot clock', category: 'time', description: 'Big dot-matrix hours and minutes.', component: ClockWidget, sizes: ['2x2', '2x1'] },
  { id: 'serif-date', appId: 'calendar', name: 'Serif date', category: 'time', description: 'A big serif day number.', component: SerifDateWidget, sizes: ['2x2', '1x1'] },
  { id: 'tick-dial', appId: 'clock', name: 'Tick dial', category: 'time', description: '60 ticks, three slim hands, a red second dot.', component: TickDialWidget, sizes: ['2x2', '1x1'] },
  { id: 'vertical-clock', appId: 'clock', name: 'Vertical clock', category: 'time', description: 'Hours above minutes.', component: VerticalClockWidget, sizes: ['2x2'] },
  { id: 'analog', appId: 'clock', name: 'Thin analog', category: 'time', description: 'Hairline hands on a quiet face.', component: AnalogClockWidget, sizes: ['1x1', '2x2'] },
  { id: 'flip', appId: 'clock', name: 'Flip clock', category: 'time', description: 'Cards that flip every minute.', component: FlipClockWidget, sizes: ['2x1', '2x2'] },
  { id: 'binary', appId: 'clock', name: 'Binary clock', category: 'time', description: 'Count the dots: 1, 2, 4, 8.', component: BinaryClockWidget, sizes: ['2x2', '2x1'] },
  { id: 'word-clock', appId: 'clock', name: 'Word clock', category: 'time', description: '"It\'s twenty past seven."', component: WordClockWidget, sizes: ['2x2', '4x1'] },
  { id: 'world', appId: 'clock', name: 'World clocks', category: 'time', description: 'London, New York, Tokyo, Sydney.', component: WorldClocksWidget, sizes: ['2x2', '4x1'] },
  { id: 'sun', appId: 'weather', name: 'Sunrise and sunset', category: 'time', description: "Today's sun path in Zurich.", component: SunArcWidget, sizes: ['2x1', '2x2'] },
  { id: 'moon', appId: 'weather', name: 'Moon phase', category: 'time', description: "Tonight's moon, drawn.", component: MoonWidget, sizes: ['1x1', '2x1'] },
  { id: 'date', appId: 'calendar', name: 'Date', category: 'time', description: 'Weekday and day.', component: DateWidget, sizes: ['1x1', '2x2'] },

  // ---- Space and beauty
  { id: 'solar', appId: 'customise', name: 'Solar system', category: 'space', description: 'The planets where they really are today.', component: SolarSystemWidget, sizes: ['2x2', '4x2'] },
  { id: 'orbit', appId: 'customise', name: 'Orbit', category: 'space', description: 'Slow rings around a glowing core.', component: OrbitWidget, sizes: ['1x1', '2x2'] },
  { id: 'starfield', appId: 'customise', name: 'Starfield', category: 'space', description: 'Twinkling stars.', component: StarfieldWidget, sizes: ['2x2', '2x1', '4x2'] },
  { id: 'aurora', appId: 'customise', name: 'Aurora drift', category: 'space', description: 'Soft northern-light glows.', component: AuroraWidget, sizes: ['2x2', '4x2'] },
  { id: 'lava', appId: 'customise', name: 'Lava lamp', category: 'space', description: 'Blobs rising and sinking.', component: LavaLampWidget, sizes: ['1x1', '2x2'] },
  { id: 'rain-glass', appId: 'weather', name: 'Rain on glass', category: 'space', description: 'Drops sliding down a window.', component: RainOnGlassWidget, sizes: ['2x2', '2x1'] },
  { id: 'waves', appId: 'customise', name: 'Ocean waves', category: 'space', description: 'A calm wave line.', component: WavesWidget, sizes: ['2x1', '4x1', '2x2'] },
  { id: 'breathe', appId: 'lockin', name: 'Breathing circle', category: 'space', description: 'Breathe in for 4, out for 4.', component: BreathingWidget, sizes: ['2x2', '1x1'] },

  // ---- Music
  { id: 'spotify', appId: 'music', name: 'Spotify', category: 'music', description: 'Now playing, with cover and controls.', component: SpotifyWidget, sizes: ['2x2', '4x2'] },
  { id: 'apple-music', appId: 'music', name: 'Apple Music', category: 'music', description: 'MusicKit player inside Vantage.', component: AppleMusicWidget, sizes: ['2x2'] },
  { id: 'visualizer', appId: 'music', name: 'Dot visualizer', category: 'music', description: 'Dots that jump with your music.', component: VisualizerWidget, sizes: ['2x1', '4x1'] },
  { id: 'vinyl', appId: 'music', name: 'Spinning vinyl', category: 'music', description: 'Spins while your music plays.', component: VinylWidget, sizes: ['2x2'] },
  { id: 'music', appId: 'music', name: 'Now playing', category: 'music', description: 'Spotify or your own music, with a dot visualizer.', component: MusicWidget, sizes: ['2x2'] },

  // ---- Retro games
  game('snake', 'Snake', 'Eat the dots, avoid your tail.'),
  game('pong', 'Pong', 'Beat the phone to 7.'),
  game('blocks', 'Blocks', 'Fill whole lines.'),
  game('breakout', 'Breakout', 'Clear every brick.'),
  game('flappy', 'Flap', 'Tap through the gaps.'),
  game('2048', '2048', 'Slide and merge tiles.'),
  game('mines', 'Mines', 'Find the safe squares.'),
  { id: 'pet', appId: 'arcade', name: 'Vanta Pet', category: 'games', description: 'A pixel pet. It loves when you focus.', component: PetWidget, sizes: ['1x1', '2x2'], onTap: openArcade('pet') },

  // ---- Productivity
  { id: 'lockin', appId: 'lockin', name: 'Focus ring', category: 'productivity', description: "Today's focus ring and streak. One tap to start.", component: LockInRingWidget, sizes: ['1x1', '2x2'], onTap: ({ openApp }) => openApp('lockin') },
  { id: 'plant', appId: 'lockin', name: 'Focus plant', category: 'productivity', description: 'Grows with your focus streak.', component: PlantWidget, sizes: ['1x1', '2x2'], onTap: ({ openApp }) => openApp('lockin') },
  { id: 'smart-stack', name: 'Smart stack', category: 'productivity', description: 'Changes with the time of day: weather and lessons, homework and focus, Wind Down and alarm.', component: SmartStackWidget, sizes: ['2x2'], onTap: ({ openApp }) => openApp(smartStackApp()) },
  { id: 'next-lesson', appId: 'lockin', name: 'Next lesson', category: 'productivity', description: 'From your timetable.', component: NextLessonWidget, sizes: ['2x1', '2x2'], onTap: ({ openApp }) => openApp('lockin') },
  { id: 'homework', appId: 'lockin', name: 'Homework due', category: 'productivity', description: 'What is due soonest.', component: HomeworkWidget, sizes: ['2x1', '2x2'], onTap: ({ openApp }) => openApp('lockin') },
  { id: 'grades', appId: 'lockin', name: 'Grade average', category: 'productivity', description: 'Your average, green to red.', component: GradeAverageWidget, sizes: ['1x1', '2x2'], onTap: ({ openApp }) => openApp('lockin') },
  { id: 'reminders', appId: 'reminders', name: 'Reminders', category: 'productivity', description: "Today's reminders.", component: RemindersWidget, sizes: ['2x1', '2x2'], onTap: ({ openApp }) => openApp('reminders') },
  { id: 'dot-calendar', appId: 'calendar', name: 'Dot calendar', category: 'productivity', description: 'This month as dots.', component: DotCalendarWidget, sizes: ['2x2'] },
  { id: 'calendar', appId: 'calendar', name: 'Up next', category: 'productivity', description: 'Date and your next event.', component: CalendarWidget, sizes: ['2x2'] },
  { id: 'countdown', appId: 'calendar', editable: true, name: 'Countdown', category: 'productivity', description: 'Days until something good.', component: CountdownWidget, sizes: ['2x2', '2x1', '1x1'] },
  {
    id: 'notes',
    appId: 'notes',
    name: 'Notes',
    category: 'productivity',
    description: 'Your latest note.',
    component: NotesWidget,
    sizes: ['2x1', '2x2'],
    onTap: ({ openApp }) => openApp('notes'),
  },

  // ---- Info and tools
  { id: 'humidity', appId: 'weather', name: 'Humidity', category: 'info', description: 'A wireframe cylinder that fills up.', component: HumidityWidget, sizes: ['1x1', '2x2'] },
  { id: 'wind-cone', appId: 'weather', name: 'Wind cone', category: 'info', description: 'A wireframe cone pointing where the wind blows.', component: WindConeWidget, sizes: ['2x2', '1x1'] },
  { id: 'weather', appId: 'weather', name: 'Weather', category: 'info', description: 'Line-art weather for Zurich.', component: WeatherWidget, sizes: ['2x1', '2x2', '1x1'] },
  { id: 'rain', appId: 'weather', name: 'Rain chance', category: 'info', description: 'Dots for rain in the next hours.', component: RainDotsWidget, sizes: ['2x1', '4x1'] },
  { id: 'air', appId: 'weather', name: 'UV and air', category: 'info', description: 'UV index and air quality.', component: AirWidget, sizes: ['2x1'] },
  { id: 'compass', appId: 'compass', name: 'Compass', category: 'info', description: 'Thin dial rings that find north.', component: CompassWidget, sizes: ['2x2', '1x1'] },
  { id: 'quote', appId: 'notes', name: 'Quote of the day', category: 'info', description: 'A new line every day.', component: QuoteWidget, sizes: ['2x2', '4x2', '4x1'] },
  { id: 'photo', appId: 'photos', editable: true, name: 'Photo frame', category: 'info', description: 'A photo you choose.', component: PhotoWidget, sizes: ['2x2', '2x1', '4x2'] },
  { id: 'favorites', appId: 'phone', name: 'Favorites', category: 'info', description: 'Call your people in one tap.', component: FavoritesWidget, sizes: ['2x2', '4x1'] },
  {
    id: 'flashlight',
    name: 'Flashlight',
    category: 'info',
    description: 'One tap on, one tap off.',
    component: FlashlightWidget,
    sizes: ['1x1'],
    // Same switch as in quick settings. For now it only changes its look.
    onTap: () => {
      const on = !getSettings().flashlight;
      void runAction('controls.toggle', { control: 'flashlight', on });
      playSound(on ? 'toggleOn' : 'toggleOff');
    },
  },
  { id: 'voice', appId: 'recorder', name: 'Voice note', category: 'info', description: 'Tap to record, tap to save.', component: VoiceNoteWidget, sizes: ['1x1'] },
  {
    id: 'ask',
    name: 'Ask Vantage',
    category: 'info',
    description: 'Summon Vantage.',
    component: AskWidget,
    sizes: ['4x1'],
    onTap: () => summon('ask-bar'),
  },

  // ---- Fun
  { id: 'dice', appId: 'arcade', name: 'Dice', category: 'fun', description: 'Tap to roll.', component: DiceWidget, sizes: ['1x1', '2x2'] },
  { id: 'coin', appId: 'arcade', name: 'Coin flip', category: 'fun', description: 'Heads or tails.', component: CoinWidget, sizes: ['1x1', '2x2'] },
  { id: 'tally', appId: 'arcade', name: 'Tally counter', category: 'fun', description: 'Tap to count, minus to undo.', component: TallyWidget, sizes: ['2x1', '2x2'] },

  // ---- Devices
  { id: 'battery', appId: 'settings', name: 'Battery ring', category: 'devices', description: "This phone's battery.", component: BatteryWidget, sizes: ['1x1', '2x2'] },
  { id: 'airpods', appId: 'earbuds', name: 'AirPods', category: 'devices', description: 'Left, right and case battery.', component: AirPodsWidget, sizes: ['2x2', '2x1'] },
  { id: 'devices', appId: 'settings', name: 'Connected devices', category: 'devices', description: 'Connected Bluetooth devices.', component: ConnectedDevicesWidget, sizes: ['2x1', '2x2'] },
  { id: 'storage', appId: 'files', name: 'Storage', category: 'devices', description: 'What Vantage stores on the phone.', component: StorageWidget, sizes: ['2x1', '2x2'] },
];

// ---- Widgets made in the Widget Lab. Their definitions are made on demand
// (and kept, so the same widget always has the same component).
const labDefinitions = new Map<string, WidgetDefinition>();

function labDefinition(id: string): WidgetDefinition | undefined {
  const data = getLabWidget(id);
  if (!data) return undefined;
  let definition = labDefinitions.get(id);
  if (!definition) {
    const Component = ({ size }: WidgetProps) => {
      const widget = useLabWidgets().find((item) => item.id === id);
      return widget ? <LabWidgetView widget={widget} size={size} /> : null;
    };
    definition = { id, name: data.name, category: 'lab', description: 'Made in Widget Lab', component: Component, sizes: [data.size] };
    labDefinitions.set(id, definition);
  }
  // Name and size can change in the Lab
  definition.name = data.name;
  definition.sizes = [data.size];
  return definition;
}

/** Widgets that would show made-up data on the real phone (none left: Part 2 made AirPods and devices real). */
const NOT_REAL_YET_ON_PHONE: string[] = [];

/** Every widget, including the ones you made in the Widget Lab. */
export function allWidgets(): WidgetDefinition[] {
  const widgets = isHosted() ? WIDGETS.filter((widget) => !NOT_REAL_YET_ON_PHONE.includes(widget.id)) : WIDGETS;
  return [...widgets, ...getLabWidgets().map((widget) => labDefinition(widget.id)!).filter(Boolean)];
}

export function getWidget(id: string): WidgetDefinition | undefined {
  return id.startsWith('lab-') ? labDefinition(id) : WIDGETS.find((widget) => widget.id === id);
}
