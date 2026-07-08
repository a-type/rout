import { Viewport } from '@a-type/ui';
import { boundsRegistry } from '@long-game/game-ui';
import { hooks } from './gameClient.js';
import { Map } from './Map.js';
import { PlacementOptions } from './PlacementOptions.js';
import { zoomGlobal } from './viewportGlobals.js';

export interface GameplayProps {}

function onZoomChange(val: number) {
  zoomGlobal.set(val);
  boundsRegistry.measureAll();
}
function onCenterChange(center: { x: number; y: number }) {
  boundsRegistry.measureAll();
}

export const Gameplay = hooks.withGame<GameplayProps>(function Gameplay({
  gameSuite,
}) {
  return (
    <>
      <Viewport
        className="w-full h-full"
        minZoom={0.5}
        maxZoom={6}
        defaultZoom={1}
        onZoomChange={onZoomChange}
        onCenterChange={onCenterChange}
      >
        <Viewport.Control>
          <PlacementOptions className="absolute bottom-md left-1/2 -translate-x-1/2 z-1" />
        </Viewport.Control>
        <Map />
      </Viewport>
    </>
  );
});
