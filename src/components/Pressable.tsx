import { motion, type HTMLMotionProps } from 'motion/react';
import { MOTION, SPRING } from '../theme/tokens';

/**
 * The press state of the design system: anything tappable shrinks to 96%
 * while a finger is on it and springs back when released.
 * Spread these onto any motion element, or just use <Pressable>.
 */
export const pressState = {
  whileTap: { scale: MOTION.pressScale },
  transition: SPRING.ui,
} as const;

/** A <button> with the press state built in. Use it instead of <button>. */
export function Pressable({ type = 'button', ...props }: HTMLMotionProps<'button'>) {
  return <motion.button type={type} {...pressState} {...props} />;
}
