import { Viewport } from '@long-game/game-ui';
import { hooks } from './gameClient.js';
import { Map } from './Map.js';
import { PlacementOptions } from './PlacementOptions.js';
import { zoomGlobal } from './viewportGlobals.js';

export interface GameplayProps {}

export const Gameplay = hooks.withGame<GameplayProps>(function Gameplay({
  gameSuite,
}) {
  return (
    <>
      <Viewport
        className="w-full h-full"
        minZoom={0.75}
        maxZoom={6}
        defaultZoom={1}
        controlContent={
          <PlacementOptions className="absolute bottom-md left-1/2 -translate-x-1/2 z-1" />
        }
        onZoomChange={(val) => zoomGlobal.set(val)}
      >
        <Map />
      </Viewport>
    </>
  );
});
