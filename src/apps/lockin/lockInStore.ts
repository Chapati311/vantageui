import { useSyncExternalStore } from 'react';
import type { GradingSystem, PromotionRules } from './grading';
import { SWISS_RULES } from './grading';

/**
 * Everything Lock In remembers (except finished focus sessions, which live
 * in lockInStats.ts): your setup, subjects and grades, timetable, homework,
 * exams, work tasks, app blocking and Wind Down.
 */

export type Role = 'student' | 'working';
export type GradeType = 'exam' | 'quiz' | 'oral' | 'project';

export interface Subject {
  id: string;
  name: string;
  /** A color for the subject's dot (hex) */
  color: string;
  /** One or two characters shown in its circle */
  glyph: string;
}

export interface Grade {
  id: string;
  subjectId: string;
  value: number;
  weight: number;
  type: GradeType;
  /** "2026-11-17" */
  date: string;
  note: string;
}

export interface Lesson {
  id: string;
  subjectId: string;
  /** 0 = Monday ... 4 = Friday (5, 6 weekend) */
  day: number;
  /** "08:00" */
  start: string;
  end: string;
  room: string;
}

export interface Homework {
  id: string;
  subjectId: string;
  title: string;
  due: string;
  done: boolean;
}

export interface Exam {
  id: string;
  subjectId: string;
  title: string;
  date: string;
  /** Focus minutes planned per study day */
  minutesPerDay: number;
}

export interface WorkTask {
  id: string;
  /** In Work mode, "subjects" are projects */
  projectId: string;
  title: string;
  priority: 'high' | 'normal' | 'low';
  deadline: string | null;
  done: boolean;
}

export interface Blocking {
  /** App ids that distract you */
  distractions: string[];
  /** Lock the distractions while a focus session runs */
  duringSessions: boolean;
  /** Lock them during Wind Down */
  duringWindDown: boolean;
  /** Daily schedule: "21:00"-"07:00", or null */
  schedule: { from: string; to: string } | null;
  /** Manually locked until (ms), or null */
  lockedUntil: number | null;
  /** Minutes per day per app (0 = no limit) */
  limits: Record<string, number>;
  /** No emergency unlock at all */
  strict: boolean;
  /** Run the "FocusOn" / "FocusOff" Shortcuts to silence notifications */
  useFocusShortcuts: boolean;
}

export interface WindDownPlan {
  enabled: boolean;
  /** When Wind Down starts and the sleep target */
  start: string;
  sleep: string;
  /** Tonight's routine (reset every day) */
  journal: string;
  topThree: string[];
  routineDate: string;
}

export interface LockInData {
  setupDone: boolean;
  role: Role;
  country: string;
  gradingSystemId: string;
  customSystems: GradingSystem[];
  rules: PromotionRules;
  /** Minutes of focus per day you aim for */
  dailyGoal: number;
  subjects: Subject[];
  grades: Grade[];
  lessons: Lesson[];
  homework: Homework[];
  exams: Exam[];
  tasks: WorkTask[];
  blocking: Blocking;
  windDown: WindDownPlan;
  /** App id -> minutes used today, and the day it was counted */
  usage: { day: string; minutes: Record<string, number> };
}

const STORAGE_KEY = 'vantage.lockin.v1';

export const DEFAULT_DATA: LockInData = {
  setupDone: false,
  role: 'student',
  country: 'ch',
  gradingSystemId: 'ch',
  customSystems: [],
  rules: SWISS_RULES,
  dailyGoal: 120,
  subjects: [],
  grades: [],
  lessons: [],
  homework: [],
  exams: [],
  tasks: [],
  blocking: {
    distractions: [],
    duringSessions: true,
    duringWindDown: true,
    schedule: null,
    lockedUntil: null,
    limits: {},
    strict: false,
    useFocusShortcuts: false,
  },
  windDown: { enabled: false, start: '21:30', sleep: '22:30', journal: '', topThree: ['', '', ''], routineDate: '' },
  usage: { day: '', minutes: {} },
};

function load(): LockInData {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (saved && typeof saved === 'object') {
      return {
        ...DEFAULT_DATA,
        ...saved,
        blocking: { ...DEFAULT_DATA.blocking, ...saved.blocking },
        windDown: { ...DEFAULT_DATA.windDown, ...saved.windDown },
        rules: { ...DEFAULT_DATA.rules, ...saved.rules },
      };
    }
  } catch {
    // Fresh start
  }
  return DEFAULT_DATA;
}

let data = load();
const listeners = new Set<() => void>();

export function updateLockIn(patch: Partial<LockInData> | ((current: LockInData) => Partial<LockInData>)): void {
  data = { ...data, ...(typeof patch === 'function' ? patch(data) : patch) };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Kept until reload.
  }
  listeners.forEach((listener) => listener());
}

export function getLockIn(): LockInData {
  return data;
}

export function useLockIn(): LockInData {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => data,
  );
}

export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** Adds, replaces (same id) or removes (remove = true) an item in one of the lists. */
export function upsert<K extends 'subjects' | 'grades' | 'lessons' | 'homework' | 'exams' | 'tasks'>(
  key: K,
  item: LockInData[K][number],
  remove = false,
): void {
  updateLockIn((current) => {
    const list = current[key] as { id: string }[];
    const without = list.filter((entry) => entry.id !== item.id);
    return { [key]: remove ? without : [...without, item] } as Partial<LockInData>;
  });
}

export const SUBJECT_COLORS = ['#60A5FA', '#F472B6', '#34D399', '#FBBF24', '#A78BFA', '#F87171', '#22D3EE', '#FB923C', '#A3E635', '#E879F9'];

/** The country picked in setup decides the starting grading system. */
export const COUNTRIES = [
  { id: 'ch', name: 'Switzerland', system: 'ch' },
  { id: 'de', name: 'Germany', system: 'de' },
  { id: 'at', name: 'Austria', system: 'at' },
  { id: 'fr', name: 'France', system: 'fr' },
  { id: 'nl', name: 'Netherlands', system: 'nl' },
  { id: 'it', name: 'Italy', system: 'it' },
  { id: 'uk', name: 'United Kingdom', system: 'uk-gcse' },
  { id: 'us', name: 'United States', system: 'us' },
  { id: 'in', name: 'India', system: 'in-pct' },
];
