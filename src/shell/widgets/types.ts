import type { ComponentType } from 'react';

/** Width x height in grid cells. */
export type WidgetSize = '1x1' | '2x1' | '2x2';

/** Every widget component gets the size it is currently shown at. */
export interface WidgetProps {
  size: WidgetSize;
}

export interface WidgetDefinition {
  id: string;
  name: string;
  component: ComponentType<WidgetProps>;
  /** Sizes this widget can be shown at. Resizing cycles through them. */
  sizes: WidgetSize[];
}
