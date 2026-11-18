import styles from './PixelRing.module.css';

interface PixelRingProps {
  /** How much is lit, 0-1, clockwise from the top */
  fraction: number;
  /** Number of square pixels around the ring */
  count?: number;
  className?: string;
}

/**
 * A ring for retro themes: square pixels snapped to a coarse grid around a
 * circle, lit clockwise from the top. Stepped and blocky, like an old LCD,
 * instead of a smooth line. Drawn in a 100 x 100 box.
 */
export function PixelRing({ fraction, count = 40, className }: PixelRingProps) {
  const lit = Math.round(Math.min(1, Math.max(0, fraction)) * count);
  const cell = 4;
  return (
    <svg className={`${styles.ring} ${className ?? ''}`} viewBox="0 0 100 100" aria-hidden="true" shapeRendering="crispEdges">
      {Array.from({ length: count }, (_, index) => {
        const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
        // Snap each pixel to the 4-unit grid: the ring gets visible steps
        const x = Math.round((50 + 45 * Math.cos(angle) - cell / 2) / cell) * cell;
        const y = Math.round((50 + 45 * Math.sin(angle) - cell / 2) / cell) * cell;
        return <rect key={index} x={x} y={y} width={cell - 0.6} height={cell - 0.6} className={index < lit ? styles.on : styles.off} />;
      })}
    </svg>
  );
}
