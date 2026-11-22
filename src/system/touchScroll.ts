/**
 * Scrolling that always works on the phone.
 *
 * Found on the iPhone (iOS 16.3, WKWebView, recorded touch by touch): a swipe
 * that STARTS on a button, card or row inside a scrolling list never begins
 * native scrolling - the touch events arrive, nothing cancels them, but the
 * list doesn't move. Only swipes that start on empty space scrolled. That made
 * Customise, the retro menu and many lists feel stuck.
 *
 * So, for every vertical swipe: find the list under the finger; if iOS isn't
 * scrolling it after the first moves, scroll it here (following the finger,
 * then gliding on with momentum). When native scrolling does work, this does
 * nothing. A swipe never counts as a tap. Sliders, dials, text fields,
 * sideways swipes and anything marked data-no-touch-scroll are left alone.
 */

const SKIP = '[role="slider"], input, textarea, select, [contenteditable="true"], [data-no-touch-scroll], [data-no-drag]';

function scrollerOf(target: Element | null): HTMLElement | null {
  for (let el = target as HTMLElement | null; el && el !== document.body; el = el.parentElement) {
    const style = getComputedStyle(el);
    if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1) return el;
  }
  return null;
}

export function installTouchScroll(): void {
  if (!('ontouchstart' in window)) return;
  let scroller: HTMLElement | null = null;
  let startX = 0;
  let startY = 0;
  let startTop = 0;
  let lastY = 0;
  let lastT = 0;
  let velocity = 0;
  let mode: 'undecided' | 'native' | 'ours' | 'ignore' = 'ignore';
  let nativeTopAtDecision = 0;
  let swallowClick = false;
  let frame = 0;

  window.addEventListener(
    'touchstart',
    (event) => {
      cancelAnimationFrame(frame);
      swallowClick = false;
      if (event.touches.length !== 1) {
        mode = 'ignore';
        return;
      }
      const target = event.target as Element;
      scroller = target.closest(SKIP) ? null : scrollerOf(target);
      if (!scroller) {
        mode = 'ignore';
        return;
      }
      startX = event.touches[0].clientX;
      startY = lastY = event.touches[0].clientY;
      startTop = scroller.scrollTop;
      lastT = performance.now();
      velocity = 0;
      mode = 'undecided';
    },
    { passive: true, capture: true },
  );

  window.addEventListener(
    'touchmove',
    (event) => {
      if (mode === 'ignore' || mode === 'native' || !scroller || event.touches.length !== 1) return;
      const x = event.touches[0].clientX;
      const y = event.touches[0].clientY;
      if (mode === 'undecided') {
        const dx = Math.abs(x - startX);
        const dy = Math.abs(y - startY);
        if (dx < 8 && dy < 8) return;
        // Sideways (home pages, swipe-to-delete): not ours
        if (dx > dy) {
          mode = 'ignore';
          return;
        }
        // Did iOS start scrolling by itself? Then leave it to iOS.
        nativeTopAtDecision = scroller.scrollTop;
        mode = nativeTopAtDecision !== startTop ? 'native' : 'ours';
        if (mode === 'native') return;
      }
      const top = startTop + (startY - y);
      scroller.scrollTop = top;
      swallowClick = true;
      if (event.cancelable) event.preventDefault();
      const now = performance.now();
      velocity = 0.8 * ((lastY - y) / Math.max(1, now - lastT)) + 0.2 * velocity;
      lastY = y;
      lastT = now;
    },
    { passive: false, capture: true },
  );

  const end = () => {
    if (mode !== 'ours' || !scroller) return;
    const el = scroller;
    let v = velocity * 16; // px per frame
    const glide = () => {
      if (Math.abs(v) < 0.4) return;
      const before = el.scrollTop;
      el.scrollTop += v;
      if (el.scrollTop === before) return; // reached an end
      v *= 0.95;
      frame = requestAnimationFrame(glide);
    };
    frame = requestAnimationFrame(glide);
    mode = 'ignore';
  };
  window.addEventListener('touchend', end, { passive: true, capture: true });
  window.addEventListener('touchcancel', end, { passive: true, capture: true });

  // The click iOS sends after a swipe we scrolled is not a tap
  window.addEventListener(
    'click',
    (event) => {
      if (!swallowClick) return;
      swallowClick = false;
      event.stopPropagation();
      event.preventDefault();
    },
    true,
  );
}
