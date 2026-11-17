import { useState } from 'react';
import { CopyIcon, EditIcon, PinIcon, ShareIcon, TrashIcon } from '../../components/glyphs';
import { Button, ContextMenu, Row, ScrollWheel, Section, Sheet, Toggle } from '../../components/kit';
import styles from './Kit.module.css';

const HOURS = Array.from({ length: 24 }, (_, hour) => ({ value: hour, label: String(hour).padStart(2, '0') }));
const MINUTES = Array.from({ length: 12 }, (_, i) => ({ value: i * 5, label: String(i * 5).padStart(2, '0') }));

/** Sheets and long-press context menus. */
export function KitOverlays() {
  const [sheet, setSheet] = useState<'none' | 'short' | 'alarm'>('none');
  const [hour, setHour] = useState(6);
  const [minute, setMinute] = useState(45);
  const [repeat, setRepeat] = useState(true);
  const [picked, setPicked] = useState<string | null>(null);

  const menu = (name: string) => [
    { label: 'Edit', icon: EditIcon, onSelect: () => setPicked(`Edit ${name}`) },
    { label: 'Copy', icon: CopyIcon, onSelect: () => setPicked(`Copy ${name}`) },
    { label: 'Share', icon: ShareIcon, onSelect: () => setPicked(`Share ${name}`), disabled: true },
    { label: 'Delete', icon: TrashIcon, destructive: true, onSelect: () => setPicked(`Delete ${name}`) },
  ];

  return (
    <>
      <Section label="Sheet" note="Drag a sheet down, flick it, or tap outside to close it." card={false}>
        <div className={styles.buttons}>
          <Button onPress={() => setSheet('short')}>Short sheet</Button>
          <Button onPress={() => setSheet('alarm')}>With a wheel</Button>
        </div>
      </Section>

      <Section label="Context menu" note={picked ? `You picked: ${picked}` : 'Hold a tile or a row for a moment.'} card={false}>
        <div className={styles.tiles}>
          {['Notes', 'Photos'].map((name) => (
            <ContextMenu key={name} items={menu(name)}>
              <div className={styles.tile}>
                <PinIcon />
                <span>{name}</span>
              </div>
            </ContextMenu>
          ))}
        </div>
        <ContextMenu items={menu('row')}>
          <div className={styles.card}>
            <Row title="Hold this row" detail="Long press opens the menu" />
          </div>
        </ContextMenu>
      </Section>

      <Sheet
        open={sheet === 'short'}
        onClose={() => setSheet('none')}
        title="Sheet"
        action={
          <Button kind="primary" onPress={() => setSheet('none')}>
            Done
          </Button>
        }
      >
        <p className={styles.sheetText}>A sheet slides up over the app. Drag it down to close it.</p>
        <div className={styles.card}>
          <Row title="Repeat" trailing={<Toggle label="Repeat" on={repeat} onChange={setRepeat} />} />
        </div>
      </Sheet>

      <Sheet open={sheet === 'alarm'} onClose={() => setSheet('none')} title="Edit alarm">
        <div className={styles.wheels}>
          <ScrollWheel label="Hours" options={HOURS} value={hour} onChange={setHour} />
          <span className={styles.wheelColon}>:</span>
          <ScrollWheel label="Minutes" options={MINUTES} value={minute} onChange={setMinute} />
        </div>
        <Button kind="primary" wide onPress={() => setSheet('none')}>
          Save
        </Button>
      </Sheet>
    </>
  );
}
