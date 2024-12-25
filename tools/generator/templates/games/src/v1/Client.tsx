import { create } from '@long-game/game-client/client';
import { gameDefinition } from './gameDefinition.js';

const { useCurrentTurn, usePriorRounds } = create(gameDefinition);

export function Client() {
  return <div>TODO</div>;
}

export default Client;
