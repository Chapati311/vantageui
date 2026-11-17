import { useRef, useState, type CSSProperties } from 'react';
import { BackIcon, PlusIcon, TrashIcon } from '../../components/glyphs';
import { Button, EmptyState, Row, Section as KitSection, SegmentedControl } from '../../components/kit';
import { Pressable } from '../../components/Pressable';
import { runAction } from '../../system/actions';
import {
  deleteLabWidget,
  exportLabWidget,
  importLabWidget,
  newLabWidget,
  saveLabWidget,
  useLabWidgets,
  type BlockKind,
  type LabBlock,
  type LabWidget,
} from '../../shell/widgets/lab/labStore';
import { LabWidgetView } from '../../shell/widgets/lab/LabWidget';
import { BINDINGS } from '../../shell/widgets/lab/useBinding';
import type { WidgetSize } from '../../shell/widgets/types';
import { Section, SettingsPage } from '../settings/SettingsPage';
import settingsStyles from '../settings/SettingsApp.module.css';
import styles from './WidgetLabPage.module.css';

const KINDS: { id: BlockKind; name: string }[] = [
  { id: 'text', name: 'Text' },
  { id: 'number', name: 'Big number' },
  { id: 'ring', name: 'Ring' },
  { id: 'bar', name: 'Bar' },
  { id: 'dots', name: 'Dot grid' },
  { id: 'image', name: 'Image' },
];

const SIZES: { id: WidgetSize; label: string }[] = [
  { id: '1x1', label: '1x1' },
  { id: '2x1', label: '2x1' },
  { id: '2x2', label: '2x2' },
  { id: '4x1', label: '4x1' },
  { id: '4x2', label: '4x2' },
];

/** Reads a picture and shrinks it to a small data URL (so it fits in storage). */
async function smallPicture(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 240 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.8);
}

/** Widget Lab: your own widgets, built from blocks bound to live data. */
export function WidgetLabPage({ onBack }: { onBack: () => void }) {
  const widgets = useLabWidgets();
  const [editing, setEditing] = useState<LabWidget | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  if (editing) return <Editor initial={editing} onDone={() => setEditing(null)} />;

  return (
    <SettingsPage title="Widget Lab" onBack={onBack}>
      <Section label="My widgets" note={widgets.length ? 'Tap to edit. Swipe left to delete. Add them from the home screen: hold, then Add widget > My widgets.' : undefined}>
        {widgets.length === 0 ? (
          <EmptyState title="Build one" message="Stack text, big numbers, rings, bars, dot grids and pictures, and bind them to live data." />
        ) : (
          <KitSection>
            {widgets.map((widget) => (
              <Row key={widget.id} title={widget.name} value={widget.size} onPress={() => setEditing(widget)} onDelete={() => deleteLabWidget(widget.id)} />
            ))}
          </KitSection>
        )}
      </Section>
      <Section label="Make" note={message ?? 'Export a widget to share it as a file; import one someone made.'}>
        <Button kind="primary" icon={PlusIcon} wide onPress={() => setEditing(newLabWidget())}>
          New widget
        </Button>
        <div className={settingsStyles.buttons}>
          <Button onPress={() => fileInput.current?.click()}>Import</Button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file)
              importLabWidget(file)
                .then((widget) => setMessage(`Imported "${widget.name}".`))
                .catch((error: Error) => setMessage(error.message));
          }}
        />
      </Section>
    </SettingsPage>
  );
}

