import type { ComponentType } from 'react';
import { ClockIcon, MessagesIcon, NotesIcon, PhoneIcon } from './appIcons';

export interface AppDefinition {
  id: string;
  name: string;
  icon: ComponentType;
  // Later: the app's screen component and which modes allow it.
}

/** Every app in the OS is listed here, in one place. */
export const APPS: AppDefinition[] = [
  { id: 'phone', name: 'Phone', icon: PhoneIcon },
  { id: 'messages', name: 'Messages', icon: MessagesIcon },
  { id: 'notes', name: 'Notes', icon: NotesIcon },
  { id: 'clock', name: 'Clock', icon: ClockIcon },
];

/** The 4 apps shown in the dock, left to right. */
export const DOCK_APP_IDS = ['phone', 'messages', 'notes', 'clock'];

export function getApp(id: string): AppDefinition | undefined {
  return APPS.find((app) => app.id === id);
}
