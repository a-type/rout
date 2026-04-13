import { getGameUiOrigin } from '@long-game/common';
import { GameModule } from '@long-game/game-definition';

export function getGameUrl(
  game: GameModule,
  version: { version: `v${string}`; devPort: number },
  env: ApiBindings,
): string {
  return getGameUiOrigin(
    game.id,
    version.version,
    version.devPort,
    !!env.DEV_MODE,
  );
}
