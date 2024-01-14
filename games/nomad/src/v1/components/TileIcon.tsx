import { TerrainFeature, TerrainType } from '../gameDefinition.js';
import City from './icons/City.js';
import Mountains from './icons/Mountains.js';
import Swamp from './icons/Swamp.js';
import Temple from './icons/Temple.js';

function TileIcon({
  type,
  ...props
}: { type: TerrainType | TerrainFeature } & React.ComponentProps<
  typeof Mountains
>) {
  const Component = (
    {
      mountain: null,
      swamp: null,
      forest: null,
      desert: null,
      grassland: null,
      ocean: null,
      tundra: null,
      city: City,
      temple: Temple,
    } as Record<TerrainType | TerrainFeature, typeof Mountains | null>
  )[type];
  if (!Component) {
    return null;
  }
  return <Component {...props} />;
}

export default TileIcon;
