import { GlobalState } from '@long-game/game-scribble-definition/v1';

export interface GameRecapProps {
  globalState: GlobalState;
}

export function GameRecap({ globalState }: GameRecapProps) {
  return <div>Your post-game recap goes here</div>;
}

export default GameRecap;
