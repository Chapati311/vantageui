import { useState } from 'react';
import { PlayIcon, SunIcon } from '../../components/glyphs';
import { Button, Dial, DotNumber, PixelNumber, ScrollWheel, Section, SegmentedControl, Slider } from '../../components/kit';
import styles from './Kit.module.css';

const HOURS = Array.from({ length: 24 }, (_, hour) => ({ value: hour, label: String(hour).padStart(2, '0') }));
const MINUTES = Array.from({ length: 60 }, (_, minute) => ({ value: minute, label: String(minute).padStart(2, '0') }));

/** Sliders, segmented controls, dials, the scroll wheel, buttons and numbers. */
export function KitControls() {
  const [size, setSize] = useState(15);
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [level, setLevel] = useState(0.6);
  const [minutes, setMinutes] = useState(25);
  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(30);

  return (
    <>
      <Section label="Slider" card={false}>
        <Slider label="Text size" value={size} min={11} max={22} step={1} onChange={setSize} format={(value) => `${value}`} />
        <Slider label="Disabled" value={40} min={0} max={100} step={1} onChange={() => undefined} disabled />
      </Section>

      <Section label="Segmented control" card={false}>
        <SegmentedControl
          label="View"
          value={view}
          onChange={setView}
          options={[
            { id: 'day', label: 'Day' },
            { id: 'week', label: 'Week' },
            { id: 'month', label: 'Month' },
          ]}
        />
        <SegmentedControl
          label="Disabled"
          value="a"
          onChange={() => undefined}
          disabled
          options={[
            { id: 'a', label: 'One' },
            { id: 'b', label: 'Two' },
          ]}
        />
      </Section>

      <Section label="Dials" note="Small: control center. Large with dots and steps: the timer." card={false}>
        <div className={styles.dials}>
          <Dial label="Light" icon={SunIcon} value={level} onChange={setLevel} />
          <Dial label="Disabled" icon={SunIcon} value={0.3} onChange={() => undefined} disabled />
        </div>
        <Dial label="Timer" size="large" dots={61} steps={60} value={minutes / 60} onChange={(value) => setMinutes(Math.round(value * 60))}>
          <DotNumber value={String(minutes).padStart(2, '0')} size={64} />
          <span className="label">Minutes</span>
        </Dial>
      </Section>

      <Section label="Scroll wheel" card={false}>
        <div className={styles.wheels}>
          <ScrollWheel label="Hours" options={HOURS} value={hour} onChange={setHour} />
          <span className={styles.wheelColon}>:</span>
          <ScrollWheel label="Minutes" options={MINUTES} value={minute} onChange={setMinute} />
        </div>
      </Section>

      <Section label="Buttons" card={false}>
        <div className={styles.buttons}>
          <Button kind="primary" icon={PlayIcon} onPress={() => undefined}>
            Primary
          </Button>
          <Button onPress={() => undefined}>Secondary</Button>
        </div>
        <div className={styles.buttons}>
          <Button kind="destructive" onPress={() => undefined}>
            Delete
          </Button>
          <Button onPress={() => undefined} disabled>
            Disabled
          </Button>
        </div>
      </Section>

      <Section label="Dot numbers" card={false}>
        <div className={styles.numbers}>
          <DotNumber value="07:30" size={40} clock />
          <DotNumber value="21" size={28} />
          <DotNumber value="--" size={28} muted />
        </div>
        <div className={styles.numbers}>
          <PixelNumber value="12:45" size={40} clock />
          <PixelNumber value="88" size={28} />
        </div>
      </Section>
    </>
  );
}
