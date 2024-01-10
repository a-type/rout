import { ClientSession } from '@long-game/game-definition';
import { GlobalState } from './gameDefinition.js';

export interface GameRecapProps {
  session: ClientSession;
  globalState: GlobalState;
}

export function GameRecap({ session, globalState }: GameRecapProps) {
  return <div>Your post-game recap goes here</div>;
}

export default GameRecap;
