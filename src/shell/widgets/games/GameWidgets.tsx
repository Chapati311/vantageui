import { DotNumber } from '../../../components/DotNumber';
import { Widget } from '../../../components/Widget';
import { GAMES, useArcade, type GameId } from '../../../apps/arcade/arcadeStore';
import { GameIcon } from '../../../apps/arcade/GameIcon';
import { PetSprite } from '../../../apps/arcade/games/PetSprite';
import { moodOf, usePet } from '../../../apps/arcade/petStore';
import styles from './GameWidgets.module.css';

/** A widget for one game: its pixel picture and your best score. Tap to play. */
export function makeGameWidget(game: GameId) {
  const name = GAMES.find((item) => item.id === game)?.name ?? game;
  return function GameWidget() {
    const { best } = useArcade();
    return (
      <Widget shape="rounded">
        <div className={styles.game}>
          <GameIcon game={game} size={44} />
          <span className={styles.name}>{name}</span>
          <span className={styles.best}>
            <span className="label">Best</span>
            <DotNumber value={String(best[game] ?? 0)} size={28} pixels />
          </span>
        </div>
      </Widget>
    );
  };
}

/** Vanta, live: its face shows how it is doing. Tap to visit. */
export function PetWidget() {
  const pet = usePet();
  return (
    <Widget shape="rounded">
      <div className={styles.game}>
        <PetSprite mood={moodOf(pet)} size={72} />
        <span className={styles.name}>Vanta</span>
      </div>
    </Widget>
  );
}