function Editor({ initial, onDone }: { initial: LabWidget; onDone: () => void }) {
  const [widget, setWidget] = useState(initial);
  const [w, h] = widget.size.split('x').map(Number);

  const updateBlock = (id: string, patch: Partial<LabBlock>) =>
    setWidget({ ...widget, blocks: widget.blocks.map((block) => (block.id === id ? { ...block, ...patch } : block)) });
  const moveBlock = (index: number, by: number) => {
    const blocks = [...widget.blocks];
    const [block] = blocks.splice(index, 1);
    blocks.splice(Math.max(0, Math.min(blocks.length, index + by)), 0, block);
    setWidget({ ...widget, blocks });
  };

  return (
    <SettingsPage title={widget.name || 'Widget'} onBack={onDone}>
      <div className={styles.previewArea}>
        <div className={styles.preview} style={{ '--w': w, '--h': h } as CSSProperties}>
          <LabWidgetView widget={widget} size={widget.size} />
        </div>
      </div>

      <Section label="Name and size">
        <input className={settingsStyles.input} value={widget.name} maxLength={24} aria-label="Widget name" onChange={(event) => setWidget({ ...widget, name: event.target.value })} />
        <SegmentedControl label="Size" value={widget.size} options={SIZES} onChange={(size) => setWidget({ ...widget, size })} />
      </Section>

      <Section label="Blocks" note="Blocks stack from top to bottom (side by side on wide widgets).">
        {widget.blocks.map((block, index) => (
          <div key={block.id} className={styles.block}>
            <div className={styles.blockHead}>
              <select className={styles.select} value={block.kind} aria-label="Block type" onChange={(event) => updateBlock(block.id, { kind: event.target.value as BlockKind })}>
                {KINDS.map((kind) => (
                  <option key={kind.id} value={kind.id}>
                    {kind.name}
                  </option>
                ))}
              </select>
              <Pressable className={styles.iconButton} aria-label="Move up" onClick={() => moveBlock(index, -1)} disabled={index === 0}>
                <span className={styles.up}>
                  <BackIcon />
                </span>
              </Pressable>
              <Pressable className={styles.iconButton} aria-label="Move down" onClick={() => moveBlock(index, 1)} disabled={index === widget.blocks.length - 1}>
                <span className={styles.down}>
                  <BackIcon />
                </span>
              </Pressable>
              <Pressable className={styles.iconButton} aria-label="Delete block" onClick={() => setWidget({ ...widget, blocks: widget.blocks.filter((item) => item.id !== block.id) })}>
                <TrashIcon />
              </Pressable>
            </div>
            {block.kind === 'image' ? (
              <label className={styles.pick}>
                {block.image ? 'Change picture' : 'Choose a picture'}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void smallPicture(file).then((image) => updateBlock(block.id, { image }));
                  }}
                />
              </label>
            ) : (
              <>
                <select className={styles.select} value={block.binding} aria-label="Shows" onChange={(event) => updateBlock(block.id, { binding: event.target.value as LabBlock['binding'] })}>
                  {BINDINGS.map((binding) => (
                    <option key={binding.id} value={binding.id}>
                      Shows: {binding.name}
                    </option>
                  ))}
                </select>
                <input
                  className={settingsStyles.input}
                  placeholder={block.binding === 'custom' ? 'Your text' : 'Label above (optional)'}
                  value={block.text}
                  maxLength={32}
                  aria-label="Text"
                  onChange={(event) => updateBlock(block.id, { text: event.target.value })}
                />
              </>
            )}
          </div>
        ))}
        <Button
          icon={PlusIcon}
          disabled={widget.blocks.length >= 4}
          onPress={() => setWidget({ ...widget, blocks: [...widget.blocks, { id: `b${Date.now().toString(36)}`, kind: 'text', binding: 'custom', text: '' }] })}
        >
          Add block
        </Button>
      </Section>

      <Section label="Save">
        <div className={settingsStyles.buttons}>
          <Button onPress={() => exportLabWidget(widget)}>Export</Button>
          <Button
            kind="primary"
            onPress={() => {
              saveLabWidget(widget);
              onDone();
            }}
          >
            Save
          </Button>
        </div>
        <Button
          onPress={() => {
            saveLabWidget(widget);
            void runAction('home.addWidget', { widgetId: widget.id, size: widget.size });
            onDone();
          }}
        >
          Save and add to home screen
        </Button>
      </Section>
    </SettingsPage>
  );
}
