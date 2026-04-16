import { getGameOrigin } from '@long-game/common';
import { GameModule } from '@long-game/game-definition';

export function getGameUrl(
  game: GameModule,
  version: { version: `v${string}`; devUIPort: number },
  env: ApiBindings,
): string {
  return getGameOrigin(
    game.id,
    version.version,
    version.devUIPort,
    !!env.DEV_MODE,
  );
}
