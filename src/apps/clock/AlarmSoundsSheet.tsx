import { useEffect, useRef, useState } from 'react';
import { CheckIcon } from '../../components/glyphs';
import { Button, Row, Section, SegmentedControl, Sheet, Slider, Toggle } from '../../components/kit';
import { runAction } from '../../system/actions';
import { ALARM_SOUNDS, hasCustomSound, previewAlarmSound, saveCustomSound, stopAlarmSound } from './alarmSounds';
import { useAlarms, type AlarmSettings } from './alarmStore';
import styles from './Clock.module.css';

/** Default sound, volume, gentle wake, vibration, snooze length, and your own sound file. */
export function AlarmSoundsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings } = useAlarms();
  const [custom, setCustom] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) void hasCustomSound().then(setCustom);
    else stopAlarmSound();
  }, [open]);

  const set = (patch: Partial<AlarmSettings>) => void runAction('alarm.settings', patch);

  return (
    <Sheet open={open} onClose={onClose} title="Alarm sounds">
      <Section label="Default sound" note="Tap to hear it.">
        {ALARM_SOUNDS.filter((sound) => sound.id !== 'custom' || custom).map((sound) => (
          <Row
            key={sound.id}
            title={sound.name}
            detail={sound.pack}
            trailing={settings.defaultSound === sound.id ? <span className={styles.check}><CheckIcon /></span> : undefined}
            onPress={() => {
              set({ defaultSound: sound.id });
              previewAlarmSound(sound.id, settings.volume);
            }}
          />
        ))}
      </Section>
      <Button onPress={() => file.current?.click()}>{custom ? 'Change your sound' : 'Use a sound file'}</Button>
      <input
        ref={file}
        type="file"
        accept="audio/*"
        hidden
        onChange={(event) => {
          const chosen = event.target.files?.[0];
          event.target.value = '';
          if (chosen) void saveCustomSound(chosen).then(() => {
            setCustom(true);
            set({ defaultSound: 'custom' });
          });
        }}
      />
      <Slider label="Volume" value={Math.round(settings.volume * 100)} min={10} max={100} step={5} format={(value) => `${value}%`} onChange={(value) => set({ volume: value / 100 })} />
      <Section label="Waking up">
        <Row title="Gentle wake" detail="Fades in over 30 seconds" trailing={<Toggle label="Gentle wake" on={settings.gentleWake} onChange={(on) => set({ gentleWake: on })} />} />
        <Row title="Vibrate" detail="Where the phone allows it" trailing={<Toggle label="Vibrate" on={settings.vibrate} onChange={(on) => set({ vibrate: on })} />} />
      </Section>
      <Section label="Snooze length" card={false}>
        <SegmentedControl
        label="Snooze length"
        value={String(settings.snoozeMinutes) as '5' | '9' | '10' | '15'}
        options={[
          { id: '5', label: '5 min' },
          { id: '9', label: '9 min' },
          { id: '10', label: '10 min' },
          { id: '15', label: '15 min' },
        ]}
          onChange={(value) => set({ snoozeMinutes: Number(value) })}
        />
      </Section>
    </Sheet>
  );
}
