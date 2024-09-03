import { GlobalState } from './gameDefinition.js';
import { FragmentOf, clientSessionFragment } from '@long-game/game-client';

export interface GameRecapProps {
  session: FragmentOf<typeof clientSessionFragment>;
  globalState: GlobalState;
}

export function GameRecap({ session, globalState }: GameRecapProps) {
  return <div>Your post-game recap goes here</div>;
}

export default GameRecap;
