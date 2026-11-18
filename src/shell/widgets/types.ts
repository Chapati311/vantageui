import type { ComponentType } from 'react';

/** Width x height in grid cells. */
export type WidgetSize = '1x1' | '2x1' | '2x2' | '4x1' | '4x2';

/** The groups in the widget gallery. */
export type WidgetCategory = 'time' | 'space' | 'music' | 'games' | 'productivity' | 'info' | 'fun' | 'devices' | 'lab';

/** Every widget component gets the size it is currently shown at. */
export interface WidgetProps {
  size: WidgetSize;
}

/** What a widget is allowed to do when it is tapped. */
export interface WidgetTapContext {
  openSearch: () => void;
  /** Opens an app, zooming out of this widget */
  openApp: (appId: string) => void;
}

export interface WidgetDefinition {
  id: string;
  name: string;
  /** Where it is listed in the widget gallery */
  category: WidgetCategory;
  /** One short line for the gallery */
  description: string;
  component: ComponentType<WidgetProps>;
  /** Sizes this widget can be shown at. Resizing cycles through them. */
  sizes: WidgetSize[];
  /** Has an "Edit" in its long-press menu (the widget reacts with useWidgetEdit) */
  editable?: boolean;
  /** The app a tap opens (growing out of the widget), unless onTap says otherwise */
  appId?: string;
  /** Optional: what happens when the whole widget is tapped */
  onTap?: (context: WidgetTapContext) => void;
}
