import { PrefixedId } from '@long-game/common';
import { UnitData } from './units.js';

export type TerrainTileData = {
  type: TerrainTileType;
  units: UnitData[];
};
export type FortressTileData = {
  type: FortressTileType;
  health: number;
  destroyedRoundIndex?: number;
  playerId: PrefixedId<'u'>;
  units: UnitData[];
};
export type TileData = TerrainTileData | FortressTileData;

export type TileType = TerrainTileType | FortressTileType;

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

export function newFortressTile(type: FortressTileType) {
  return {
    type,
    health: baseTileHealth[type],
    units: [],
  } satisfies Omit<FortressTileData, 'playerId'>;
}
export function newTerrainTile(type: TerrainTileType) {
  return {
    type,
    units: [],
  } satisfies TerrainTileData;
}
