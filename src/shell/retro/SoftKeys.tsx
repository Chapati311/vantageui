import { Pressable } from '../../components/Pressable';
import styles from './Retro.module.css';

interface SoftKey {
  label: string;
  onPress: () => void;
}

/** The labels above an old phone's two buttons under the screen ("Menu", "Names"). */
export function SoftKeys({ left, right, terminal }: { left?: SoftKey; right?: SoftKey; terminal?: boolean }) {
  const key = (softKey: SoftKey | undefined, side: string) =>
    softKey ? (
      <Pressable className={`${styles.softKey} ${styles[side]}`} onClick={softKey.onPress}>
        {terminal ? `[${softKey.label.toUpperCase()}]` : softKey.label}
      </Pressable>
    ) : (
      <span className={styles.softKey} />
    );

  return (
    <div className={styles.softKeys}>
      {key(left, 'leftKey')}
      {key(right, 'rightKey')}
    </div>
  );
}
