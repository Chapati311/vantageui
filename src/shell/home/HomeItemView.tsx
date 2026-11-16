import type { Ref } from 'react';
import { AppIcon } from '../../components/AppIcon';
import { Icon } from '../../components/Icon';
import { getApp } from '../../system/appRegistry';
import type { WidgetSize } from '../widgets/types';
import { getWidget } from '../widgets/widgetRegistry';
import type { HomeItem } from './layout';
import styles from './HomeItemView.module.css';

interface HomeItemViewProps {
  item: HomeItem;
  /** Position and size in pixels */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Edit mode: wiggle and show the resize button */
  editing?: boolean;
  /** Invisible while its dragged copy is on screen */
  hidden?: boolean;
  /** This is the copy that follows the finger */
  ghost?: boolean;
  /** Used to make neighbours wiggle out of step */
  index?: number;
  onResize?: (id: string) => void;
  frameRef?: Ref<HTMLDivElement>;
}

/** Draws one home screen item (a widget or an app icon) at its position. */
export function HomeItemView({
  item,
  x,
  y,
  width,
  height,
  editing = false,
  hidden = false,
  ghost = false,
  index = 0,
  onResize,
  frameRef,
}: HomeItemViewProps) {
  const widget = item.kind === 'widget' ? getWidget(item.ref) : undefined;
  const app = item.kind === 'app' ? getApp(item.ref) : undefined;
  if (!widget && !app) return null;

  const WidgetComponent = widget?.component;
  const canResize = editing && !ghost && !!widget && widget.sizes.length > 1;

  const frameClass = [styles.frame, hidden && styles.hidden, ghost && styles.ghost]
    .filter(Boolean)
    .join(' ');
  const contentClass = [
    styles.content,
    editing && styles.editing,
    editing && !ghost && styles.wiggle,
    index % 2 === 1 && styles.wiggleAlt,
    ghost && styles.lifted,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={frameRef}
      className={frameClass}
      data-item-id={ghost ? undefined : item.id}
      style={{ width, height, transform: `translate3d(${x}px, ${y}px, 0)` }}
    >
      <div className={contentClass}>
        {WidgetComponent && <WidgetComponent size={`${item.w}x${item.h}` as WidgetSize} />}
        {app && <AppIcon app={app} />}
      </div>
      {canResize && (
        <button
          type="button"
          className={styles.resize}
          data-no-gesture
          aria-label={`Resize ${widget.name}`}
          onClick={() => onResize?.(item.id)}
        >
          <span className={styles.resizeBadge}>
            <Icon>
              <path d="M14 5h5v5M10 19H5v-5M19 5l-6 6M5 19l6-6" />
            </Icon>
          </span>
        </button>
      )}
    </div>
  );
}
