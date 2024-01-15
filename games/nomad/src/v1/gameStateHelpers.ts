import { GlobalState, PlayerData, Terrain } from './gameDefinition.js';
import { ItemId } from './items.js';

export function getPlayerIds(gameState: GlobalState): string[] {
  return Object.keys(gameState.playerData);
}

export function getPlayersByCondition(
  globalState: GlobalState,
  condition: (data: {
    playerState: PlayerData;
    playerId: string;
    terrain: Terrain;
  }) => boolean,
): string[] {
  return getPlayerIds(globalState).filter((id) =>
    condition({
      playerState: globalState.playerData[id],
      playerId: id,
      terrain: getPlayerTerrain(globalState, id),
    }),
  );
}

export function getPlayerTerrain(
  gameState: GlobalState,
  playerId: string,
): Terrain {
  return gameState.terrainGrid[gameState.playerData[playerId].position];
}

export function giveItemToPlayer(
  gameState: GlobalState,
  playerId: string,
  itemId: ItemId,
): void {
  gameState.playerData[playerId].inventory.push(itemId);
}
