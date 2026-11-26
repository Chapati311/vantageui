/**
 * Is this element where someone can see it? For animation loops (music
 * visualizers, live widgets): they should only draw while the answer is yes.
 *
 * "No" when: it is scrolled or paged off screen, the app is in the background,
 * or an app fully covers the home screen (the Shell calls setHomeCovered).
 * `onChange` is called whenever the answer changes, and once at the start.
 * Returns a function that stops watching.
 */

let homeCovered = false;
const listeners = new Set<() => void>();

/** The Shell: an app now fully covers the home screen (or no longer does). */
export function setHomeCovered(covered: boolean): void {
  if (homeCovered === covered) return;
  homeCovered = covered;
  listeners.forEach((listener) => listener());
}

export function isHomeCovered(): boolean {
  return homeCovered;
}

export function watchOnScreen(element: Element, onChange: (visible: boolean) => void): () => void {
  let intersecting = true;
  let last: boolean | null = null;
  // Inside an app (not on the home screen), covering home doesn't hide it
  const onHome = () => !!element.closest('[data-home-layer]');
  const update = () => {
    const visible = intersecting && document.visibilityState === 'visible' && !(homeCovered && onHome());
    if (visible === last) return;
    last = visible;
    onChange(visible);
  };
  let observer: IntersectionObserver | null = null;
  if (typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver((entries) => {
      intersecting = entries[entries.length - 1].isIntersecting;
      update();
    });
    observer.observe(element);
  }
  listeners.add(update);
  document.addEventListener('visibilitychange', update);
  update();
  return () => {
    observer?.disconnect();
    listeners.delete(update);
    document.removeEventListener('visibilitychange', update);
  };
}
