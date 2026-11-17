import { useEffect, useState } from 'react';
import { Button } from '../../../components/kit';
import { playSound } from '../../../system/sounds';
import { reportScore, useArcade } from '../arcadeStore';
import { GameFrame } from '../GameFrame';
import { daysOld, feedPet, moodOf, playWithPet, usePet } from '../petStore';
import { PetSprite } from './PetSprite';
import styles from '../Arcade.module.css';

const MOOD_WORDS = { happy: 'Vanta is happy', okay: 'Vanta is fine', hungry: 'Vanta is hungry', sad: 'Vanta is bored' };

/** Vanta Pet: feed it and play with it. It also loves it when you focus with Lock In. */
export function Pet() {
  const pet = usePet();
  const { best } = useArcade();
  const [bounce, setBounce] = useState(false);
  const mood = moodOf(pet);
  const days = daysOld(pet);

  useEffect(() => {
    reportScore('pet', days);
  }, [days]);

  const cheer = (action: () => void) => {
    action();
    playSound('toggleOn');
    setBounce(true);
    window.setTimeout(() => setBounce(false), 600);
  };

  return (
    <GameFrame
      score={days}
      best={best.pet ?? 0}
      controls={
        <>
          <Button onPress={() => cheer(feedPet)}>Feed</Button>
          <Button onPress={() => cheer(playWithPet)}>Play</Button>
        </>
      }
    >
      <div className={styles.petScene}>
        <PetSprite mood={mood} size={180} bounce={bounce} />
        <span className={styles.petMood}>{MOOD_WORDS[mood]}</span>
        <div className={styles.petBars}>
          <span className="label">Food</span>
          <span className={styles.petBar}>
            <span className={styles.petBarFill} style={{ transform: `scaleX(${pet.food / 100})` }} />
          </span>
          <span className="label">Joy</span>
          <span className={styles.petBar}>
            <span className={styles.petBarFill} style={{ transform: `scaleX(${pet.joy / 100})` }} />
          </span>
        </div>
        <span className="label">{days === 0 ? 'Born today' : days === 1 ? '1 day old' : `${days} days old`}</span>
      </div>
    </GameFrame>
  );
}
