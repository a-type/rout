import { hooks } from './gameClient';

export interface GameRecapProps {}

export const GameRecap = hooks.withGame<GameRecapProps>(function GameRecap({
  gameSuite,
}) {
  return <div>Game over!</div>;
});
