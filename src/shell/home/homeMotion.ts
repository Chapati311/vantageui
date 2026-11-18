import { motionValue } from 'motion/react';

/**
 * Where the home pages are, shared outside the home screen: 0 = page 1,
 * 1 = page 2, 1.5 = halfway to page 3. The wallpaper follows it a little
 * (parallax) and the page dots stretch with it. A motion value: changing it
 * moves things without re-rendering React.
 */
export const homePageProgress = motionValue(0);
