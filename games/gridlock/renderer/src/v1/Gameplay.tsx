import { SubmitTurn } from '@long-game/game-ui';
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
      className={clsx('w-full grow flex flex-col gap-md p-md items-center')}
    >
      <BoardRenderer
        board={gameSuite.finalState.board}
        className="shrink grow basis-0"
      />
      <div className="w-full flex flex-col gap-xs items-center shrink-0">
        <TileHand />
        <SubmitTurn />
      </div>
    </div>
  );
});
