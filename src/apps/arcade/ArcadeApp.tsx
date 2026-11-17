import type { ComponentType } from 'react';
import { BackIcon } from '../../components/glyphs';
import { CircleButton } from '../../components/CircleButton';
import { AppShell } from '../../components/kit';
import { Pressable } from '../../components/Pressable';
import { DotNumber } from '../../components/DotNumber';
import { GAMES, openGame, useArcade, type GameId } from './arcadeStore';
import { Blocks } from './games/Blocks';
import { Breakout } from './games/Breakout';
import { Flappy } from './games/Flappy';
import { Game2048 } from './games/Game2048';
import { Mines } from './games/Mines';
import { Pet } from './games/Pet';
import { Pong } from './games/Pong';
import { Snake } from './games/Snake';
import { GameIcon } from './GameIcon';
import styles from './Arcade.module.css';

const COMPONENTS: Record<GameId, ComponentType> = {
  snake: Snake,
  pong: Pong,
  blocks: Blocks,
  breakout: Breakout,
  flappy: Flappy,
  '2048': Game2048,
  mines: Mines,
  pet: Pet,
};

/** The Arcade: eight small retro games in a 3x3 grid. Best scores are kept. */
export function ArcadeApp() {
  const { open, best } = useArcade();

  if (open) {
    const Game = COMPONENTS[open];
    const game = GAMES.find((item) => item.id === open)!;
    return (
      <AppShell
        title={game.name}
        fixed
        leading={
          <CircleButton small label="Back" onClick={() => openGame(null)}>
            <BackIcon />
          </CircleButton>
        }
      >
        <Game />
      </AppShell>
    );
  }

  return (
    <AppShell title="Arcade">
      <div className={styles.menu}>
        {GAMES.map((game) => (
          <Pressable key={game.id} className={styles.menuItem} onClick={() => openGame(game.id)}>
            <GameIcon game={game.id} />
            <span className={styles.menuName}>{game.name}</span>
            <span className={styles.menuBest}>
              <DotNumber value={String(best[game.id] ?? 0)} size={28} muted pixels />
            </span>
          </Pressable>
        ))}
      </div>
    </AppShell>
  );
}
