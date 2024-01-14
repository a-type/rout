import type { TerrainType } from '../gameDefinition.js';

export const colorLookup: Record<TerrainType, string> = {
  desert: '#F6AE2D',
  forest: '#5B7553',
  mountain: '#2B303A',
  ocean: '#166088',
  grassland: '#82C09A',
  swamp: '#94778B',
  tundra: '#92DCE5',
};

export const movementCosts: Record<TerrainType, number> = {
  desert: 1,
  forest: 2,
  mountain: 3,
  ocean: 3,
  grassland: 1,
  swamp: 2,
  tundra: 1,
};
