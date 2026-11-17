import { useEffect, useSyncExternalStore } from 'react';

/**
 * Vanta, the pixel pet. It gets hungry and bored slowly in real time
 * (even while the app is closed), and cheers up when you feed it, play with
 * it, or finish Lock In focus sessions.
 */

export interface Pet {
  /** 0 (starving) - 100 (full) */
  food: number;
  /** 0 (sad) - 100 (happy) */
  joy: number;
  bornAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'vantage.pet.v1';
/** Points lost per hour */
const HUNGER_PER_HOUR = 4;
const BOREDOM_PER_HOUR = 3;

function load(): Pet {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (saved && typeof saved.food === 'number') return saved;
  } catch {
    // A new pet
  }
  return { food: 80, joy: 80, bornAt: Date.now(), updatedAt: Date.now() };
}

let pet = load();
const listeners = new Set<() => void>();

function save(next: Pet): void {
  pet = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pet));
  } catch {
    // Kept until reload.
  }
  listeners.forEach((listener) => listener());
}

/** Applies the time that passed since the last look. */
function age(now = Date.now()): Pet {
  const hours = (now - pet.updatedAt) / 3_600_000;
  return {
    ...pet,
    food: Math.max(0, pet.food - hours * HUNGER_PER_HOUR),
    joy: Math.max(0, pet.joy - hours * BOREDOM_PER_HOUR),
    updatedAt: now,
  };
}

export function feedPet(): void {
  const current = age();
  save({ ...current, food: Math.min(100, current.food + 25) });
}

export function playWithPet(): void {
  const current = age();
  save({ ...current, joy: Math.min(100, current.joy + 20), food: Math.max(0, current.food - 5) });
}

/** Lock In calls this after a focus session: Vanta loves it when you focus. */
export function petFocusBonus(minutes: number): void {
  const current = age();
  save({ ...current, joy: Math.min(100, current.joy + Math.min(40, minutes)) });
}

export type PetMood = 'happy' | 'okay' | 'hungry' | 'sad';

export function moodOf(value: Pet): PetMood {
  if (value.food < 25) return 'hungry';
  if (value.joy < 25) return 'sad';
  if (value.food > 60 && value.joy > 60) return 'happy';
  return 'okay';
}

export function daysOld(value: Pet): number {
  return Math.floor((Date.now() - value.bornAt) / 86_400_000);
}

/** The pet, aged to now, re-checked every minute. */
export function usePet(): Pet {
  const value = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => pet,
  );
  useEffect(() => {
    const tick = () => save(age());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);
  return value;
}
