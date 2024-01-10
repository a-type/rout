import { NeuronClient, useGameClient } from './gameClient.js';

export function useTile(id: string) {
  const client = useGameClient();
  return getTile(client, id);
}

export function getTile(client: NeuronClient, id: string) {
  if (!client.state) return null;
  const { hand, grid } = client.state;
  const inHand = hand.tiles.find((tile) => tile?.id === id);
  if (inHand) return inHand;
  const inGrid = Object.values(grid)
    .flat()
    .find((tile) => tile?.id === id);
  if (inGrid) return inGrid;
}

export function useMove() {
  const client = useGameClient();
  return client.queuedMoves[0] ?? null;
}
