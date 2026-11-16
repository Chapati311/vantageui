import styles from './PhotoWidget.module.css';

/**
 * A photo frame. For now it shows a PLACEHOLDER picture drawn in code
 * (dusk over layered hills), slightly desaturated so it sits quietly next
 * to the monochrome widgets. Later this can show a real photo.
 */
export function PhotoWidget() {
  return (
    <div className={styles.photo} role="img" aria-label="Photo placeholder">
      <svg className={styles.image} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="photo-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1b2a41" />
            <stop offset="0.55" stopColor="#3d5a73" />
            <stop offset="1" stopColor="#d99a6c" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#photo-sky)" />
        <circle cx="68" cy="56" r="9" fill="#f2c79a" />
        <path d="M0 62 Q18 48 36 60 T72 56 T100 60 V100 H0Z" fill="#33506a" />
        <path d="M0 74 Q22 60 44 72 T84 68 T100 72 V100 H0Z" fill="#223a50" />
        <path d="M0 86 Q26 74 52 84 T100 82 V100 H0Z" fill="#111f2c" />
      </svg>
    </div>
  );
}
