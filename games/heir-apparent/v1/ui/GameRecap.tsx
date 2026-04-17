import { hooks } from './gameClient.js';

export interface GameRecapProps {}

export const GameRecap = hooks.withGame<GameRecapProps>(function GameRecap({
  gameSuite,
}) {
  return <div>Game over!</div>;
});
