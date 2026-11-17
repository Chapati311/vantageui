import { openGame, type GameId } from '../../apps/arcade/arcadeStore';
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
import { CountdownWidget, DotCalendarWidget } from './productivity/ProductivityWidgets';
import { SolarSystemWidget } from './space/SolarSystemWidget';
import { VoiceNoteWidget } from './VoiceNoteWidget';
import { WeatherWidget } from './WeatherWidget';
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
import type { WidgetDefinition, WidgetTapContext } from './types';

const openArcade = (game: GameId) => ({ openApp }: WidgetTapContext) => {
  openGame(game);
  openApp('arcade');
};

const game = (id: GameId, name: string, description: string): WidgetDefinition => ({
  id: `game-${id}`,
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
export const WIDGETS: WidgetDefinition[] = [
  // ---- Time
  { id: 'clock', name: 'Dot clock', category: 'time', description: 'Big dot-matrix hours and minutes.', component: ClockWidget, sizes: ['2x2', '2x1'] },
  { id: 'vertical-clock', name: 'Vertical clock', category: 'time', description: 'Hours above minutes.', component: VerticalClockWidget, sizes: ['2x2'] },
  { id: 'analog', name: 'Thin analog', category: 'time', description: 'Hairline hands on a quiet face.', component: AnalogClockWidget, sizes: ['1x1', '2x2'] },
  { id: 'flip', name: 'Flip clock', category: 'time', description: 'Cards that flip every minute.', component: FlipClockWidget, sizes: ['2x1', '2x2'] },
  { id: 'binary', name: 'Binary clock', category: 'time', description: 'Count the dots: 1, 2, 4, 8.', component: BinaryClockWidget, sizes: ['2x2', '2x1'] },
  { id: 'word-clock', name: 'Word clock', category: 'time', description: '"It\'s twenty past seven."', component: WordClockWidget, sizes: ['2x2', '4x1'] },
  { id: 'world', name: 'World clocks', category: 'time', description: 'London, New York, Tokyo, Sydney.', component: WorldClocksWidget, sizes: ['2x2', '4x1'] },
  { id: 'sun', name: 'Sunrise and sunset', category: 'time', description: "Today's sun path in Zurich.", component: SunArcWidget, sizes: ['2x1', '2x2'] },
  { id: 'moon', name: 'Moon phase', category: 'time', description: "Tonight's moon, drawn.", component: MoonWidget, sizes: ['1x1', '2x1'] },
  { id: 'date', name: 'Date', category: 'time', description: 'Weekday and day.', component: DateWidget, sizes: ['1x1', '2x2'] },

  // ---- Space and beauty
  { id: 'solar', name: 'Solar system', category: 'space', description: 'The planets where they really are today.', component: SolarSystemWidget, sizes: ['2x2', '4x2'] },
  { id: 'orbit', name: 'Orbit', category: 'space', description: 'Slow rings around a glowing core.', component: OrbitWidget, sizes: ['1x1', '2x2'] },
  { id: 'starfield', name: 'Starfield', category: 'space', description: 'Twinkling stars.', component: StarfieldWidget, sizes: ['2x2', '2x1', '4x2'] },
  { id: 'aurora', name: 'Aurora drift', category: 'space', description: 'Soft northern-light glows.', component: AuroraWidget, sizes: ['2x2', '4x2'] },
  { id: 'lava', name: 'Lava lamp', category: 'space', description: 'Blobs rising and sinking.', component: LavaLampWidget, sizes: ['1x1', '2x2'] },
  { id: 'rain-glass', name: 'Rain on glass', category: 'space', description: 'Drops sliding down a window.', component: RainOnGlassWidget, sizes: ['2x2', '2x1'] },
  { id: 'waves', name: 'Ocean waves', category: 'space', description: 'A calm wave line.', component: WavesWidget, sizes: ['2x1', '4x1', '2x2'] },
  { id: 'breathe', name: 'Breathing circle', category: 'space', description: 'Breathe in for 4, out for 4.', component: BreathingWidget, sizes: ['2x2', '1x1'] },

  // ---- Music
  { id: 'spotify', name: 'Spotify', category: 'music', description: 'Now playing, with cover and controls.', component: SpotifyWidget, sizes: ['2x2', '4x2'] },
  { id: 'apple-music', name: 'Apple Music', category: 'music', description: 'MusicKit player inside Vantage.', component: AppleMusicWidget, sizes: ['2x2'] },
  { id: 'visualizer', name: 'Dot visualizer', category: 'music', description: 'Dots that jump with your music.', component: VisualizerWidget, sizes: ['2x1', '4x1'] },
  { id: 'vinyl', name: 'Spinning vinyl', category: 'music', description: 'Spins while your music plays.', component: VinylWidget, sizes: ['2x2'] },
  { id: 'music', name: 'System now playing', category: 'music', description: 'Any app (after unlock).', component: MusicWidget, sizes: ['2x2'] },

  // ---- Retro games
  game('snake', 'Snake', 'Eat the dots, avoid your tail.'),
  game('pong', 'Pong', 'Beat the phone to 7.'),
  game('blocks', 'Blocks', 'Fill whole lines.'),
  game('breakout', 'Breakout', 'Clear every brick.'),
  game('flappy', 'Flap', 'Tap through the gaps.'),
  game('2048', '2048', 'Slide and merge tiles.'),
  game('mines', 'Mines', 'Find the safe squares.'),
  { id: 'pet', name: 'Vanta Pet', category: 'games', description: 'A pixel pet. It loves when you focus.', component: PetWidget, sizes: ['1x1', '2x2'], onTap: openArcade('pet') },

  // ---- Productivity
  { id: 'dot-calendar', name: 'Dot calendar', category: 'productivity', description: 'This month as dots.', component: DotCalendarWidget, sizes: ['2x2'] },
  { id: 'calendar', name: 'Up next', category: 'productivity', description: 'Date and your next event.', component: CalendarWidget, sizes: ['2x2'] },
  { id: 'countdown', name: 'Countdown', category: 'productivity', description: 'Days until something good.', component: CountdownWidget, sizes: ['2x2', '2x1', '1x1'] },
  {
    id: 'notes',
    name: 'Notes',
    category: 'productivity',
    description: 'Your latest note.',
    component: NotesWidget,
    sizes: ['2x1', '2x2'],
    onTap: ({ openApp }) => openApp('notes'),
  },

  // ---- Info and tools
  { id: 'weather', name: 'Weather', category: 'info', description: 'Line-art weather for Zurich.', component: WeatherWidget, sizes: ['2x1', '2x2', '1x1'] },
  { id: 'rain', name: 'Rain chance', category: 'info', description: 'Dots for rain in the next hours.', component: RainDotsWidget, sizes: ['2x1', '4x1'] },
  { id: 'air', name: 'UV and air', category: 'info', description: 'UV index and air quality.', component: AirWidget, sizes: ['2x1'] },
  { id: 'compass', name: 'Compass', category: 'info', description: 'Thin dial rings that find north.', component: CompassWidget, sizes: ['2x2', '1x1'] },
  { id: 'quote', name: 'Quote of the day', category: 'info', description: 'A new line every day.', component: QuoteWidget, sizes: ['2x2', '4x2', '4x1'] },
  { id: 'photo', name: 'Photo frame', category: 'info', description: 'A photo you choose.', component: PhotoWidget, sizes: ['2x2', '2x1', '4x2'] },
  { id: 'favorites', name: 'Favorites', category: 'info', description: 'Call your people in one tap.', component: FavoritesWidget, sizes: ['2x2', '4x1'] },
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
  { id: 'voice', name: 'Voice note', category: 'info', description: 'Tap to record, tap to save.', component: VoiceNoteWidget, sizes: ['1x1'] },
  {
    id: 'ask',
    name: 'Ask Vantage',
    category: 'info',
    description: 'Search apps and actions.',
    component: AskWidget,
    sizes: ['4x1'],
    // Until the Vantage AI exists, the bar opens search.
    onTap: ({ openSearch }) => openSearch(),
  },

  // ---- Fun
  { id: 'dice', name: 'Dice', category: 'fun', description: 'Tap to roll.', component: DiceWidget, sizes: ['1x1', '2x2'] },
  { id: 'coin', name: 'Coin flip', category: 'fun', description: 'Heads or tails.', component: CoinWidget, sizes: ['1x1', '2x2'] },
  { id: 'tally', name: 'Tally counter', category: 'fun', description: 'Tap to count, minus to undo.', component: TallyWidget, sizes: ['2x1', '2x2'] },

  // ---- Devices
  { id: 'battery', name: 'Battery ring', category: 'devices', description: "This phone's battery.", component: BatteryWidget, sizes: ['1x1', '2x2'] },
  { id: 'airpods', name: 'AirPods', category: 'devices', description: 'Left, right and case (after unlock).', component: AirPodsWidget, sizes: ['2x2', '2x1'] },
  { id: 'devices', name: 'Connected devices', category: 'devices', description: 'Bluetooth devices (after unlock).', component: ConnectedDevicesWidget, sizes: ['2x1', '2x2'] },
  { id: 'storage', name: 'Storage', category: 'devices', description: 'What Vantage stores on the phone.', component: StorageWidget, sizes: ['2x1', '2x2'] },
];

export function getWidget(id: string): WidgetDefinition | undefined {
  return WIDGETS.find((widget) => widget.id === id);
}
