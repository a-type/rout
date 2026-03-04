import clsx from 'clsx';
import { hooks } from './gameClient.js';
import { PlayerSwitcher } from './PlayerSwitcher.js';

export interface GameplayProps {}

export const Gameplay = hooks.withGame<GameplayProps>(function Gameplay({
  gameSuite,
}) {
  return (
    <div
      data-gameplay
      className={clsx('w-full grow flex flex-col gap-md p-md items-center')}
    >
      <PlayerSwitcher className="shrink grow basis-0 w-full" />
    </div>
  );
});
