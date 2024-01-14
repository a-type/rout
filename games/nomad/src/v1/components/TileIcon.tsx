import { TerrainType } from '../gameDefinition.js';
import Mountains from './icons/Mountains.js';
import Swamp from './icons/Swamp.js';

function TileIcon({
  type,
  ...props
}: { type: TerrainType } & React.ComponentProps<typeof Mountains>) {
  const Component = (
    {
      mountain: null,
      swamp: null,
      forest: null,
      desert: null,
      grassland: null,
      ocean: null,
      tundra: null,
    } as Record<TerrainType, typeof Mountains | null>
  )[type];
  if (!Component) {
    return null;
  }
  return <Component {...props} />;
}

export default TileIcon;
