import { PrefixedId } from '@long-game/common';

export const fortressTileTypes = [
  'lodging',
  'wall',
  'workshop',
  'ballista',
] as const;
export type FortressTileType = (typeof fortressTileTypes)[number];

export const terrainTileTypes = [
  'plain',
  'overgrowth',
  'mountain',
  'deposit',
] as const;
export type TerrainTileType = (typeof terrainTileTypes)[number];

export type TerrainTileData = {
  type: TerrainTileType;
};
export type FortressTileData = {
  type: FortressTileType;
  health: number;
  destroyedRoundIndex?: number;
  playerId: PrefixedId<'u'>;
  /** 0-1, percent. */
  buildProgress: number;
};
export type TileData = TerrainTileData | FortressTileData;
export type TileType = TerrainTileType | FortressTileType;

export function isFortressTile(tile: TileData): tile is FortressTileData {
  return fortressTileTypes.includes(tile.type as FortressTileType);
}

export function isTerrainTile(tile: TileData): tile is TerrainTileData {
  return terrainTileTypes.includes(tile.type as TerrainTileType);
}

export const weightedFortressTileTypes: FortressTileType[] = [
  'wall',
  'wall',
  'wall',
  'wall',
  'wall',
  'wall',
  'wall',
  'lodging',
  'lodging',
  'lodging',
  'workshop',
  'workshop',
  'ballista',
];

export const baseTileHealth: Record<FortressTileType, number> = {
  lodging: 10,
  workshop: 6,
  wall: 20,
  ballista: 4,
};

export function newFortressTile(
  type: FortressTileType,
  playerId: PrefixedId<'u'>,
  buildProgress?: number,
): FortressTileData;
export function newFortressTile(
  type: FortressTileType,
): Omit<FortressTileData, 'playerId'>;
export function newFortressTile(
  type: FortressTileType,
  playerId?: PrefixedId<'u'>,
  buildProgress?: number,
) {
  return {
    type,
    health: baseTileHealth[type],
    playerId,
    buildProgress: buildProgress ?? 0,
  };
}
export function newTerrainTile(type: TerrainTileType) {
  return {
    type,
  } satisfies TerrainTileData;
}
