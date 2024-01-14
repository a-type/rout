import { NeuronClient, useGameClient } from './gameClient.js';
import { toCoordinateKey } from './tiles.js';

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

export function useLastTurnWasRejected() {
  const client = useGameClient();

  // grab previous round and find our turn
  const lastRound = client.previousRounds[client.previousRounds.length - 1];

  if (!lastRound) return false;

  const myTurn = lastRound.turns.find(
    (turn) => turn.userId === client.session.localPlayer.id,
  );

  if (!myTurn) return false;

  // is the tile we played in the position we played it?
  const { coordinate, tileId } = myTurn.data;
  const tilesAtCoordinate = client.state?.grid[toCoordinateKey(coordinate)];
  if (!tilesAtCoordinate) return true;

  const tileAtCoordinate = tilesAtCoordinate.find((t) => t?.id === tileId);
  return !tileAtCoordinate;
}
