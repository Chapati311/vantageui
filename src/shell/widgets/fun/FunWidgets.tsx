import { motion, useAnimate } from 'motion/react';
import { useState } from 'react';
import { DotNumber } from '../../../components/DotNumber';
import { Widget } from '../../../components/Widget';
import { playSound } from '../../../system/sounds';
import { SPRING } from '../../../theme/tokens';
import styles from './FunWidgets.module.css';

/** Which of the 9 pip positions (3x3, left to right, top to bottom) are lit for 1-6. */
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

/** Tap to roll a die: it tumbles, then lands on 1-6. */
export function DiceWidget() {
  const [value, setValue] = useState(() => 1 + Math.floor(Math.random() * 6));
  const [face, animateFace] = useAnimate();

  const roll = () => {
    playSound('tick');
    void animateFace(face.current, { rotate: [0, 200, 360], scale: [1, 0.8, 1] }, { duration: 0.45 });
    window.setTimeout(() => setValue(1 + Math.floor(Math.random() * 6)), 220);
  };

  return (
    <Widget shape="rounded">
      <button type="button" className={styles.button} onClick={roll} aria-label={`Die showing ${value}. Tap to roll`}>
        <span ref={face} className={styles.die}>
          {Array.from({ length: 9 }, (_, index) => (
            <span key={index} className={PIPS[value].includes(index) ? styles.pip : styles.pipOff} />
          ))}
        </span>
      </button>
    </Widget>
  );
}

/** Tap to flip a coin: it spins and lands on heads or tails. */
export function CoinWidget() {
  const [heads, setHeads] = useState(true);
  const [turns, setTurns] = useState(0);

  const flip = () => {
    const nextHeads = Math.random() < 0.5;
    playSound('tick');
    // Spin a few half-turns; an odd number of half-turns shows the other side
    setTurns((current) => current + 6 + (nextHeads === heads ? 0 : 1));
    setHeads(nextHeads);
  };

  return (
    <Widget shape="circle">
      <button type="button" className={styles.button} onClick={flip} aria-label={`${heads ? 'Heads' : 'Tails'}. Tap to flip`}>
        <motion.span className={styles.coin} animate={{ rotateY: turns * 180 }} transition={{ ...SPRING.ui, stiffness: 120 }}>
          <span className={styles.coinFace}>{heads ? 'H' : 'T'}</span>
        </motion.span>
      </button>
      <span className={`label ${styles.coinLabel}`}>{heads ? 'Heads' : 'Tails'}</span>
    </Widget>
  );
}

const TALLY_KEY = 'vantage.tally.v1';

function loadTally(): number {
  try {
    return Number(localStorage.getItem(TALLY_KEY)) || 0;
  } catch {
    return 0;
  }
}

/** Counts taps. The minus takes one off; holding the number resets it. */
export function TallyWidget() {
  const [count, setCount] = useState(loadTally);

  const change = (next: number) => {
    const value = Math.max(0, Math.min(9999, next));
    setCount(value);
    playSound(next > count ? 'toggleOn' : 'toggleOff');
    try {
      localStorage.setItem(TALLY_KEY, String(value));
    } catch {
      // Counting still works until reload.
    }
  };

  return (
    <Widget shape="rounded">
      <div className={styles.tally}>
        <button type="button" className={styles.tallyMinus} onClick={() => change(count - 1)} aria-label="One less">
          −
        </button>
        <button
          type="button"
          className={styles.tallyCount}
          onClick={() => change(count + 1)}
          onContextMenu={(event) => {
            event.preventDefault();
            change(0);
          }}
          aria-label={`Count ${count}. Tap to add one`}
        >
          <DotNumber value={String(count)} size={40} />
        </button>
      </div>
    </Widget>
  );
}
