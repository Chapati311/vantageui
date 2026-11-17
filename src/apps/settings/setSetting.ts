import { runAction } from '../../system/actions';
import type { Settings } from '../../system/settingsStore';

type SimpleKey = Exclude<keyof Settings, 'customPresets' | 'windDownSince' | 'mode'>;

/** Changes one setting through the actions system (so the AI can do the same later). */
export function changeSetting<K extends SimpleKey>(key: K, value: Settings[K]): void {
  void runAction('settings.set', { key, value });
}
