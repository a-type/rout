import type { TerrainType } from '../gameDefinition.js';

const colorLookup: Record<TerrainType, string> = {
  desert: '#F6AE2D',
  forest: '#5B7553',
  mountain: '#2B303A',
  ocean: '#166088',
  grassland: '#82C09A',
  swamp: '#94778B',
  tundra: '#92DCE5',
};

export default colorLookup;
