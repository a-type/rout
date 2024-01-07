import { ClientSession } from '@long-game/game-definition';
import { GlobalState } from './gameDefinition.js';

export interface GameRecapProps {
  session: ClientSession;
  globalState: GlobalState;
}

export function GameRecap({ session, globalState }: GameRecapProps) {
  return <div>The secret number was {globalState.secretNumber}</div>;
}

export default GameRecap;
