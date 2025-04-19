import { GlobalState } from '@long-game/game-gudnak-definition/v1';

export interface GameRecapProps {
  globalState: GlobalState;
}

export function GameRecap({ globalState }: GameRecapProps) {
  return <div>{globalState.winner} won the game!</div>;
}

export default GameRecap;
