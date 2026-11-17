import { useSyncExternalStore } from 'react';
import { rgbToHex, rgbToHsl, type RGB } from '../theme/color';
import { dbDelete, dbGet, dbPut } from './db';

/**
 * The user's own wallpaper photo. It is shrunk to screen size, saved in
 * IndexedDB (too big for localStorage), and analysed once for its colors.
 */

/** Colors taken from a wallpaper, used for "Match wallpaper". */
export interface WallpaperColors {
  /** The color that covers most of the picture */
  dominant: string;
  /** The most colorful color that still covers a good part (becomes the accent) */
  vibrant: string;
  /** A few more colors, shown as suggestions in the accent picker */
  swatches: string[];
}

interface StoredPhoto {
  id: 'wallpaper-photo';
  /** A JPEG as a data: URL */
  dataUrl: string;
  colors: WallpaperColors;
}

/** The longest side of the stored photo, in pixels (iPhone SE screen is 1334 tall) */
const MAX_SIDE = 1334;
const PHOTO_ID = 'wallpaper-photo';

let photo: StoredPhoto | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

/** Reads the saved photo once at startup. */
export function loadWallpaperPhoto(): Promise<void> {
  return dbGet<StoredPhoto>('files', PHOTO_ID)
    .then((stored) => {
      photo = stored ?? null;
    })
    .catch(() => {
      photo = null;
    })
    .finally(() => {
      loaded = true;
      notify();
    });
}

export function getWallpaperPhoto(): StoredPhoto | null {
  return photo;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!loaded) void loadWallpaperPhoto();
  return () => listeners.delete(listener);
}

/** The saved photo, or null. Components re-render when it changes. */
export function useWallpaperPhoto(): StoredPhoto | null {
  return useSyncExternalStore(subscribe, () => photo);
}

/** Subscribe from code outside React (the theme engine). */
export function subscribeToWallpaperPhoto(listener: () => void): () => void {
  return subscribe(listener);
}

/** Loads an image file into an <img>. */
function readImage(source: Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = typeof source === 'string' ? source : URL.createObjectURL(source);
    const image = new Image();
    image.onload = () => {
      if (typeof source !== 'string') URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => reject(new Error('This file could not be read as a picture.'));
    image.src = url;
  });
}

/**
 * Finds the main colors of a picture: it is shrunk to 48x48, every pixel is
 * put into one of 4096 color "buckets", and the buckets are compared.
 */
export function extractColors(image: CanvasImageSource, width: number, height: number): WallpaperColors {
  const size = 48;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return { dominant: '#06090d', vibrant: '#2dd4bf', swatches: [] };
  // Cover the square like the wallpaper covers the screen
  const scale = Math.max(size / width, size / height);
  context.drawImage(image, (size - width * scale) / 2, (size - height * scale) / 2, width * scale, height * scale);
  const pixels = context.getImageData(0, 0, size, size).data;

  const buckets = new Map<number, { count: number; sum: RGB }>();
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bucket = buckets.get(key) ?? { count: 0, sum: [0, 0, 0] as RGB };
    bucket.count++;
    bucket.sum[0] += r;
    bucket.sum[1] += g;
    bucket.sum[2] += b;
    buckets.set(key, bucket);
  }

  const colors = [...buckets.values()]
    .map((bucket) => ({
      count: bucket.count,
      rgb: bucket.sum.map((sum) => sum / bucket.count) as RGB,
    }))
    .sort((a, b) => b.count - a.count);

  const dominant = colors[0]?.rgb ?? [6, 9, 13];

  // "Vibrant": colorful, not too dark or too light, and covering enough of the picture
  const scored = colors
    .map((color) => {
      const [, s, l] = rgbToHsl(color.rgb);
      const lightnessFit = 1 - Math.abs(l - 0.55) * 1.6;
      return { ...color, score: Math.sqrt(color.count) * s * s * Math.max(0, lightnessFit) };
    })
    .sort((a, b) => b.score - a.score);
  const vibrant = scored[0] && scored[0].score > 0 ? scored[0].rgb : ([45, 212, 191] as RGB);

  // A few distinct suggestions (different hues)
  const swatches: string[] = [];
  const hues: number[] = [];
  for (const color of scored) {
    if (swatches.length >= 4 || color.score <= 0) break;
    const [h] = rgbToHsl(color.rgb);
    if (hues.some((other) => Math.min(Math.abs(other - h), 360 - Math.abs(other - h)) < 28)) continue;
    hues.push(h);
    swatches.push(rgbToHex(color.rgb));
  }

  return { dominant: rgbToHex(dominant), vibrant: rgbToHex(vibrant), swatches };
}

/** Shrinks a chosen photo, finds its colors and saves it as the wallpaper photo. */
export async function setWallpaperPhoto(file: Blob): Promise<void> {
  const image = await readImage(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.round(image.naturalWidth * scale);
  const height = Math.round(image.naturalHeight * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This device cannot process pictures.');
  context.drawImage(image, 0, 0, width, height);

  const stored: StoredPhoto = {
    id: PHOTO_ID,
    dataUrl: canvas.toDataURL('image/jpeg', 0.86),
    colors: extractColors(canvas, width, height),
  };
  photo = stored;
  notify();
  await dbPut('files', stored);
}

/** Restores a photo from a backup file (a data: URL). */
export async function restoreWallpaperPhoto(dataUrl: string): Promise<void> {
  const image = await readImage(dataUrl);
  const stored: StoredPhoto = {
    id: PHOTO_ID,
    dataUrl,
    colors: extractColors(image, image.naturalWidth, image.naturalHeight),
  };
  photo = stored;
  notify();
  await dbPut('files', stored);
}

export async function removeWallpaperPhoto(): Promise<void> {
  photo = null;
  notify();
  await dbDelete('files', PHOTO_ID);
}
