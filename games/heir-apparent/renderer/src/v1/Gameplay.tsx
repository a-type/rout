import { Viewport } from '@long-game/game-ui';
import { hooks } from './gameClient.js';
import { Map } from './Map.js';

export interface GameplayProps {}

export const Gameplay = hooks.withGame<GameplayProps>(function Gameplay({
  gameSuite,
}) {
  return (
    <Viewport
      className="w-full h-full"
      minZoom={0.5}
      maxZoom={4}
      defaultZoom={0.5}
    >
      <Map />
    </Viewport>
  );
});
