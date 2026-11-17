import { DotNumber } from '../../../components/DotNumber';
import { Widget } from '../../../components/Widget';
import type { WidgetSize } from '../types';
import type { LabBlock, LabWidget as LabWidgetData } from './labStore';
import { useBindings, type BoundValue } from './useBinding';
import styles from './LabWidget.module.css';

/** Dot-matrix only knows digits, a few signs and spaces; anything else shows as text. */
const DOT_SAFE = /^[0-9:.%° -]+$/;

function Block({ block, value }: { block: LabBlock; value: BoundValue }) {
  const label = block.text && block.binding !== 'custom' ? <span className="label">{block.text}</span> : null;
  switch (block.kind) {
    case 'number':
      return (
        <div className={styles.block}>
          {label}
          {DOT_SAFE.test(value.text) ? <DotNumber value={value.text.replace('°', '')} size={28} /> : <span className={styles.big}>{value.text}</span>}
        </div>
      );
    case 'ring': {
      const circumference = 2 * Math.PI * 16;
      return (
        <div className={styles.block}>
          <svg className={styles.ring} viewBox="0 0 40 40" aria-label={value.text}>
            <circle className={styles.ringTrack} cx="20" cy="20" r="16" />
            <circle className={styles.ringFill} cx="20" cy="20" r="16" strokeDasharray={`${circumference * value.fraction} ${circumference}`} transform="rotate(-90 20 20)" />
          </svg>
          {label}
        </div>
      );
    }
    case 'bar':
      return (
        <div className={styles.block}>
          {label}
          <span className={styles.bar} aria-label={value.text}>
            <span className={styles.barFill} style={{ transform: `scaleX(${value.fraction})` }} />
          </span>
        </div>
      );
    case 'dots':
      return (
        <div className={styles.block}>
          {label}
          <span className={styles.dots} aria-label={value.text}>
            {Array.from({ length: 20 }, (_, index) => (
              <span key={index} className={index < Math.round(value.fraction * 20) ? styles.dotOn : styles.dotOff} />
            ))}
          </span>
        </div>
      );
    case 'image':
      return block.image ? <img className={styles.image} src={block.image} alt="" /> : <span className={styles.text}>No picture</span>;
    default:
      return (
        <div className={styles.block}>
          {label}
          <span className={styles.text}>{value.text}</span>
        </div>
      );
  }
}

/** A widget built in the Widget Lab: its blocks, stacked (or side by side when wide). */
export function LabWidgetView({ widget, size }: { widget: LabWidgetData; size: WidgetSize }) {
  const read = useBindings();
  const wide = size === '4x1' || size === '2x1';
  return (
    <Widget shape="rounded">
      <div className={`${styles.lab} ${wide ? styles.row : ''}`}>
        {widget.blocks.map((block) => (
          <Block key={block.id} block={block} value={read(block.binding, block.text)} />
        ))}
      </div>
    </Widget>
  );
}
