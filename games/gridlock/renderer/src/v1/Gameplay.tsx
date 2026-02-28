import clsx from 'clsx';
import { BoardRenderer } from './board/BoardRenderer.js';
import { hooks } from './gameClient.js';
import { TileHand } from './hand/TileHand.js';

export interface GameplayProps {}

export const Gameplay = hooks.withGame<GameplayProps>(function Gameplay({
  gameSuite,
}) {
  return (
    <div
      data-gameplay
      className={clsx('w-full grow flex flex-col gap-md p-md')}
    >
      <BoardRenderer />
      <TileHand />
    </div>
  );
});
