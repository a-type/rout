import { GlobalState } from './gameDefinition.js';

export interface GameRecapProps {
  globalState: GlobalState;
}

export function GameRecap({ globalState }: GameRecapProps) {
  return <div>The secret number was {globalState.secretNumber}</div>;
}

export default GameRecap;
