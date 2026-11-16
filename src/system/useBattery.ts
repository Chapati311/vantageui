import { useEffect, useState } from 'react';
import { watchBattery, type BatteryInfo } from './nativeBridge';

/** Current battery state, or `null` when the device can't report it. */
export function useBattery(): BatteryInfo | null {
  const [battery, setBattery] = useState<BatteryInfo | null>(null);
  useEffect(() => watchBattery(setBattery), []);
  return battery;
}
